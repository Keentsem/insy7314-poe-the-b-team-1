/**
 * Customer Routes - Employee Access
 * Allows employees to view registered customers
 */

const express = require('express');
const { authenticateEmployee } = require('../middleware/employeeAuth');
const { createSecurityEvent } = require('../middleware/securityMonitoring');

// Enhanced security validation
const {
  validateCustomerId,
  handleValidationErrors
} = require('../middleware/comprehensiveValidation');

const Customer = require('../models/Customer');
const Payment = require('../models/Payment');

const router = express.Router();

/**
 * GET PAYMENT STATISTICS
 * GET /api/customers/employee/stats
 * NOTE: Must be before /:id route to avoid route conflict
 */
router.get('/employee/stats', authenticateEmployee, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const verifiedPayments = await Payment.countDocuments({ status: 'verified' });
    const rejectedPayments = await Payment.countDocuments({ status: 'rejected' });
    const completedPayments = await Payment.countDocuments({ status: 'completed' });

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalPayments,
        pendingPayments,
        verifiedPayments,
        rejectedPayments,
        completedPayments
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * GET ALL CUSTOMERS (Employee only)
 * GET /api/customers/employee/all
 */
router.get('/employee/all', authenticateEmployee, async (req, res) => {
  try {
    const customers = await Customer.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(200);

    console.log(`📋 Fetched ${customers.length} customers`);

    return res.status(200).json({
      success: true,
      customers
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
 * GET CUSTOMER DETAILS WITH PAYMENT STATS (Employee only)
 * GET /api/customers/employee/:id
 */
router.get('/employee/:id', authenticateEmployee, validateCustomerId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id).select('-passwordHash');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get payment statistics for this customer
    const payments = await Payment.find({ customerId: id })
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    const stats = {
      totalPayments: payments.length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      verifiedPayments: payments.filter(p => p.status === 'verified').length,
      rejectedPayments: payments.filter(p => p.status === 'rejected').length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    };

    // Calculate payment statistics per employee
    const employeeStats = {};
    payments.forEach(payment => {
      if (payment.verifiedByEmail) {
        if (!employeeStats[payment.verifiedByEmail]) {
          employeeStats[payment.verifiedByEmail] = {
            employeeName: payment.verifiedBy?.name || 'Unknown',
            employeeEmail: payment.verifiedByEmail,
            acceptedCount: 0,
            rejectedCount: 0,
            totalAmount: 0
          };
        }

        if (payment.status === 'verified' || payment.status === 'completed' || payment.status === 'submitted_to_swift') {
          employeeStats[payment.verifiedByEmail].acceptedCount++;
          employeeStats[payment.verifiedByEmail].totalAmount += payment.amount;
        } else if (payment.status === 'rejected') {
          employeeStats[payment.verifiedByEmail].rejectedCount++;
        }
      }
    });

    return res.status(200).json({
      success: true,
      customer,
      stats,
      employeeStats: Object.values(employeeStats),
      recentPayments: payments.slice(0, 10)
    });

  } catch (error) {
    console.error('Get customer details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details'
    });
  }
});

module.exports = router;
