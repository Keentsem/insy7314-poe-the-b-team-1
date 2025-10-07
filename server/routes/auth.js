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

module.exports = router;