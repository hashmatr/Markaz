const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Product title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, 'Product description is required'],
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        discountedPrice: {
            type: Number,
            default: 0,
            min: [0, 'Discounted price cannot be negative'],
        },
        discountPercent: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be negative'],
            default: 0,
        },
        images: [
            {
                public_id: String,
                url: String,
            },
        ],
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seller',
            required: [true, 'Seller is required'],
        },
        brand: {
            type: String,
            trim: true,
        },
        // NEW: Flexible variants system
        variantOptions: [
            {
                name: String, // e.g. "Size", "Color", "Storage", "RAM"
                values: [String], // e.g. ["S", "M", "L"] or ["128GB", "256GB"]
            },
        ],
        variants: [
            {
                options: {
                    type: Map,
                    of: String, // e.g. { "Size": "M", "Color": "Black" }
                },
                price: Number, // Optional: override base price for this variant
                quantity: {
                    type: Number,
                    required: true,
                    default: 0,
                },
                sku: String,
            },
        ],
        // Keep legacy fields for backward compatibility if needed, or remove them
        color: {
            type: String,
            trim: true,
        },
        sizes: [
            {
                name: String,
                quantity: { type: Number, default: 0 },
            },
        ],
        specifications: [
            {
                key: String,
                value: String,
            },
        ],
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        totalSold: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0,
        },
        tags: [String],
    },
    { timestamps: true }
);

// Auto-calculate discounted price before saving
productSchema.pre('save', function () {
    if (this.discountPercent > 0) {
        this.discountedPrice = Math.round(this.price - (this.price * this.discountPercent) / 100);
    } else {
        this.discountedPrice = this.price;
    }
});

// Indexes for search and filtering
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, seller: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1, totalSold: -1 });

module.exports = mongoose.model('Product', productSchema);
