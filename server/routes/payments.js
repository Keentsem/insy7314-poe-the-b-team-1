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

// Enhanced security validation
const {
  validatePaymentCreation,
  validatePaymentVerification,
  validateSwiftSubmission,
  validatePaymentQuery,
  handleValidationErrors: handleComprehensiveValidationErrors,
} = require('../middleware/comprehensiveValidation');

// Database models
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Invoice = require('../models/Invoice');

const router = express.Router();

/**
 * CREATE PAYMENT (Customer only)
 * POST /api/payments
 * Creates payment with status="pending" (NOT completed)
 */
router.post(
  '/',
  authenticateToken,
  validatePaymentCreation, // Comprehensive validation with all RegEx patterns
  handleComprehensiveValidationErrors,
  sanitizeRequestBody,
  async (req, res) => {
    try {
      // Only customers can create payments
      if (req.user.role !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Only customers can create payments',
        });
      }

      const { amount, currency, recipientAccount, recipientSwift, recipientName, reference } =
        req.body;

      // Get customer details
      const customer = await Customer.findById(req.user.userId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
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
        status: 'pending', // ← STARTS AS PENDING!
      });

      // Log payment creation
      createSecurityEvent('payment_created', {
        transactionId,
        customerId: customer._id,
        amount,
        currency,
        status: 'pending',
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
          createdAt: payment.createdAt,
        },
      });
    } catch (error) {
      console.error('Payment creation error:', error);
      createSecurityEvent('payment_creation_error', { error: error.message });

      return res.status(500).json({
        success: false,
        message: 'Failed to create payment. Please try again.',
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
        message: 'Access denied',
      });
    }

    const payments = await Payment.find({ customerId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      transactions: payments,
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
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
      transactions: pendingPayments,
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments',
    });
  }
});

/**
 * GET ALL PAYMENTS WITH FILTER (Employee only)
 * GET /api/payments/employee/all?status=verified
 */
router.get(
  '/employee/all',
  authenticateEmployee,
  validatePaymentQuery,
  handleComprehensiveValidationErrors,
  async (req, res) => {
    try {
      const { status } = req.query;

      const filter = {};
      if (status && status !== 'all') {
        filter.status = status;
      }

      const payments = await Payment.find(filter)
        .populate('customerId', 'fullName email phoneNumber country')
        .sort({ createdAt: -1 })
        .limit(200);

      // Enrich payments with customer details
      const enrichedPayments = payments.map(payment => {
        const paymentObj = payment.toObject();
        if (payment.customerId) {
          paymentObj.customerName = payment.customerId.fullName;
          paymentObj.customerPhone = payment.customerId.phoneNumber;
          paymentObj.customerCountry = payment.customerId.country;
        }
        return paymentObj;
      });

      return res.status(200).json({
        success: true,
        transactions: enrichedPayments,
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
      });
    }
  }
);

/**
 * VERIFY PAYMENT (Employee only)
 * POST /api/payments/employee/verify/:transactionId
 * Approve or reject payment
 */
