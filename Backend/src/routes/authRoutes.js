const express = require('express');
const authController = require('../controller/authController');
const authenticate = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { loginAttemptLimiter } = require('../middleware/rateLimitMiddleware');
const {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateUpdateProfile,
} = require('../validators/authValidator');

const router = express.Router();

// ─── Public Routes ───────────────────────────
router.post('/register', validateRegister, validate, authController.register);
router.post('/login', loginAttemptLimiter, validateLogin, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);

// ─── Protected Routes ────────────────────────
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateUpdateProfile, validate, authController.updateProfile);
router.put('/change-password', authenticate, validateChangePassword, validate, authController.changePassword);

module.exports = router;
