const { body } = require('express-validator');

const validateRegister = [
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase, one lowercase, and one number'),
];

const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase, one lowercase, and one number'),

    body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required'),
];

const validateUpdateProfile = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^\d{10,15}$/)
        .withMessage('Please provide a valid phone number'),
];

module.exports = {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateUpdateProfile,
};
