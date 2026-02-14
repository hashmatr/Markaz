const { body } = require('express-validator');

const validateSellerRegistration = [
    body('storeName')
        .trim()
        .notEmpty()
        .withMessage('Store name is required')
        .isLength({ max: 100 })
        .withMessage('Store name cannot exceed 100 characters'),

    body('businessEmail')
        .trim()
        .isEmail()
        .withMessage('Valid business email is required')
        .normalizeEmail(),

    body('businessPhone')
        .trim()
        .notEmpty()
        .withMessage('Business phone is required'),

    body('storeDescription')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
];

const validateSellerUpdate = [
    body('storeName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Store name cannot exceed 100 characters'),

    body('storeDescription')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),

    body('businessPhone')
        .optional()
        .trim(),
];

module.exports = {
    validateSellerRegistration,
    validateSellerUpdate,
};
