const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
      index: true
    },

    otp: {
      type: String,
      required: [true, 'OTP is required'],
      select: false // Don't include in queries by default for security
    },

    type: {
      type: String,
      enum: ['registration', 'password_reset', 'seller_verification', 'login_2fa'],
      required: [true, 'OTP type is required']
    },

    isUsed: {
      type: Boolean,
      default: false
    },

    attempts: {
      type: Number,
      default: 0,
      max: 5
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index: MongoDB will auto-delete expired documents
    },

    lastResendAt: {
      type: Date,
      default: null
    },

    ipAddress: {
      type: String
    },

    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
otpSchema.index({ email: 1, type: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);
