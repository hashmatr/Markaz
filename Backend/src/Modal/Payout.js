const mongoose = require('mongoose');
const PAYOUT_STATUS = require('../domain/payoutStatus');

const payoutSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seller',
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Payout amount is required'],
            min: [0, 'Payout amount cannot be negative'],
        },
        status: {
            type: String,
            enum: Object.values(PAYOUT_STATUS),
            default: PAYOUT_STATUS.PENDING,
        },
        paymentMethod: {
            type: String,
            enum: ['bank_transfer', 'upi', 'wallet'],
            default: 'bank_transfer',
        },
        transactionId: {
            type: String,
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
        processedAt: Date,
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

payoutSchema.index({ seller: 1 });
payoutSchema.index({ status: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
