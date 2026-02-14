const mongoose = require('mongoose');
const ORDER_STATUS = require('../domain/orderStatus');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    size: String,
    color: String,
    price: {
        type: Number,
        required: true,
    },
    discountedPrice: {
        type: Number,
        default: 0,
    },
    itemStatus: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING,
    },
    commission: {
        type: Number,
        default: 0,
    },
    sellerEarnings: {
        type: Number,
        default: 0,
    },
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderItems: [orderItemSchema],
        shippingAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'online', 'wallet'],
            default: 'COD',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentId: {
            type: String,
        },
        orderStatus: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.PENDING,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        totalDiscountedPrice: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        shippingCost: {
            type: Number,
            default: 0,
        },
        totalCommission: {
            type: Number,
            default: 0,
        },
        orderNotes: {
            type: String,
            maxlength: [500, 'Order notes cannot exceed 500 characters'],
        },
        deliveredAt: Date,
        cancelledAt: Date,
        cancelReason: String,
    },
    { timestamps: true }
);

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ 'orderItems.seller': 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
