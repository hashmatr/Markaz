const { body } = require('express-validator');

const validateCreateOrder = [
    body('shippingAddressId')
        .notEmpty()
        .withMessage('Shipping address is required')
        .isMongoId()
        .withMessage('Invalid address ID'),

    body('paymentMethod')
        .optional()
        .isIn(['COD', 'online', 'wallet'])
        .withMessage('Invalid payment method'),

    body('orderNotes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Order notes cannot exceed 500 characters'),
];

const validateUpdateOrderStatus = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        .withMessage('Invalid order status'),
];

module.exports = {
    validateCreateOrder,
    validateUpdateOrderStatus,
};
