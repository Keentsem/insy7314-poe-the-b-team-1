const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../utils/jwtSecurity');
const { createSecurityEvent } = require('../middleware/securityMonitoring');
const { sanitizeRequestBody } = require('../middleware/inputSanitization');
const { authenticateEmployee } = require('../middleware/employeeAuth');

const router = express.Router();

// In-memory storage for transactions (in production, use a database)
const transactions = new Map();

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
    .withMessage('Recipient account must be a valid IBAN (8-34 alphanumeric characters)'),
  body('recipientSwift')
    .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
    .withMessage('SWIFT code must be 8 or 11 characters (e.g., ABCDUS33XXX)'),
  body('recipientName')
    .matches(/^[a-zA-Z\s\-'.]{2,100}$/)
    .withMessage('Recipient name must be 2-100 characters, letters and common punctuation only'),
  body('reference')
    .optional()
    .matches(/^[a-zA-Z0-9\s-]{1,35}$/)
    .withMessage('Reference must be 1-35 characters, alphanumeric with spaces and hyphens only')
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation failure
    createSecurityEvent('payment_validation_error', {
      userId: req.user?.userId || 'unknown',
      errors: errors.array(),
      inputData: {
        amount: req.body.amount,
        currency: req.body.currency,
        recipientAccount: req.body.recipientAccount ? '[MASKED]' : null
      }
    }, req);

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Create Payment Endpoint
 */
router.post('/',
  authenticateToken,
  sanitizeRequestBody,
  validatePaymentData,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { amount, currency, recipientAccount, recipientSwift, recipientName, reference } = req.body;
      const userId = req.user.userId;

      // Generate unique transaction ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction object with employee verification fields
      const transaction = {
        id: transactionId,
        userId,
        customerEmail: req.user.email, // Store customer email for employee view
        amount: parseFloat(amount),
        currency,
        recipientAccount: recipientAccount.toUpperCase(),
        recipientSwift: recipientSwift.toUpperCase(),
        recipientName,
        reference: reference || '',
        status: 'pending', // pending, verified, rejected, submitted_to_swift, completed, failed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Employee verification fields
        verifiedBy: null,
        verifiedAt: null,
        verifierNotes: null,
        verificationStatus: null, // verified, rejected
        submittedBy: null,
        submittedAt: null
      };

      // Store transaction
      transactions.set(transactionId, transaction);

      // Log payment creation
      createSecurityEvent('payment_created', {
        transactionId,
        userId,
        amount: transaction.amount,
        currency: transaction.currency,
        recipientSwift: transaction.recipientSwift
      }, req);

      // Simulate payment processing
      setTimeout(() => {
        const storedTransaction = transactions.get(transactionId);
        if (storedTransaction) {
          storedTransaction.status = 'completed';
          storedTransaction.updatedAt = new Date().toISOString();
          transactions.set(transactionId, storedTransaction);

          // Log payment completion
          createSecurityEvent('payment_completed', {
            transactionId,
            userId,
            amount: storedTransaction.amount,
            currency: storedTransaction.currency
          });
        }
      }, 3000); // Simulate 3-second processing time

      res.status(201).json({
        success: true,
        message: 'Payment submitted successfully',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          recipientName: transaction.recipientName,
          recipientAccount: transaction.recipientAccount,
          recipientSwift: transaction.recipientSwift,
          reference: transaction.reference,
          status: transaction.status,
          createdAt: transaction.createdAt
        }
      });

    } catch (error) {
      console.error('Payment creation error:', error);

      // Log payment error
      createSecurityEvent('payment_error', {
        userId: req.user?.userId || 'unknown',
        error: error.message,
        amount: req.body?.amount,
        currency: req.body?.currency
      }, req);

      res.status(500).json({
        success: false,
        message: 'Payment processing failed'
      });
    }
  }
);

/**
 * Get User Transactions
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Filter transactions for this user
    const userTransactions = Array.from(transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50); // Limit to 50 most recent

    // Log transaction retrieval
    createSecurityEvent('transactions_retrieved', {
      userId,
      transactionCount: userTransactions.length
    }, req);

    res.json({
      success: true,
      transactions: userTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        recipientName: tx.recipientName,
        recipientAccount: tx.recipientAccount,
        recipientSwift: tx.recipientSwift,
        reference: tx.reference,
        status: tx.status,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      }))
    });

  } catch (error) {
    console.error('Transaction retrieval error:', error);

    createSecurityEvent('transaction_retrieval_error', {
      userId: req.user?.userId || 'unknown',
      error: error.message
    }, req);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions'
    });
  }
});

/**
 * Get Single Transaction
 */
