/**
 * EMPLOYEE AUTHENTICATION MIDDLEWARE - TASK 3
 *
 * Provides role-based authentication for employee-only endpoints
 * SECURITY: Ensures only authenticated employees can access verification endpoints
 */

const { authenticateToken } = require('../utils/jwtSecurity');
const { createSecurityEvent } = require('./securityMonitoring');

/**
 * Middleware to authenticate employee access
 *
 * SECURITY FEATURES:
 * - Verifies JWT token validity
 * - Checks for employee role in token claims
 * - Prevents customers from accessing employee endpoints
 * - Logs unauthorized access attempts
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticateEmployee(req, res, next) {
  try {
    // First, verify the token using the standard authentication
    await authenticateToken(req, res, async () => {
      // After token is verified, check if user has employee role
      if (!req.user || req.user.role !== 'employee') {
        // SECURITY: Log unauthorized access attempt
        createSecurityEvent('unauthorized_employee_access', {
          userId: req.user?.userId || 'unknown',
          userRole: req.user?.role || 'none',
          attemptedEndpoint: req.originalUrl,
          method: req.method
        }, req);

        return res.status(403).json({
          success: false,
          message: 'Access denied. Employee authorization required.',
          code: 'EMPLOYEE_ACCESS_REQUIRED'
        });
      }

      // SECURITY: Verify employee account is still active
      // (In production, would check database)
      if (!req.user.userId || !req.user.email) {
        createSecurityEvent('invalid_employee_token', {
          userId: req.user?.userId || 'unknown',
          missingClaims: true
        }, req);

        return res.status(401).json({
          success: false,
          message: 'Invalid employee credentials',
          requiresLogin: true
        });
      }

      // Employee is authenticated and authorized
      next();
    });
  } catch (error) {
    console.error('Employee authentication error:', error);

    createSecurityEvent('employee_auth_error', {
      error: error.message,
      endpoint: req.originalUrl
    }, req);

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      requiresLogin: true
    });
  }
}

/**
 * Middleware to verify employee has specific department access
 * (Optional enhancement for role-based access control)
 *
 * @param {Array<string>} allowedDepartments - List of departments allowed
 * @returns {Function} Express middleware function
 */
function requireDepartment(allowedDepartments) {
  return async (req, res, next) => {
    try {
      // First ensure employee is authenticated
      if (!req.user || req.user.role !== 'employee') {
        return res.status(403).json({
          success: false,
          message: 'Employee authentication required'
        });
      }

      // Check department (would typically come from database)
      // For now, this is a placeholder for future enhancement
      const employeeDepartment = req.user.department || 'Unknown';

      if (!allowedDepartments.includes(employeeDepartment)) {
        createSecurityEvent('department_access_denied', {
          employeeId: req.user.userId,
          employeeDepartment,
          requiredDepartments: allowedDepartments,
          endpoint: req.originalUrl
        }, req);

        return res.status(403).json({
          success: false,
          message: 'Insufficient department permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Department authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
}

/**
 * Middleware to prevent customers from registering as employees
 * Applied to employee registration endpoints (if they existed)
 */
function preventEmployeeRegistration(req, res, next) {
  // SECURITY: Employee registration is explicitly blocked
  createSecurityEvent('employee_registration_attempt', {
    email: req.body?.email || 'unknown',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  }, req);

  return res.status(403).json({
    success: false,
    message: 'Employee registration is not allowed. Employee accounts are pre-provisioned.',
    code: 'REGISTRATION_DISABLED'
  });
}

module.exports = {
  authenticateEmployee,
  requireDepartment,
  preventEmployeeRegistration
};
