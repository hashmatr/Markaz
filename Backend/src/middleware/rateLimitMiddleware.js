const rateLimit = require('express-rate-limit');

/**
 * General rate limiter for API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for certain IPs or in development
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * OTP verification rate limiter
 * Limits: 5 attempts per 10 minutes per email
 */
const otpVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: 'Too many OTP verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * OTP resend/generation rate limiter
 * Limits: 3 OTP requests per 60 seconds per email
 * Prevents OTP spamming
 */
const otpGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute (60 seconds)
  max: 3,
  message: 'Too many OTP requests. Please wait before requesting a new OTP.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * OTP resend rate limiter with cooldown
 * Limits: 1 resend per 60 seconds
 */
const otpResendLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds cooldown
  max: 1,
  message: 'OTP resend cooldown. Please wait 60 seconds before requesting a new OTP.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Login attempts rate limiter
 * Limits: 5 attempts per 15 minutes per email
 */
const loginAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

module.exports = {
  generalLimiter,
  otpVerificationLimiter,
  otpGenerationLimiter,
  otpResendLimiter,
  loginAttemptLimiter
};