router.get('/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;

    const transaction = transactions.get(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Ensure user can only access their own transactions
    if (transaction.userId !== userId) {
      createSecurityEvent('unauthorized_transaction_access', {
        userId,
        attemptedTransactionId: transactionId,
        transactionOwnerId: transaction.userId
      }, req);

      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Log transaction access
    createSecurityEvent('transaction_accessed', {
      userId,
      transactionId
    }, req);

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        recipientName: transaction.recipientName,
        recipientAccount: transaction.recipientAccount,
        recipientSwift: transaction.recipientSwift,
        reference: transaction.reference,
        status: transaction.status,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }
    });

  } catch (error) {
    console.error('Single transaction retrieval error:', error);

    createSecurityEvent('single_transaction_error', {
      userId: req.user?.userId || 'unknown',
      transactionId: req.params?.transactionId,
      error: error.message
    }, req);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction'
    });
  }
});

/**
 * ==========================================
 * EMPLOYEE PAYMENT VERIFICATION ENDPOINTS
 * TASK 3 - Employee Portal
 * ==========================================
 */

/**
 * GET /api/payments/employee/pending
 * Get all pending payments for employee verification
 */
router.get('/employee/pending', authenticateEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Get all pending transactions across all customers
    const allTransactions = Array.from(transactions.values());
    const pendingTransactions = allTransactions
      .filter(tx => tx.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    // Log employee access
    createSecurityEvent('employee_view_pending_payments', {
      employeeId: req.user.userId,
      employeeEmail: req.user.email,
      transactionCount: pendingTransactions.length
    }, req);

    res.json({
      success: true,
      transactions: pendingTransactions.map(tx => ({
        id: tx.id,
        customerEmail: tx.customerEmail,
        amount: tx.amount,
        currency: tx.currency,
        recipientName: tx.recipientName,
        recipientAccount: tx.recipientAccount,
        recipientSwift: tx.recipientSwift,
        reference: tx.reference,
        status: tx.status,
        createdAt: tx.createdAt
      })),
      count: pendingTransactions.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Employee pending payments error:', error);

    createSecurityEvent('employee_pending_payments_error', {
      employeeId: req.user?.userId || 'unknown',
      error: error.message
    }, req);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending payments'
    });
  }
});

/**
 * GET /api/payments/employee/all
 * Get all payments with optional status filter
 */
router.get('/employee/all', authenticateEmployee, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    // Get all transactions
    let allTransactions = Array.from(transactions.values());

    // Filter by status if provided
    if (status && ['pending', 'verified', 'rejected', 'submitted_to_swift', 'completed', 'failed'].includes(status)) {
      allTransactions = allTransactions.filter(tx => tx.status === status);
    }

    // Sort and paginate
    const paginatedTransactions = allTransactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    // Log employee access
    createSecurityEvent('employee_view_all_payments', {
      employeeId: req.user.userId,
      employeeEmail: req.user.email,
      statusFilter: status || 'all',
      transactionCount: paginatedTransactions.length
    }, req);

    res.json({
      success: true,
      transactions: paginatedTransactions.map(tx => ({
        id: tx.id,
        customerEmail: tx.customerEmail,
        amount: tx.amount,
        currency: tx.currency,
        recipientName: tx.recipientName,
        recipientAccount: tx.recipientAccount,
        recipientSwift: tx.recipientSwift,
        reference: tx.reference,
        status: tx.status,
        createdAt: tx.createdAt,
        verifiedBy: tx.verifiedBy,
        verifiedAt: tx.verifiedAt,
        verifierNotes: tx.verifierNotes,
        verificationStatus: tx.verificationStatus,
        submittedBy: tx.submittedBy,
        submittedAt: tx.submittedAt
      })),
      count: paginatedTransactions.length,
      totalCount: allTransactions.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Employee all payments error:', error);

    createSecurityEvent('employee_all_payments_error', {
      employeeId: req.user?.userId || 'unknown',
      error: error.message
    }, req);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments'
    });
  }
});

/**
 * POST /api/payments/employee/verify/:transactionId
 * Verify or reject a payment transaction
 */
