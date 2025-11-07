/**
 * Payment Routes - DATABASE VERSION
 * Uses MongoDB for persistent payment storage
 * Proper workflow: pending → verified → submitted_to_swift → completed
 *
 * REPLACE payments.js with this file once MongoDB is installed
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../utils/jwtSecurity');
const { createSecurityEvent } = require('../middleware/securityMonitoring');
const { sanitizeRequestBody } = require('../middleware/inputSanitization');
const { authenticateEmployee } = require('../middleware/employeeAuth');

// Database models
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

const router = express.Router();

/**
 * Enhanced input validation for payment data
 */
const validatePaymentData = [
  body('amount')
    .isFloat({ min: 1, max: 10000 })
    .withMessage('Amount must be between $1.00 and $10,000.00'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'ZAR'])
    .withMessage('Currency must be USD, EUR, GBP, or ZAR'),
  body('recipientAccount')
    .matches(/^[A-Z0-9]{8,34}$/)
    .withMessage('Recipient account must be a valid IBAN'),
  body('recipientSwift')
    .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
    .withMessage('SWIFT code must be 8 or 11 characters'),
  body('recipientName')
    .matches(/^[a-zA-Z\s\-'.]{2,100}$/)
    .withMessage('Recipient name must be 2-100 characters'),
  body('reference')
    .optional()
    .matches(/^[a-zA-Z0-9\s-]{1,35}$/)
    .withMessage('Reference must be 1-35 characters')
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    createSecurityEvent('payment_validation_error', {
      userId: req.user?.userId || 'unknown',
      errors: errors.array()
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * CREATE PAYMENT (Customer only)
 * POST /api/payments
 * Creates payment with status="pending" (NOT completed)
 */
router.post(
  '/',
  authenticateToken,
  validatePaymentData,
  handleValidationErrors,
  sanitizeRequestBody,
  async (req, res) => {
    try {
      // Only customers can create payments
      if (req.user.role !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Only customers can create payments'
        });
      }

      const { amount, currency, recipientAccount, recipientSwift, recipientName, reference } = req.body;

      // Get customer details
      const customer = await Customer.findById(req.user.userId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Create payment with status="pending"
      const payment = await Payment.create({
        transactionId,
        customerId: customer._id,
        customerEmail: customer.email,
        amount: parseFloat(amount),
        currency,
        recipientAccount: recipientAccount.toUpperCase(),
        recipientSwift: recipientSwift.toUpperCase(),
        recipientName,
        reference: reference || '',
        status: 'pending'  // ← STARTS AS PENDING!
      });

      // Log payment creation
      createSecurityEvent('payment_created', {
        transactionId,
        customerId: customer._id,
        amount,
        currency,
        status: 'pending'
      });

      console.log(`💰 Payment created: ${transactionId} - ${amount} ${currency} (PENDING)`);

      return res.status(201).json({
        success: true,
        message: 'Payment created successfully and submitted for verification',
        transaction: {
          id: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          recipientName: payment.recipientName,
          status: payment.status,
          createdAt: payment.createdAt
        }
      });

    } catch (error) {
      console.error('Payment creation error:', error);
      createSecurityEvent('payment_creation_error', { error: error.message });

      return res.status(500).json({
        success: false,
        message: 'Failed to create payment. Please try again.'
      });
    }
  }
);

/**
 * GET CUSTOMER'S PAYMENTS
 * GET /api/payments
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const payments = await Payment.find({ customerId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      transactions: payments
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

/**
 * GET PENDING PAYMENTS (Employee only)
 * GET /api/payments/employee/pending
 */
router.get('/employee/pending', authenticateEmployee, async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`📋 Fetched ${pendingPayments.length} pending payments`);

    return res.status(200).json({
      success: true,
      transactions: pendingPayments
    });

  } catch (error) {
    console.error('Get pending payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments'
    });
  }
});

/**
 * GET ALL PAYMENTS WITH FILTER (Employee only)
 * GET /api/payments/employee/all?status=verified
 */
router.get('/employee/all', authenticateEmployee, async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      transactions: payments
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

/**
 * VERIFY PAYMENT (Employee only)
 * POST /api/payments/employee/verify/:id
 * Approve or reject payment
 */
router.post(
  '/employee/verify/:id',
  authenticateEmployee,
  [
    body('verified').isBoolean().withMessage('Verified must be true or false'),
    body('verifierNotes').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { verified, verifierNotes } = req.body;

      // Find payment
      const payment = await Payment.findOne({ transactionId: id });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check if already verified
      if (payment.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Transaction is already ${payment.status}`
        });
      }

      // Verify payment (approve or reject)
      await payment.verify(
        req.user.userId,
        req.user.email,
        verified,
        verifierNotes || ''
      );

      // Log verification
      createSecurityEvent('payment_verified', {
        transactionId: id,
        employeeId: req.user.userId,
        verified,
        newStatus: payment.status
      });

      console.log(`${verified ? '✅' : '❌'} Payment ${verified ? 'APPROVED' : 'REJECTED'}: ${id} by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: `Payment ${verified ? 'approved' : 'rejected'} successfully`,
        transaction: payment
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }
  }
);

/**
 * SUBMIT TO SWIFT (Employee only)
 * POST /api/payments/employee/submit-swift
 * Batch submit verified payments to SWIFT
 */
router.post(
  '/employee/submit-swift',
  authenticateEmployee,
  [
    body('transactionIds').isArray({ min: 1 }).withMessage('Must provide at least one transaction ID')
  ],
  async (req, res) => {
    try {
      const { transactionIds } = req.body;

      // Find verified payments
      const payments = await Payment.find({
        transactionId: { $in: transactionIds },
        status: 'verified'
      });

      if (payments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No verified payments found to submit'
        });
      }

      // Submit each payment to SWIFT
      const results = [];
      for (const payment of payments) {
        await payment.submitToSwift();
        results.push({
          transactionId: payment.transactionId,
          swiftReference: payment.swiftReference,
          status: 'submitted_to_swift'
        });
      }

      // Log SWIFT submission
      createSecurityEvent('swift_submission', {
        employeeId: req.user.userId,
        transactionIds: payments.map(p => p.transactionId),
        count: payments.length
      });

      console.log(`📤 SWIFT SUBMISSION: ${payments.length} payments by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: `${payments.length} payment(s) submitted to SWIFT successfully`,
        results
      });

    } catch (error) {
      console.error('SWIFT submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit payments to SWIFT'
      });
    }
  }
);

/**
 * GET ALL CUSTOMERS (Employee only) - For customer list view
 * GET /api/payments/employee/customers
 */
router.get('/employee/customers', authenticateEmployee, async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'active' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Get payment counts for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const paymentCount = await Payment.countDocuments({ customerId: customer._id });
        const totalAmount = await Payment.aggregate([
          { $match: { customerId: customer._id, status: { $in: ['completed', 'submitted_to_swift'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
          ...customer.toJSON(),
          paymentCount,
          totalTransacted: totalAmount[0]?.total || 0
        };
      })
    );

    return res.status(200).json({
      success: true,
      customers: customersWithStats
    });

  } catch (error) {
    console.error('Get customers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
});

/**
 * GET CUSTOMER PAYMENTS (Employee only) - For viewing customer's payment history
 * GET /api/payments/employee/customer/:customerId
 */
router.get('/employee/customer/:customerId', authenticateEmployee, async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId).select('-passwordHash');
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const payments = await Payment.find({ customerId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      customer,
      payments
    });

  } catch (error) {
    console.error('Get customer payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer payments'
    });
  }
});

module.exports = router;
