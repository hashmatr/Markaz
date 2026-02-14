const express = require('express');
const otpController = require('../controller/otpController');
const {
  validateOTPVerification,
  validateOTPGeneration,
  validateOTPResend,
  validatePasswordReset
} = require('../validators/otpValidator');
const {
  otpGenerationLimiter,
  otpVerificationLimiter,
  otpResendLimiter
} = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Public endpoints
/**
 * Generate OTP
 * POST /api/otp/generate
 * Body: { email, type: 'registration|password_reset|seller_verification|login_2fa' }
 */
router.post(
  '/generate',
  otpGenerationLimiter,
  validateOTPGeneration,
  otpController.generateOTP
);

/**
 * Verify OTP
 * POST /api/otp/verify
 * Body: { email, otp, type }
 */
router.post(
  '/verify',
  otpVerificationLimiter,
  validateOTPVerification,
  otpController.verifyOTP
);

/**
 * Resend OTP
 * POST /api/otp/resend
 * Body: { email, type }
 * Rate limited: 1 request per 60 seconds
 */
router.post(
  '/resend',
  otpResendLimiter,
  validateOTPResend,
  otpController.resendOTP
);

/**
 * Reset Password with OTP verification
 * POST /api/otp/reset-password
 * Body: { email, otp, newPassword, confirmPassword }
 */
router.post(
  '/reset-password',
  otpVerificationLimiter,
  validatePasswordReset,
  otpController.resetPasswordWithOTP
);

/**
 * Verify Seller OTP
 * POST /api/otp/verify-seller
 * Body: { email, otp }
 */
router.post(
  '/verify-seller',
  otpVerificationLimiter,
  validateOTPVerification,
  otpController.verifySellerOTP
);

/**
 * Verify Login OTP (2FA)
 * POST /api/otp/verify-login
 * Body: { email, otp }
 */
router.post(
  '/verify-login',
  otpVerificationLimiter,
  validateOTPVerification,
  otpController.verifyLoginOTP
);

// Development/Testing endpoints
/**
 * Get OTP Status (Development only)
 * GET /api/otp/status/:email/:type
 */
router.get(
  '/status/:email/:type',
  otpController.getOTPStatus
);

/**
 * Cleanup expired OTPs (Should be called by cron/scheduler)
 * POST /api/otp/cleanup
 */
router.post(
  '/cleanup',
  otpController.cleanupExpiredOTPs
);

module.exports = router;
