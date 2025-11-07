const express = require('express');
const { validateEmail, validatePassword, handleValidationErrors } = require('../utils/validation');
const { hashPassword, comparePassword } = require('../utils/passwordSecurity');
const {
  generateAccessToken,
  generateRefreshToken,
  setSecureCookies,
  clearSecureCookies,
  authenticateToken,
  validateRefreshToken
} = require('../utils/jwtSecurity');
const { trackFailedLogin, createSecurityEvent } = require('../middleware/securityMonitoring');
const { sanitizeRequestBody, handleSanitizedValidationErrors } = require('../middleware/inputSanitization');

const router = express.Router();

const users = new Map();
const refreshTokens = new Map();

// EMPLOYEE PRE-POPULATED ACCOUNTS - TASK 3 REQUIREMENT
// These accounts are pre-populated and employees cannot register
const employees = new Map();

/**
 * Initialize pre-populated employee accounts
 * SECURITY: Passwords are hashed with Argon2 on server startup
 */
async function initializeEmployeeAccounts() {
  const employeeData = [
    {
      employeeId: 'emp_001',
      email: 'manager@bank.com',
      password: 'BankEmployee2025!',
      name: 'John Manager',
      department: 'Management',
      role: 'employee'
    },
    {
      employeeId: 'emp_002',
      email: 'verifier1@bank.com',
      password: 'BankEmployee2025!',
      name: 'Sarah Verifier',
      department: 'Verification',
      role: 'employee'
    },
    {
      employeeId: 'emp_003',
      email: 'verifier2@bank.com',
      password: 'BankEmployee2025!',
      name: 'Mike Validator',
      department: 'Verification',
      role: 'employee'
    },
    {
      employeeId: 'emp_004',
      email: 'analyst@bank.com',
      password: 'BankEmployee2025!',
      name: 'Emma Analyst',
      department: 'Analytics',
      role: 'employee'
    },
    {
      employeeId: 'emp_005',
      email: 'admin@bank.com',
      password: 'BankEmployee2025!',
      name: 'David Admin',
      department: 'Administration',
      role: 'employee'
    }
  ];

  // Hash all passwords and store employees
  for (const emp of employeeData) {
    const hashedPassword = await hashPassword(emp.password);
    employees.set(emp.email, {
      employeeId: emp.employeeId,
      email: emp.email,
      password: hashedPassword,
      name: emp.name,
      department: emp.department,
      role: emp.role,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    });
  }

  console.log(`✅ Initialized ${employees.size} pre-populated employee accounts`);
}

// Initialize employee accounts immediately
initializeEmployeeAccounts().catch(err => {
  console.error('Failed to initialize employee accounts:', err);
});