router.post(
  '/employee/verify/:transactionId',
  authenticateEmployee,
  validatePaymentVerification, // Comprehensive validation
  handleComprehensiveValidationErrors,
  async (req, res) => {
    try {
      const { transactionId: id } = req.params;
      const { verified, verifierNotes } = req.body;

      // Find payment
      const payment = await Payment.findOne({ transactionId: id });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
      }

      // Check if already verified
      if (payment.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Transaction is already ${payment.status}`,
        });
      }

      // Verify payment (approve or reject)
      await payment.verify(req.user.userId, req.user.email, verified, verifierNotes || '');

      // If approved, generate invoice automatically
      let invoice = null;
      if (verified) {
        try {
          // Get employee details
          const employee = await Employee.findById(req.user.userId);
          const customer = await Customer.findById(payment.customerId);

          if (employee && customer) {
            // Generate unique invoice number
            const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // Create invoice
            invoice = await Invoice.create({
              invoiceNumber,
              paymentId: payment._id,
              transactionId: payment.transactionId,
              customerId: payment.customerId,
              customerEmail: payment.customerEmail,
              customerName: customer.name,
              amount: payment.amount,
              currency: payment.currency,
              recipientAccount: payment.recipientAccount,
              recipientSwift: payment.recipientSwift,
              recipientName: payment.recipientName,
              reference: payment.reference,
              verifiedBy: req.user.userId,
              verifiedByEmail: req.user.email,
              verifiedByName: employee.name,
              verifierDepartment: employee.department,
              verifierNotes: verifierNotes || '',
              paymentStatus: 'verified',
              invoiceDate: new Date(),
              status: 'generated',
            });

            console.log(`📄 Invoice generated: ${invoiceNumber} for payment ${id}`);
          }
        } catch (invoiceError) {
          console.error('Failed to generate invoice:', invoiceError);
          // Don't fail the whole request if invoice generation fails
        }
      }

      // Log verification
      createSecurityEvent('payment_verified', {
        transactionId: id,
        employeeId: req.user.userId,
        verified,
        newStatus: payment.status,
        invoiceGenerated: !!invoice,
      });

      console.log(
        `${verified ? '✅' : '❌'} Payment ${verified ? 'APPROVED' : 'REJECTED'}: ${id} by ${req.user.email}`
      );

      return res.status(200).json({
        success: true,
        message: `Payment ${verified ? 'approved' : 'rejected'} successfully${invoice ? ' and invoice generated' : ''}`,
        transaction: payment,
        invoice: invoice || null,
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
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
  validateSwiftSubmission, // Comprehensive validation
  handleComprehensiveValidationErrors,
  async (req, res) => {
    try {
      const { transactionIds } = req.body;

      // Find verified payments
      const payments = await Payment.find({
        transactionId: { $in: transactionIds },
        status: 'verified',
      });

      if (payments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No verified payments found to submit',
        });
      }

      // Submit each payment to SWIFT
      const results = [];
      for (const payment of payments) {
        await payment.submitToSwift();
        results.push({
          transactionId: payment.transactionId,
          swiftReference: payment.swiftReference,
          status: 'submitted_to_swift',
        });
      }

      // Log SWIFT submission
      createSecurityEvent('swift_submission', {
        employeeId: req.user.userId,
        transactionIds: payments.map(p => p.transactionId),
        count: payments.length,
      });

      console.log(`📤 SWIFT SUBMISSION: ${payments.length} payments by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: `${payments.length} payment(s) submitted to SWIFT successfully`,
        results,
      });
    } catch (error) {
      console.error('SWIFT submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit payments to SWIFT',
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
      customers.map(async customer => {
        const paymentCount = await Payment.countDocuments({ customerId: customer._id });
        const totalAmount = await Payment.aggregate([
          {
            $match: {
              customerId: customer._id,
              status: { $in: ['completed', 'submitted_to_swift'] },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        return {
          ...customer.toJSON(),
          paymentCount,
          totalTransacted: totalAmount[0]?.total || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      customers: customersWithStats,
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
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
        message: 'Customer not found',
      });
    }

    const payments = await Payment.find({ customerId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      customer,
      payments,
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer payments',
    });
  }
});

/**
 * GET CUSTOMER INVOICES (Customer only)
 * GET /api/payments/invoices
 * Returns all invoices for the authenticated customer
 */
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    // Only customers can access their own invoices
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can access invoices',
      });
    }

    const invoices = await Invoice.find({ customerId: req.user.userId })
      .populate('verifiedBy', 'name email department')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
    });
  }
});

/**
 * GET ALL INVOICES (Employee only)
 * GET /api/payments/employee/invoices
 * Returns all invoices in the system
 */
router.get('/employee/invoices', authenticateEmployee, async (req, res) => {
  try {
    const invoices = await Invoice.find({})
      .populate('customerId', 'name email accountNumber')
      .populate('verifiedBy', 'name email department employeeId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error('Error fetching employee invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
    });
  }
});

/**
 * GET SINGLE INVOICE (Customer or Employee)
 * GET /api/payments/invoices/:invoiceNumber
 */
router.get('/invoices/:invoiceNumber', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('customerId', 'name email accountNumber')
      .populate('verifiedBy', 'name email department employeeId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && invoice.customerId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
    });
  }
});

module.exports = router;
