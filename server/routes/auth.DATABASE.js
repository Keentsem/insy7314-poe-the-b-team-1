/**
 * Authentication Routes - DATABASE VERSION
 * Uses MongoDB for persistent customer and employee storage
 *
 * REPLACE auth.js with this file once MongoDB is installed
 */

const express = require('express');
const argon2 = require('argon2');
const { body } = require('express-validator');
const { handleValidationErrors, validateEmail, validatePassword } = require('../utils/validation');
const { createAccessToken, createRefreshToken } = require('../utils/jwtSecurity');
const { createSecurityEvent } = require('../middleware/securityMonitoring');

// Database models
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

const router = express.Router();

/**
 * CUSTOMER REGISTRATION
 * POST /api/auth/register
 */
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').custom(validateEmail),
    body('password').custom(validatePassword),
    body('accountNumber').trim().isLength({ min: 8, max: 20 }).withMessage('Account number must be 8-20 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password, accountNumber } = req.body;

      // Check if customer already exists
      const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
      if (existingCustomer) {
        createSecurityEvent('registration_duplicate_email', { email, ip: req.ip });
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Check if account number already exists
      const existingAccount = await Customer.findOne({ accountNumber });
      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: 'Account number already in use'
        });
      }

      // Hash password with Argon2
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 4,
        parallelism: 2
      });

      // Create customer
      const customer = await Customer.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        accountNumber,
        accountType: 'checking',
        accountBalance: 0,
        status: 'active'
      });

      // Log successful registration
      createSecurityEvent('customer_registration_success', {
        customerId: customer._id,
        email: customer.email
      });

      // Create tokens
      const accessToken = createAccessToken(customer._id, 'customer');
      const refreshToken = createRefreshToken(customer._id, 'customer');

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(201).json({
        success: true,
        message: 'Customer registered successfully',
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          accountNumber: customer.accountNumber,
          role: 'customer'
        }
      });

    } catch (error) {
      console.error('Customer registration error:', error);
      createSecurityEvent('customer_registration_error', { error: error.message });

      return res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }
);

/**
 * CUSTOMER LOGIN
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email').custom(validateEmail),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find customer
      const customer = await Customer.findOne({ email: email.toLowerCase() });

      if (!customer) {
        createSecurityEvent('customer_login_failed', { email, reason: 'not_found', ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check account status
      if (customer.status !== 'active') {
        createSecurityEvent('customer_login_failed', { email, reason: 'account_suspended', ip: req.ip });
        return res.status(403).json({
          success: false,
          message: 'Account is suspended. Please contact support.'
        });
      }

      // Verify password
      const isValidPassword = await argon2.verify(customer.passwordHash, password);

      if (!isValidPassword) {
        await customer.incrementFailedLogins();
        createSecurityEvent('customer_login_failed', { email, reason: 'invalid_password', ip: req.ip });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Reset failed login attempts
      await customer.resetFailedLogins();

      // Create tokens
      const accessToken = createAccessToken(customer._id, 'customer');
      const refreshToken = createRefreshToken(customer._id, 'customer');

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Log successful login
      createSecurityEvent('customer_login_success', {
        customerId: customer._id,
        email: customer.email
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          accountNumber: customer.accountNumber,
          role: 'customer'
        }
      });

    } catch (error) {
      console.error('Customer login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }
);

/**
 * EMPLOYEE LOGIN
 * POST /api/auth/employee/login
 */
router.post(
  '/employee/login',
  [
    body('email').custom(validateEmail),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find employee
      const employee = await Employee.findOne({ email: email.toLowerCase() });

      if (!employee) {
        createSecurityEvent('employee_login_failed', { email, reason: 'not_found', ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check employee status
      if (employee.status !== 'active') {
        createSecurityEvent('employee_login_failed', { email, reason: 'account_inactive', ip: req.ip });
        return res.status(403).json({
          success: false,
          message: 'Employee account is inactive. Please contact IT.'
        });
      }

      // Verify password
      const isValidPassword = await argon2.verify(employee.passwordHash, password);

      if (!isValidPassword) {
        createSecurityEvent('employee_login_failed', { email, reason: 'invalid_password', ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      employee.lastLogin = new Date();
      await employee.save();

      // Create tokens with employee role
      const accessToken = createAccessToken(employee._id, 'employee');
      const refreshToken = createRefreshToken(employee._id, 'employee');

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Log successful login
      createSecurityEvent('employee_login_success', {
        employeeId: employee._id,
        email: employee.email,
        department: employee.department
      });

      console.log(`✅ Employee logged in: ${employee.email} (${employee.department})`);

      return res.status(200).json({
        success: true,
        message: 'Employee login successful',
        user: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          employeeId: employee.employeeId,
          department: employee.department,
          role: 'employee',
          permissions: employee.permissions
        }
      });

    } catch (error) {
      console.error('Employee login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }
);

/**
 * LOGOUT
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * BLOCK EMPLOYEE REGISTRATION
 * POST /api/auth/employee/register
 */
router.post('/employee/register', (req, res) => {
  createSecurityEvent('employee_registration_attempt_blocked', {
    ip: req.ip,
    email: req.body?.email
  });

  console.warn(`⚠️  Blocked employee registration attempt from IP: ${req.ip}`);

  return res.status(403).json({
    success: false,
    message: 'Employee registration is not allowed. Employee accounts are managed by administration.',
    code: 'EMPLOYEE_REGISTRATION_FORBIDDEN'
  });
});

module.exports = router;
