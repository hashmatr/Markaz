const { body } = require('express-validator');

const validateCreateOrder = [
    // Allow either shippingAddressId (ObjectId) OR shippingAddress (Object)
    body('shippingAddressId')
        .optional()
        .isMongoId()
        .withMessage('Invalid address ID'),

    body('shippingAddress')
        .if(body('shippingAddressId').not().exists())
        .notEmpty()
        .withMessage('Shipping address or address ID is required'),

    body('paymentMethod')
        .optional()
        .custom((value) => {
            const allowed = ['cod', 'online', 'wallet', 'COD'];
            if (!allowed.includes(value.toLowerCase()) && !allowed.includes(value)) {
                throw new Error('Invalid payment method');
            }
            return true;
        }),

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
