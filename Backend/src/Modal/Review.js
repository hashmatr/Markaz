const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
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
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Review title cannot exceed 100 characters'],
        },
        comment: {
            type: String,
            required: [true, 'Review comment is required'],
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        images: [
            {
                public_id: String,
                url: String,
            },
        ],
        isApproved: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Prevent duplicate reviews (one review per user per product)
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1 });
reviewSchema.index({ seller: 1 });

module.exports = mongoose.model('Review', reviewSchema);
