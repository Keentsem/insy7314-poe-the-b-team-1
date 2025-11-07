const { body, validationResult } = require('express-validator');

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const sanitizeString = (str) => {
  if (typeof str !== 'string') {return '';}

  return str
    .replace(/[<>\"'&]/g, '')
    .trim()
    .substring(0, 255);
};

const validateEmail = () => {
  return body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .matches(EMAIL_REGEX)
    .withMessage('Email must be RFC-5322 compliant')
    .isLength({ max: 254 })
    .withMessage('Email too long')
    .customSanitizer(sanitizeString);
};

const validatePassword = () => {
  return body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(PASSWORD_REGEX)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .isLength({ max: 128 })
    .withMessage('Password too long');
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const rateLimitMessage = {
  success: false,
  message: 'Too many requests, please try again later',
  retryAfter: '15 minutes'
};

module.exports = {
  validateEmail,
  validatePassword,
  handleValidationErrors,
  sanitizeString,
  rateLimitMessage,
  EMAIL_REGEX,
  PASSWORD_REGEX
};