const OTP = require('../Modal/OTP');
const User = require('../Modal/User');
const { generateOTP, hashOTP, verifyOTP: verifyOTPHash, generateOTPExpiry, isOTPExpired } = require('../utils/generateOTP');
const { sendOTPEmail } = require('../utils/sendEmail');
const redisTokenService = require('./redisTokenService');

class OTPService {
  /**
   * Generate and send OTP to email.
   * Storage: Redis (primary) → MongoDB (fallback)
   */
  async generateOTP(email, type = 'registration', metadata = {}) {
    const normalizedEmail = email.toLowerCase();
    const useRedis = redisTokenService.isAvailable();

    // ── Cooldown check ──────────────────────────────────────────────────
    if (useRedis) {
      const cooldownTTL = await redisTokenService.getCooldownTTL(normalizedEmail, type);
      if (cooldownTTL > 0) {
        throw Object.assign(
          new Error(`OTP was recently sent. Please wait ${cooldownTTL} seconds before requesting a new one.`),
          { status: 429 }
        );
      }
    } else {
      // MongoDB fallback cooldown
      const recentOTP = await OTP.findOne({
        email: normalizedEmail,
        type,
        isUsed: false,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
      });
      if (recentOTP) {
        throw Object.assign(
          new Error('OTP was recently sent. Please wait before requesting a new one.'),
          { status: 429 }
        );
      }
    }

    // ── Account existence check ─────────────────────────────────────────
    if (['password_reset', 'login_2fa'].includes(type)) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        throw Object.assign(
          new Error('No account found with this email address.'),
          { status: 404 }
        );
      }
    }

    // ── Generate OTP ────────────────────────────────────────────────────
    const plainOTP = generateOTP();
    const hashedOTP = await hashOTP(plainOTP);

    // ── Send email FIRST — don't store if sending fails ─────────────────
    try {
      await sendOTPEmail(email, plainOTP, type);
    } catch (emailError) {
      throw new Error(`Failed to send OTP email: ${emailError.message}`);
    }

    // ── Store token ─────────────────────────────────────────────────────
    if (useRedis) {
      await redisTokenService.storeOTP(
        normalizedEmail,
        plainOTP,
        type,
        hashedOTP,
        metadata.ipAddress,
        metadata.userAgent
      );
    } else {
      // MongoDB fallback: delete old, create new
      await OTP.deleteMany({ email: normalizedEmail, type, isUsed: false });
      const expiresAt = generateOTPExpiry(10);
      await OTP.create({
        email: normalizedEmail,
        otp: hashedOTP,
        type,
        expiresAt,
        lastResendAt: new Date(),
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
      });
    }

    return {
      success: true,
      message: `OTP has been sent to ${email}. It will expire in 10 minutes.`,
      email,
      type,
      storage: useRedis ? 'redis' : 'mongodb',
    };
  }

  /**
   * Verify OTP provided by user.
   * @param {string} email
   * @param {string} otp - The plaintext OTP from the user
   * @param {string} type
   * @param {boolean} consume - Whether to delete OTP after successful verify
   */
  async verifyOTP(email, otp, type = 'registration', consume = true) {
    const normalizedEmail = email.toLowerCase();
    const useRedis = redisTokenService.isAvailable();

    if (useRedis) {
      // ── Redis path ──────────────────────────────────────────────────
      const data = await redisTokenService.getOTPData(normalizedEmail, type);

      if (!data) {
        throw Object.assign(
          new Error('OTP not found or has expired. Please request a new OTP.'),
          { status: 404 }
        );
      }

      if (data.attempts >= 5) {
        await redisTokenService.deleteOTP(normalizedEmail, type);
        throw Object.assign(
          new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.'),
          { status: 400 }
        );
      }

      const isValid = await verifyOTPHash(otp, data.hashedOTP);

      if (!isValid) {
        const newAttempts = await redisTokenService.incrementOTPAttempts(normalizedEmail, type);
        const attemptsLeft = 5 - newAttempts;
        if (attemptsLeft <= 0) {
          await redisTokenService.deleteOTP(normalizedEmail, type);
          throw Object.assign(
            new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.'),
            { status: 400 }
          );
        }
        throw Object.assign(
          new Error(`Invalid OTP. You have ${attemptsLeft} attempts remaining.`),
          { status: 400 }
        );
      }

      if (consume) {
        await redisTokenService.deleteOTP(normalizedEmail, type);
      }
    } else {
      // ── MongoDB fallback path ───────────────────────────────────────
      const otpRecord = await OTP.findOne({
        email: normalizedEmail,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).select('+otp');

      if (!otpRecord) {
        throw Object.assign(
          new Error('OTP not found or has expired. Please request a new OTP.'),
          { status: 404 }
        );
      }

      if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw Object.assign(
          new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.'),
          { status: 400 }
        );
      }

      const isValid = await verifyOTPHash(otp, otpRecord.otp);

      if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const attemptsLeft = 5 - otpRecord.attempts;
        throw Object.assign(
          new Error(`Invalid OTP. You have ${attemptsLeft} attempts remaining.`),
          { status: 400 }
        );
      }

      if (consume) {
        otpRecord.isUsed = true;
        await otpRecord.save();
      }
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      email: normalizedEmail,
      type,
    };
  }

  /**
   * Resend OTP (enforces cooldown, resets old OTP).
   */
  async resendOTP(email, type = 'registration', metadata = {}) {
    const normalizedEmail = email.toLowerCase();

    if (!redisTokenService.isAvailable()) {
      // MongoDB: check last resend time manually
      const lastOTP = await OTP.findOne({ email: normalizedEmail, type }).sort({ lastResendAt: -1 });
      if (lastOTP && lastOTP.lastResendAt) {
        const seconds = (Date.now() - lastOTP.lastResendAt.getTime()) / 1000;
        if (seconds < 60) {
          const wait = Math.ceil(60 - seconds);
          throw Object.assign(
            new Error(`Please wait ${wait} seconds before requesting another OTP.`),
            { status: 429 }
          );
        }
      }
      await OTP.deleteMany({ email: normalizedEmail, type });
    }
    // Redis: cooldown is auto-enforced inside generateOTP via TTL key

    return await this.generateOTP(normalizedEmail, type, metadata);
  }

  /**
   * Delete all OTPs for an email (after successful password reset, etc.)
   */
  async deleteAllOTPsForEmail(email) {
    const normalizedEmail = email.toLowerCase();
    if (redisTokenService.isAvailable()) {
      await redisTokenService.deleteAllOTPsForEmail(normalizedEmail);
    } else {
      await OTP.deleteMany({ email: normalizedEmail });
    }
  }

  /**
   * Get OTP status (dev / debug only).
   */
  async getOTPStatus(email, type) {
    const normalizedEmail = email.toLowerCase();
    if (redisTokenService.isAvailable()) {
      return await redisTokenService.getOTPStatus(normalizedEmail, type);
    }

    const otpRecord = await OTP.findOne({ email: normalizedEmail, type, isUsed: false }).select('-otp');
    if (!otpRecord) return { exists: false, message: 'No valid OTP found' };

    return {
      exists: true,
      email: otpRecord.email,
      type: otpRecord.type,
      isUsed: otpRecord.isUsed,
      attempts: otpRecord.attempts,
      expiresAt: otpRecord.expiresAt,
      isExpired: isOTPExpired(otpRecord.expiresAt),
      createdAt: otpRecord.createdAt,
    };
  }

  /**
   * Cleanup expired OTPs in MongoDB (for cron job).
   * Redis TTL handles expiry automatically, so this is only for fallback store.
   */
  async cleanupExpiredOTPs() {
    const result = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
    return result.deletedCount;
  }

  // ── Convenience wrappers ─────────────────────────────────────────────────

  async verifySellerOTP(email, otp) {
    return this.verifyOTP(email, otp, 'seller_verification');
  }

  async verifyPasswordResetOTP(email, otp) {
    return this.verifyOTP(email, otp, 'password_reset', false); // Don't consume on verify
  }

  async verifyLoginOTP(email, otp) {
    return this.verifyOTP(email, otp, 'login_2fa');
  }

  async markOTPAsUsed(email, type) {
    if (redisTokenService.isAvailable()) {
      await redisTokenService.deleteOTP(email.toLowerCase(), type);
    } else {
      await OTP.updateMany(
        { email: email.toLowerCase(), type, isUsed: false },
        { isUsed: true }
      );
    }
  }
}

module.exports = new OTPService();
