const { body } = require('express-validator');

const validateCreateProduct = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Product title is required')
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Product description is required')
        .isLength({ max: 5000 })
        .withMessage('Description cannot exceed 5000 characters'),

    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),

    body('quantity')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),

    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isMongoId()
        .withMessage('Invalid category ID'),

    body('discountPercent')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Discount must be between 0 and 100'),

    body('brand')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Brand cannot exceed 100 characters'),

    body('color')
        .optional()
        .trim(),

    body('sizes')
        .optional(),

    body('specifications')
        .optional(),

    body('tags')
        .optional(),
];

const validateUpdateProduct = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Description cannot exceed 5000 characters'),

    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),

    body('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),

    body('discountPercent')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Discount must be between 0 and 100'),
];

module.exports = {
    validateCreateProduct,
    validateUpdateProduct,
};
