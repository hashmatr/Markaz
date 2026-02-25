const mongoose = require('mongoose');

const productCommentSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductComment',
            default: null,
        },
        isSellerReply: {
            type: Boolean,
            default: false,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes
productCommentSchema.index({ product: 1, createdAt: -1 });
productCommentSchema.index({ parentComment: 1 });
productCommentSchema.index({ user: 1 });

module.exports = mongoose.model('ProductComment', productCommentSchema);
