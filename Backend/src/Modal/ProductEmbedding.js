const mongoose = require('mongoose');

const productEmbeddingSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true,
        index: true,
    },
    embedding: {
        type: [Number],
        required: true,
    },
    embeddingType: {
        type: String,
        enum: ['image', 'text'],
        default: 'text',
    },
    imageUrl: {
        type: String,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index for fast lookups
productEmbeddingSchema.index({ productId: 1, embeddingType: 1 });

module.exports = mongoose.model('ProductEmbedding', productEmbeddingSchema);
