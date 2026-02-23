const otpService = require('../Service/otpService');
const User = require('../Modal/User');
const bcrypt = require('bcrypt');
const {
  validateOTPVerification,
  validateOTPGeneration,
  validateOTPResend,
  validatePasswordReset
} = require('../validators/otpValidator');
const asyncHandler = require('../middleware/asyncHandler');

class OTPController {
  /**
   * Generate OTP for registration
   * POST /api/otp/generate
   */
  generateOTP = asyncHandler(async (req, res) => {
    const { email, type = 'registration' } = req.body;

    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    const result = await otpService.generateOTP(email, type, metadata);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
        type: result.type
      }
    });
  });

  /**
   * Verify OTP provided by user
   * POST /api/otp/verify
   */
  verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp, type = 'registration' } = req.body;

    // For password reset flow, we don't consume the OTP in the verification step
    // because it needs to be verified again in the final reset-password step.
    const consume = type !== 'password_reset';
    const result = await otpService.verifyOTP(email, otp, type, consume);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
        type: result.type,
        verified: true
      }
    });
  });

  /**
   * Resend OTP (with cooldown)
   * POST /api/otp/resend
   */
  resendOTP = asyncHandler(async (req, res) => {
    const { email, type = 'registration' } = req.body;

    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    const result = await otpService.resendOTP(email, type, metadata);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
        type: result.type
      }
    });
  });

  /**
   * Verify OTP and reset password
   * POST /api/otp/reset-password
   * Body: { email, otp, newPassword, confirmPassword }
   */
  resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    // Find user first
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Then verify the OTP
    await otpService.verifyPasswordResetOTP(email, otp);

    // Update password (model pre-save hook handles hashing)
    user.password = newPassword;
    await user.save();

    // Mark OTP as used and delete all OTPs for this email
    await otpService.deleteAllOTPsForEmail(email);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        email: email,
        passwordReset: true
      }
    });
  });

  /**
   * Verify seller with OTP
   * POST /api/otp/verify-seller
   */
  verifySellerOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const result = await otpService.verifySellerOTP(email, otp);

    // TODO: Update seller.isVerified = true in database
    // await Seller.findOneAndUpdate(
    //   { email: email.toLowerCase() },
    //   { isVerified: true }
    // );

    return res.status(200).json({
      success: true,
      message: 'Seller account verified successfully',
      data: {
        email: result.email,
        verified: true
      }
    });
  });

  /**
   * Verify login OTP (2FA)
   * POST /api/otp/verify-login
   */
  verifyLoginOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const result = await otpService.verifyLoginOTP(email, otp);

    // TODO: Issue JWT tokens after OTP verification
    // const tokens = await generateTokens(user);
    // res.cookie('refreshToken', tokens.refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000
    // });

    return res.status(200).json({
      success: true,
      message: 'Login verified successfully',
      data: {
        email: result.email,
        loginVerified: true
      }
    });
  });

  /**
   * Get OTP status (for debugging - remove in production)
   * GET /api/otp/status/:email/:type
   */
  getOTPStatus = asyncHandler(async (req, res) => {
    const { email, type } = req.params;

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is not available in production'
      });
    }

    const status = await otpService.getOTPStatus(email, type);

    return res.status(200).json({
      success: true,
      data: status
    });
  });

  /**
   * Cleanup expired OTPs (Should be called by a cron job)
   * POST /api/otp/cleanup
   */
  cleanupExpiredOTPs = asyncHandler(async (req, res) => {
    const deletedCount = await otpService.cleanupExpiredOTPs();

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount} expired OTPs`,
      data: {
        deletedCount: deletedCount
      }
    });
  });
}

module.exports = new OTPController();
