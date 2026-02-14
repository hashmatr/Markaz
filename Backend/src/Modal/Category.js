const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            unique: true,
            maxlength: [100, 'Category name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        image: {
            public_id: String,
            url: String,
        },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        level: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

categorySchema.index({ name: 'text' });

module.exports = mongoose.model('Category', categorySchema);
