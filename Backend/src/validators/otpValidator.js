const { body, validationResult, query } = require('express-validator');

/**
 * Validate OTP verification request
 */
const validateOTPVerification = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),

  body('type')
    .trim()
    .isIn(['registration', 'password_reset', 'seller_verification', 'login_2fa'])
    .withMessage('Invalid OTP type'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validate OTP generation request
 */
const validateOTPGeneration = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('type')
    .trim()
    .isIn(['registration', 'password_reset', 'seller_verification', 'login_2fa'])
    .withMessage('Invalid OTP type'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validate OTP resend request
 */
const validateOTPResend = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('type')
    .trim()
    .isIn(['registration', 'password_reset', 'seller_verification', 'login_2fa'])
    .withMessage('Invalid OTP type'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validate password reset with OTP
 */
const validatePasswordReset = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('confirmPassword')
    .trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    // Custom validation: passwords match
    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    next();
  }
];

module.exports = {
  validateOTPVerification,
  validateOTPGeneration,
  validateOTPResend,
  validatePasswordReset
};
