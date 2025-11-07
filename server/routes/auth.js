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
const { authenticateEmployee } = require('../middleware/employeeAuth');

// Enhanced security middleware
const {
  validateLogin,
  validateEmployeeLogin,
  handleValidationErrors: handleComprehensiveValidationErrors,
} = require('../middleware/comprehensiveValidation');

const {
  checkAccountLockout,
  trackFailedAttempt,
  resetFailedAttempts,
} = require('../middleware/accountLockout');

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
    validateEmail(),
    validatePassword(),
    body('accountNumber')
      .trim()
      .isLength({ min: 8, max: 20 })
      .withMessage('Account number must be 8-20 characters'),
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
          message: 'Email already registered',
        });
      }

      // Check if account number already exists
      const existingAccount = await Customer.findOne({ accountNumber });
      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: 'Account number already in use',
        });
      }

      // Hash password with Argon2
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 4,
        parallelism: 2,
      });

      // Create customer
      const customer = await Customer.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        accountNumber,
        accountType: 'checking',
        accountBalance: 0,
        status: 'active',
      });

      // Log successful registration
      createSecurityEvent('customer_registration_success', {
        customerId: customer._id,
        email: customer.email,
      });

      // Create tokens
      const accessToken = await createAccessToken({
        userId: customer._id,
        email: customer.email,
        role: 'customer',
      });
      const refreshToken = await createRefreshToken({
        userId: customer._id,
        email: customer.email,
        role: 'customer',
      });

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true, // Always true for HTTPS
        sameSite: 'none', // Allow cross-port cookies for localhost development
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // Always true for HTTPS
        sameSite: 'none', // Allow cross-port cookies for localhost development
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(201).json({
        success: true,
        message: 'Customer registered successfully',
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          accountNumber: customer.accountNumber,
          role: 'customer',
        },
      });
    } catch (error) {
      console.error('Customer registration error:', error);
      createSecurityEvent('customer_registration_error', { error: error.message });

      return res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.',
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
  checkAccountLockout, // Check account lockout FIRST
  validateLogin, // Enhanced validation with comprehensive RegEx
  handleComprehensiveValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // SECURITY: Clear any existing auth cookies to prevent conflicts
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      };
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);

      // Find customer
      const customer = await Customer.findOne({ email: email.toLowerCase() });

      if (!customer) {
        // Track failed attempt for brute force protection
        trackFailedAttempt(email, req.ip);
        createSecurityEvent('customer_login_failed', { email, reason: 'not_found', ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check account status
      if (customer.status !== 'active') {
        createSecurityEvent('customer_login_failed', {
          email,
          reason: 'account_suspended',
          ip: req.ip,
        });
        return res.status(403).json({
          success: false,
          message: 'Account is suspended. Please contact support.',
        });
      }

      // Verify password
      const isValidPassword = await argon2.verify(customer.passwordHash, password);

      if (!isValidPassword) {
        await customer.incrementFailedLogins();

        // Track failed attempt - may trigger lockout
        const locked = trackFailedAttempt(email, req.ip);
        createSecurityEvent('customer_login_failed', {
          email,
          reason: 'invalid_password',
          ip: req.ip,
        });

        if (locked) {
          return res.status(423).json({
            success: false,
            message:
              'Account locked due to too many failed attempts. Please try again in 15 minutes.',
            locked: true,
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // SUCCESS - Reset failed attempts
      await customer.resetFailedLogins();
      resetFailedAttempts(email);

      // Create tokens
      const accessToken = await createAccessToken({
        userId: customer._id,
        email: customer.email,
        role: 'customer',
      });
      const refreshToken = await createRefreshToken({
        userId: customer._id,
        email: customer.email,
        role: 'customer',
      });

      console.log('🍪 Setting cookies for customer:', customer.email);

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true, // Always true for HTTPS
        sameSite: 'none', // Allow cross-port cookies for localhost development
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // Always true for HTTPS
        sameSite: 'none', // Allow cross-port cookies for localhost development
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log('✅ Cookies set successfully');

      // Log successful login
      createSecurityEvent('customer_login_success', {
        customerId: customer._id,
        email: customer.email,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          accountNumber: customer.accountNumber,
          role: 'customer',
        },
      });
    } catch (error) {
      console.error('Customer login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
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
  checkAccountLockout, // Check account lockout FIRST
  validateEmployeeLogin, // Enhanced validation with comprehensive RegEx
  handleComprehensiveValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // SECURITY: Clear any existing auth cookies to prevent conflicts
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      };
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);

      // DEBUG: Log incoming request details
      console.log('\n🔐 EMPLOYEE LOGIN ATTEMPT:');
      console.log('  Email:', email);
      console.log('  Password length:', password?.length);
      console.log('  Password first 5 chars:', password?.substring(0, 5));
      console.log('  Headers:', {
        'content-type': req.headers['content-type'],
        'x-csrf-token': req.headers['x-csrf-token']?.substring(0, 20) + '...',
        origin: req.headers['origin'],
        cookie: req.headers['cookie']?.substring(0, 50) + '...',
      });

      // Find employee
      const employee = await Employee.findOne({ email: email.toLowerCase() });

      console.log('  Employee found:', !!employee);
      if (employee) {
        console.log('  Employee name:', employee.name);
        console.log('  Employee status:', employee.status);
      }

      if (!employee) {
        // Track failed attempt for brute force protection
        trackFailedAttempt(email, req.ip);
        createSecurityEvent('employee_login_failed', { email, reason: 'not_found', ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check employee status
      if (employee.status !== 'active') {
        createSecurityEvent('employee_login_failed', {
          email,
          reason: 'account_inactive',
          ip: req.ip,
        });
        return res.status(403).json({
          success: false,
          message: 'Employee account is inactive. Please contact IT.',
        });
      }

      // Verify password
      console.log('  Verifying password...');
      const isValidPassword = await argon2.verify(employee.passwordHash, password);
      console.log('  Password valid:', isValidPassword);

      if (!isValidPassword) {
        console.log('  ❌ LOGIN FAILED: Invalid password');

        // Track failed attempt - may trigger lockout
        const locked = trackFailedAttempt(email, req.ip);
        createSecurityEvent('employee_login_failed', {
          email,
          reason: 'invalid_password',
          ip: req.ip,
        });

        if (locked) {
          return res.status(423).json({
            success: false,
            message: 'Account locked. Please try again in 15 minutes.',
            locked: true,
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      console.log('  ✅ LOGIN SUCCESS:', employee.email);

      // SUCCESS - Reset failed attempts
      resetFailedAttempts(email);

      // Update last login
      employee.lastLogin = new Date();
      await employee.save();

      // Create tokens with employee role
      const accessToken = await createAccessToken({
        userId: employee._id,
        email: employee.email,
        role: 'employee',
      });
      const refreshToken = await createRefreshToken({
        userId: employee._id,
        email: employee.email,
        role: 'employee',
      });

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true, // Always true for HTTPS
        sameSite: 'none', // Allow cross-port cookies for localhost development
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // Always true for HTTPS
        sameSite: 'none', // Allow cross-port cookies for localhost development
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Log successful login
      createSecurityEvent('employee_login_success', {
        employeeId: employee._id,
        email: employee.email,
        department: employee.department,
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
          permissions: employee.permissions,
        },
      });
    } catch (error) {
      console.error('Employee login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  }
);

/**
 * EMPLOYEE PROFILE
 * GET /api/auth/employee/profile
 */
router.get('/employee/profile', authenticateEmployee, async (req, res) => {
  try {
    // Find employee by ID from JWT token
    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Return employee profile without sensitive data
    return res.status(200).json({
      success: true,
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        department: employee.department,
        role: 'employee',
        permissions: employee.permissions,
        status: employee.status,
      },
    });
  } catch (error) {
    console.error('Employee profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee profile',
    });
  }
});

/**
 * LOGOUT
 * POST /api/auth/logout
 * IMPORTANT: Cookie options must match the ones used when setting cookies
 */
router.post('/logout', (req, res) => {
  // Clear cookies with the same options used when setting them
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('_csrf', cookieOptions); // Also clear CSRF token

  console.log('🚪 User logged out - cookies cleared');

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * BLOCK EMPLOYEE REGISTRATION
 * POST /api/auth/employee/register
 */
router.post('/employee/register', (req, res) => {
  createSecurityEvent('employee_registration_attempt_blocked', {
    ip: req.ip,
    email: req.body?.email,
  });

  console.warn(`⚠️  Blocked employee registration attempt from IP: ${req.ip}`);

  return res.status(403).json({
    success: false,
    message:
      'Employee registration is not allowed. Employee accounts are managed by administration.',
    code: 'EMPLOYEE_REGISTRATION_FORBIDDEN',
  });
});

module.exports = router;