router.post('/register', [
  sanitizeRequestBody,
  validateEmail,
  validatePassword,
  handleSanitizedValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // SECURITY: Check for existing user
    if (users.has(email)) {
      // Log potential account enumeration attempt
      createSecurityEvent('account_enumeration', {
        email,
        action: 'register_existing_user'
      }, req);

      return res.status(409).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // SECURITY: Hash password with advanced security
    const hashedPassword = await hashPassword(password);

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store user with secure data structure
    users.set(email, {
      userId,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    });

    // SECURITY: Generate secure JWT tokens
    const accessToken = await generateAccessToken({ userId, email });
    const refreshToken = await generateRefreshToken({ userId, email });

    // Store refresh token securely
    refreshTokens.set(userId, {
      token: refreshToken,
      createdAt: Date.now(),
      isActive: true
    });

    // SECURITY: Set secure httpOnly cookies
    setSecureCookies(res, accessToken, refreshToken);

    // Log successful registration
    createSecurityEvent('user_registered', {
      userId,
      email
    }, req);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId,
        email,
        createdAt: users.get(email).createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // SECURITY: Log registration failure
    createSecurityEvent('registration_error', {
      email: req.body?.email || 'unknown',
      error: error.message
    }, req);

    if (error.message && error.message.includes('Password')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

router.post('/login', [
  sanitizeRequestBody,
  validateEmail,
  validatePassword,
  handleSanitizedValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.get(email);
    if (!user) {
      // SECURITY: Track failed login attempt for brute force detection
      trackFailedLogin(req, email);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // SECURITY: Check if account is active
    if (!user.isActive) {
      createSecurityEvent('inactive_account_access', {
        userId: user.userId,
        email
      }, req);

      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      // SECURITY: Track failed login attempt
      trackFailedLogin(req, email);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // SECURITY: Update last login timestamp
    user.lastLogin = new Date().toISOString();
    users.set(email, user);

    // SECURITY: Generate secure JWT tokens
    const accessToken = await generateAccessToken({
      userId: user.userId,
      email: user.email
    });
    const refreshToken = await generateRefreshToken({
      userId: user.userId,
      email: user.email
    });

    // Store refresh token securely
    refreshTokens.set(user.userId, {
      token: refreshToken,
      createdAt: Date.now(),
      isActive: true
    });

    // SECURITY: Set secure httpOnly cookies
    setSecureCookies(res, accessToken, refreshToken);

    // Log successful login
    createSecurityEvent('user_login', {
      userId: user.userId,
      email: user.email,
      loginTime: user.lastLogin
    }, req);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    // SECURITY: Log login error
    createSecurityEvent('login_error', {
      email: req.body?.email || 'unknown',
      error: error.message
    }, req);

    if (error.message && error.message.includes('Password')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

/**
 * JWT Token Refresh Endpoint
 *
 * SECURITY: Secure token rotation for session management
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // SECURITY: Validate refresh token
    const decoded = await validateRefreshToken(refreshToken);
    const userId = decoded.userId;

    // Check if refresh token is still active
    const storedToken = refreshTokens.get(userId);
    if (!storedToken || !storedToken.isActive || storedToken.token !== refreshToken) {
      createSecurityEvent('invalid_refresh_token', {
        userId,
        reason: 'token_not_found_or_inactive'
      }, req);

      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user data
    const user = Array.from(users.values()).find(u => u.userId === userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // SECURITY: Rotate tokens - generate new tokens
    const newAccessToken = await generateAccessToken({
      userId: user.userId,
      email: user.email
    });
    const newRefreshToken = await generateRefreshToken({
      userId: user.userId,
      email: user.email
    });

    // SECURITY: Invalidate old refresh token and store new one
    refreshTokens.set(userId, {
      token: newRefreshToken,
      createdAt: Date.now(),
      isActive: true
    });

    // Set new secure cookies
    setSecureCookies(res, newAccessToken, newRefreshToken);

    // Log token refresh
    createSecurityEvent('token_refresh', {
      userId: user.userId,
      email: user.email
    }, req);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);

    createSecurityEvent('token_refresh_error', {
      error: error.message
    }, req);

    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

/**
 * Logout Endpoint
 *
 * SECURITY: Secure session termination
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // SECURITY: Invalidate refresh token
    if (refreshTokens.has(userId)) {
      refreshTokens.delete(userId);
    }

    // SECURITY: Clear secure cookies
    clearSecureCookies(res);

    // Log logout event
    createSecurityEvent('user_logout', {
      userId,
      email: req.user.email
    }, req);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);

    createSecurityEvent('logout_error', {
      userId: req.user?.userId || 'unknown',
      error: error.message
    }, req);

    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * Protected Profile Endpoint
 *
 * SECURITY: Demonstrates JWT authentication middleware
 */
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.userId === req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return safe user data (no password)
    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

/**
 * EMPLOYEE LOGIN ENDPOINT - TASK 3
 *
 * Separate login endpoint for pre-populated employee accounts
 * SECURITY: Same security measures as customer login
 */
router.post('/employee/login', [
  sanitizeRequestBody,
  validateEmail,
  validatePassword,
  handleSanitizedValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = employees.get(email);
    if (!employee) {
      // SECURITY: Track failed login attempt for brute force detection
      trackFailedLogin(req, email);
      createSecurityEvent('employee_login_failed', {
        email,
        reason: 'account_not_found'
      }, req);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // SECURITY: Check if account is active
    if (!employee.isActive) {
      createSecurityEvent('inactive_employee_access', {
        employeeId: employee.employeeId,
        email
      }, req);

      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    const isValidPassword = await comparePassword(password, employee.password);
    if (!isValidPassword) {
      // SECURITY: Track failed login attempt
      trackFailedLogin(req, email);
      createSecurityEvent('employee_login_failed', {
        email,
        reason: 'invalid_password'
      }, req);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // SECURITY: Update last login timestamp
    employee.lastLogin = new Date().toISOString();
    employees.set(email, employee);

    // SECURITY: Generate secure JWT tokens with employee role
    const accessToken = await generateAccessToken({
      userId: employee.employeeId,
      email: employee.email,
      role: 'employee'
    });
    const refreshToken = await generateRefreshToken({
      userId: employee.employeeId,
      email: employee.email,
      role: 'employee'
    });

    // Store refresh token securely
    refreshTokens.set(employee.employeeId, {
      token: refreshToken,
      createdAt: Date.now(),
      isActive: true
    });

    // SECURITY: Set secure httpOnly cookies
    setSecureCookies(res, accessToken, refreshToken);

    // Log successful employee login
    createSecurityEvent('employee_login_success', {
      employeeId: employee.employeeId,
      email: employee.email,
      name: employee.name,
      department: employee.department,
      loginTime: employee.lastLogin
    }, req);

    res.status(200).json({
      success: true,
      message: 'Employee login successful',
      token: accessToken,
      user: {
        employeeId: employee.employeeId,
        email: employee.email,
        name: employee.name,
        department: employee.department,
        role: employee.role,
        lastLogin: employee.lastLogin
      }
    });

  } catch (error) {
    console.error('Employee login error:', error);

    // SECURITY: Log login error
    createSecurityEvent('employee_login_error', {
      email: req.body?.email || 'unknown',
      error: error.message
    }, req);

    if (error.message && error.message.includes('Password')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

/**
 * EMPLOYEE PROFILE ENDPOINT - TASK 3
 *
 * Get current employee information
 * Requires employee authentication
 */
router.get('/employee/profile', authenticateToken, (req, res) => {
  try {
    // Verify this is an employee token
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employee access only.'
      });
    }

    const employee = Array.from(employees.values()).find(
      emp => emp.employeeId === req.user.userId
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Return safe employee data (no password)
    res.json({
      success: true,
      employee: {
        employeeId: employee.employeeId,
        email: employee.email,
        name: employee.name,
        department: employee.department,
        role: employee.role,
        createdAt: employee.createdAt,
        lastLogin: employee.lastLogin
      }
    });

  } catch (error) {
    console.error('Employee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee profile'
    });
  }
});

module.exports = router;
module.exports.employees = employees; // Export for use in payment verification