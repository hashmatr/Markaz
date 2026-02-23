const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
        min: [1, 'Quantity must be at least 1'],
        default: 1,
    },
    size: String,
    color: String,
    selectedOptions: {
        type: Map,
        of: String, // e.g. { "Storage": "256GB", "Color": "Midnight Blue" }
    },
    price: {
        type: Number,
        required: true,
    },
    discountedPrice: {
        type: Number,
        default: 0,
    },
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        items: [cartItemSchema],
        totalPrice: {
            type: Number,
            default: 0,
        },
        totalDiscountedPrice: {
            type: Number,
            default: 0,
        },
        totalItems: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Recalculate totals before saving
cartSchema.pre('save', function () {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.totalDiscountedPrice = this.items.reduce(
        (sum, item) => sum + (item.discountedPrice || item.price) * item.quantity,
        0
    );
    this.discount = this.totalPrice - this.totalDiscountedPrice;
});

module.exports = mongoose.model('Cart', cartSchema);
