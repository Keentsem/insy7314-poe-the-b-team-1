const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../utils/jwtSecurity');
const { createSecurityEvent } = require('../middleware/securityMonitoring');
const { sanitizeRequestBody } = require('../middleware/inputSanitization');

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
    .matches(/^[a-zA-Z\s\-'\.]{2,100}$/)
    .withMessage('Recipient name must be 2-100 characters, letters and common punctuation only'),
  body('reference')
    .optional()
    .matches(/^[a-zA-Z0-9\s\-]{1,35}$/)
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

      // Create transaction object
      const transaction = {
        id: transactionId,
        userId,
        amount: parseFloat(amount),
        currency,
        recipientAccount: recipientAccount.toUpperCase(),
        recipientSwift: recipientSwift.toUpperCase(),
        recipientName,
        reference: reference || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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

module.exports = router;