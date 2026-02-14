const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP using bcrypt before storing in database
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} - Hashed OTP
 */
const hashOTP = async (otp) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
  } catch (error) {
    throw new Error(`Error hashing OTP: ${error.message}`);
  }
};

/**
 * Verify OTP by comparing plain text with hashed version
 * @param {string} plainOTP - Plain text OTP from user
 * @param {string} hashedOTP - Hashed OTP from database
 * @returns {Promise<boolean>} - True if matches
 */
const verifyOTP = async (plainOTP, hashedOTP) => {
  try {
    return await bcrypt.compare(plainOTP, hashedOTP);
  } catch (error) {
    throw new Error(`Error verifying OTP: ${error.message}`);
  }
};

/**
 * Generate OTP expiry time
 * @param {number} minutes - Minutes until OTP expires (default: 5)
 * @returns {Date} - Expiry timestamp
 */
const generateOTPExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - OTP expiry timestamp
 * @returns {boolean} - True if expired
 */
const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  generateOTPExpiry,
  isOTPExpired
};
