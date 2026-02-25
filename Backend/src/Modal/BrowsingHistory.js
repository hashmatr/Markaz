const mongoose = require('mongoose');

const browsingHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        // Denormalized fields for fast aggregation (no need to join Product table)
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        brand: {
            type: String,
            trim: true,
        },
        priceRange: {
            type: String,
            enum: ['budget', 'mid', 'premium', 'luxury'],
            default: 'mid',
        },
        tags: [String],
        viewCount: {
            type: Number,
            default: 1,
        },
        lastViewedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound index: one entry per user+product pair
browsingHistorySchema.index({ user: 1, product: 1 }, { unique: true });
// For querying recent views
browsingHistorySchema.index({ user: 1, lastViewedAt: -1 });
// For category/brand aggregation
browsingHistorySchema.index({ user: 1, category: 1 });
browsingHistorySchema.index({ user: 1, brand: 1 });

/**
 * Utility: Classify a price into a range bucket
 */
browsingHistorySchema.statics.classifyPrice = function (price) {
    if (price <= 1000) return 'budget';
    if (price <= 5000) return 'mid';
    if (price <= 20000) return 'premium';
    return 'luxury';
};

module.exports = mongoose.model('BrowsingHistory', browsingHistorySchema);
