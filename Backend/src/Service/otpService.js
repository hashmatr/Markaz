const OTP = require('../Modal/OTP');
const { generateOTP, hashOTP, verifyOTP, generateOTPExpiry, isOTPExpired } = require('../utils/generateOTP');
const { sendOTPEmail } = require('../utils/sendEmail');

class OTPService {
  /**
   * Generate and send OTP to email
   * @param {string} email - Email to send OTP to
   * @param {string} type - OTP type (registration, password_reset, etc.)
   * @param {object} metadata - Additional metadata (ipAddress, userAgent)
   * @returns {Promise<object>} - Result object
   */
  async generateOTP(email, type = 'registration', metadata = {}) {
    try {
      // Check if OTP was recently requested (cooldown check)
      const recentOTP = await OTP.findOne({
        email: email.toLowerCase(),
        type: type,
        isUsed: false,
        createdAt: {
          $gte: new Date(Date.now() - 60 * 1000) // Last 60 seconds
        }
      });

      if (recentOTP) {
        throw new Error('OTP was recently sent. Please wait before requesting a new one.');
      }

      // Mark old unused OTPs as expired
      await OTP.deleteMany({
        email: email.toLowerCase(),
        type: type,
        isUsed: false,
        expiresAt: { $lt: new Date() }
      });

      // Generate OTP
      const plainOTP = generateOTP();
      const hashedOTP = await hashOTP(plainOTP);
      const expiresAt = generateOTPExpiry(10); // 10 minutes expiry

      // Save OTP to database
      const otpRecord = await OTP.create({
        email: email.toLowerCase(),
        otp: hashedOTP,
        type: type,
        expiresAt: expiresAt,
        lastResendAt: new Date(),
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null
      });

      // Send OTP via email
      try {
        await sendOTPEmail(email, plainOTP, type);
      } catch (emailError) {
        // Delete OTP if email sending fails
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new Error(`Failed to send OTP email: ${emailError.message}`);
      }

      return {
        success: true,
        message: `OTP has been sent to ${email}. It will expire in 10 minutes.`,
        email: email,
        type: type
      };
    } catch (error) {
      throw new Error(`OTP Generation Error: ${error.message}`);
    }
  }

  /**
   * Verify OTP
   * @param {string} email - Email to verify
   * @param {string} otp - OTP provided by user
   * @param {string} type - OTP type
   * @param {boolean} consume - Whether to mark OTP as used (default: true)
   * @returns {Promise<object>} - Verification result
   */
  async verifyOTP(email, otp, type = 'registration', consume = true) {
    try {
      const normalizedEmail = email.toLowerCase();

      // Find OTP record
      const otpRecord = await OTP.findOne({
        email: normalizedEmail,
        type: type,
        isUsed: false,
        expiresAt: { $gt: new Date() } // Not expired
      }).select('+otp');

      if (!otpRecord) {
        throw new Error('OTP not found or has expired. Please request a new OTP.');
      }

      // Check attempts limit
      if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
      }

      // Verify OTP
      const isValid = await verifyOTP(otp, otpRecord.otp);

      if (!isValid) {
        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        const attemptsLeft = 5 - otpRecord.attempts;
        throw new Error(`Invalid OTP. You have ${attemptsLeft} attempts remaining.`);
      }

      // OTP is valid - mark as used only if requested
      if (consume) {
        otpRecord.isUsed = true;
        await otpRecord.save();
      }

      return {
        success: true,
        message: 'OTP verified successfully',
        email: normalizedEmail,
        type: type
      };
    } catch (error) {
      throw new Error(`OTP Verification Error: ${error.message}`);
    }
  }

  /**
   * Resend OTP (with cooldown check)
   * @param {string} email - Email to resend OTP to
   * @param {string} type - OTP type
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} - Result object
   */
  async resendOTP(email, type = 'registration', metadata = {}) {
    try {
      const normalizedEmail = email.toLowerCase();

      // Check last resend time (cooldown: 60 seconds)
      const lastOTP = await OTP.findOne({
        email: normalizedEmail,
        type: type
      }).sort({ lastResendAt: -1 });

      if (lastOTP && lastOTP.lastResendAt) {
        const timeSinceLastResend = (Date.now() - lastOTP.lastResendAt.getTime()) / 1000;
        if (timeSinceLastResend < 60) {
          const secondsToWait = Math.ceil(60 - timeSinceLastResend);
          throw new Error(`Please wait ${secondsToWait} seconds before requesting another OTP.`);
        }
      }

      // Delete old OTPs for this email/type
      await OTP.deleteMany({
        email: normalizedEmail,
        type: type
      });

      // Generate and send new OTP
      return await this.generateOTP(normalizedEmail, type, metadata);
    } catch (error) {
      throw new Error(`OTP Resend Error: ${error.message}`);
    }
  }

  /**
   * Mark OTP as used (after successful password reset, etc.)
   * @param {string} email - Email
   * @param {string} type - OTP type
   * @returns {Promise<void>}
   */
  async markOTPAsUsed(email, type) {
    try {
      await OTP.updateMany(
        {
          email: email.toLowerCase(),
          type: type,
          isUsed: false
        },
        { isUsed: true }
      );
    } catch (error) {
      throw new Error(`Error marking OTP as used: ${error.message}`);
    }
  }

  /**
   * Delete expired OTPs (cleanup)
   * @returns {Promise<number>} - Number of deleted OTPs
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await OTP.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Error cleaning up expired OTPs: ${error.message}`);
    }
  }

  /**
   * Delete all OTPs for an email (after successful use)
   * @param {string} email - Email
   * @returns {Promise<void>}
   */
  async deleteAllOTPsForEmail(email) {
    try {
      await OTP.deleteMany({
        email: email.toLowerCase()
      });
    } catch (error) {
      throw new Error(`Error deleting OTPs: ${error.message}`);
    }
  }

  /**
   * Get OTP status (for debugging/testing)
   * @param {string} email - Email
   * @param {string} type - OTP type
   * @returns {Promise<object>} - Status information
   */
  async getOTPStatus(email, type) {
    try {
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        type: type,
        isUsed: false
      }).select('-otp');

      if (!otpRecord) {
        return {
          exists: false,
          message: 'No valid OTP found'
        };
      }

      return {
        exists: true,
        email: otpRecord.email,
        type: otpRecord.type,
        isUsed: otpRecord.isUsed,
        attempts: otpRecord.attempts,
        expiresAt: otpRecord.expiresAt,
        isExpired: isOTPExpired(otpRecord.expiresAt),
        createdAt: otpRecord.createdAt
      };
    } catch (error) {
      throw new Error(`Error getting OTP status: ${error.message}`);
    }
  }

  /**
   * Verify OTP for seller verification flow
   * @param {string} email - Seller email
   * @param {string} otp - OTP code
   * @returns {Promise<object>} - Verification result
   */
  async verifySellerOTP(email, otp) {
    return await this.verifyOTP(email, otp, 'seller_verification');
  }

  /**
   * Verify OTP for password reset flow
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<object>} - Verification result
   */
  async verifyPasswordResetOTP(email, otp) {
    return await this.verifyOTP(email, otp, 'password_reset');
  }

  /**
   * Verify OTP for 2FA login flow
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<object>} - Verification result
   */
  async verifyLoginOTP(email, otp) {
    return await this.verifyOTP(email, otp, 'login_2fa');
  }
}

module.exports = new OTPService();