router.post('/employee/verify/:transactionId',
  authenticateEmployee,
  sanitizeRequestBody,
  [
    body('verified')
      .isBoolean()
      .withMessage('Verified must be a boolean value'),
    body('verifierNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .matches(/^[a-zA-Z0-9\s.,\-!?]*$/)
      .withMessage('Verifier notes must be 500 characters or less, alphanumeric with basic punctuation only')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { verified, verifierNotes } = req.body;

      const transaction = transactions.get(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check if transaction is in pending status
      if (transaction.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Transaction is already ${transaction.status}. Only pending transactions can be verified.`
        });
      }

      // Update transaction with verification info
      transaction.verifiedBy = req.user.userId;
      transaction.verifiedAt = new Date().toISOString();
      transaction.verifierNotes = verifierNotes || '';
      transaction.verificationStatus = verified ? 'verified' : 'rejected';
      transaction.status = verified ? 'verified' : 'rejected';
      transaction.updatedAt = new Date().toISOString();

      transactions.set(transactionId, transaction);

      // Log verification event
      createSecurityEvent('employee_payment_verification', {
        employeeId: req.user.userId,
        employeeEmail: req.user.email,
        transactionId,
        verified,
        amount: transaction.amount,
        currency: transaction.currency,
        customerEmail: transaction.customerEmail,
        hasNotes: !!verifierNotes
      }, req);

      res.json({
        success: true,
        message: `Payment ${verified ? 'verified' : 'rejected'} successfully`,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          verifiedBy: transaction.verifiedBy,
          verifiedAt: transaction.verifiedAt,
          verificationStatus: transaction.verificationStatus,
          verifierNotes: transaction.verifierNotes
        }
      });

    } catch (error) {
      console.error('Payment verification error:', error);

      createSecurityEvent('employee_verification_error', {
        employeeId: req.user?.userId || 'unknown',
        transactionId: req.params?.transactionId,
        error: error.message
      }, req);

      res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  }
);

/**
 * POST /api/payments/employee/submit-swift
 * Batch submit verified transactions to SWIFT
 */
router.post('/employee/submit-swift',
  authenticateEmployee,
  sanitizeRequestBody,
  [
    body('transactionIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('Transaction IDs must be an array with 1-100 items'),
    body('transactionIds.*')
      .matches(/^txn_[a-zA-Z0-9_]+$/)
      .withMessage('Invalid transaction ID format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { transactionIds } = req.body;

      const results = {
        successful: [],
        failed: [],
        summary: {
          totalAmount: 0,
          transactionCount: 0,
          currencies: {}
        }
      };

      for (const transactionId of transactionIds) {
        const transaction = transactions.get(transactionId);

        if (!transaction) {
          results.failed.push({
            transactionId,
            reason: 'Transaction not found'
          });
          continue;
        }

        // Check if transaction is verified
        if (transaction.status !== 'verified') {
          results.failed.push({
            transactionId,
            reason: `Transaction is ${transaction.status}. Only verified transactions can be submitted.`
          });
          continue;
        }

        // Update transaction to submitted_to_swift
        transaction.submittedBy = req.user.userId;
        transaction.submittedAt = new Date().toISOString();
        transaction.status = 'submitted_to_swift';
        transaction.updatedAt = new Date().toISOString();

        transactions.set(transactionId, transaction);

        results.successful.push({
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency
        });

        // Update summary
        results.summary.totalAmount += transaction.amount;
        results.summary.transactionCount++;
        results.summary.currencies[transaction.currency] =
          (results.summary.currencies[transaction.currency] || 0) + transaction.amount;
      }

      // Log SWIFT submission
      createSecurityEvent('employee_swift_submission', {
        employeeId: req.user.userId,
        employeeEmail: req.user.email,
        successfulCount: results.successful.length,
        failedCount: results.failed.length,
        totalAmount: results.summary.totalAmount,
        currencies: results.summary.currencies
      }, req);

      res.json({
        success: true,
        message: `Successfully submitted ${results.successful.length} transaction(s) to SWIFT`,
        results,
        summary: results.summary
      });

    } catch (error) {
      console.error('SWIFT submission error:', error);

      createSecurityEvent('employee_swift_submission_error', {
        employeeId: req.user?.userId || 'unknown',
        error: error.message
      }, req);

      res.status(500).json({
        success: false,
        message: 'SWIFT submission failed'
      });
    }
  }
);

module.exports = router;