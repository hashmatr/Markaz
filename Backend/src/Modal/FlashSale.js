const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Flash sale title is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                flashPrice: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                originalPrice: {
                    type: Number,
                    required: true,
                },
                flashDiscountPercent: {
                    type: Number,
                    min: 0,
                    max: 100,
                },
                maxQuantity: {
                    type: Number,
                    default: 50,
                },
                soldCount: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        bannerColor: {
            type: String,
            default: '#ef4444',
        },
        bannerGradient: {
            type: String,
            default: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
        },
    },
    { timestamps: true }
);

// Indexes
flashSaleSchema.index({ startTime: 1, endTime: 1 });
flashSaleSchema.index({ isActive: 1 });

module.exports = mongoose.model('FlashSale', flashSaleSchema);
