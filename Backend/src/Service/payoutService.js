const Payout = require('../Modal/Payout');
const Seller = require('../Modal/seller');
const PAYOUT_STATUS = require('../domain/payoutStatus');

class PayoutService {
    /**
     * Request payout (by seller)
     */
    async requestPayout(userId, amount) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        if (seller.pendingPayout < amount) {
            throw Object.assign(new Error(`Insufficient balance. Available: ${seller.pendingPayout}`), { status: 400 });
        }

        if (amount < 100) {
            throw Object.assign(new Error('Minimum payout amount is 100'), { status: 400 });
        }

        // Check if bank details exist
        if (!seller.bankDetails || !seller.bankDetails.accountNumber) {
            throw Object.assign(new Error('Please add bank details before requesting a payout'), { status: 400 });
        }

        const payout = await Payout.create({
            seller: seller._id,
            amount,
            paymentMethod: 'bank_transfer',
        });

        // Deduct from pending payout
        seller.pendingPayout -= amount;
        await seller.save();

        return payout;
    }

    /**
     * Get seller payouts
     */
    async getSellerPayouts(userId, query = {}) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        const { page = 1, limit = 10, status } = query;
        const filter = { seller: seller._id };
        if (status) filter.status = status;

        const skip = (page - 1) * limit;
        const payouts = await Payout.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payout.countDocuments(filter);

        return {
            payouts,
            balance: {
                totalEarnings: seller.totalEarnings,
                pendingPayout: seller.pendingPayout,
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalPayouts: total,
            },
        };
    }

    /**
     * Process payout (admin)
     */
    async processPayout(payoutId, adminId, action, transactionId, notes) {
        const payout = await Payout.findById(payoutId);
        if (!payout) {
            throw Object.assign(new Error('Payout not found'), { status: 404 });
        }

        if (payout.status !== PAYOUT_STATUS.PENDING) {
            throw Object.assign(new Error('This payout has already been processed'), { status: 400 });
        }

        if (action === 'approve') {
            payout.status = PAYOUT_STATUS.COMPLETED;
            payout.transactionId = transactionId;
            payout.processedAt = new Date();
            payout.processedBy = adminId;
            payout.notes = notes;
        } else if (action === 'reject') {
            payout.status = PAYOUT_STATUS.FAILED;
            payout.notes = notes || 'Payout rejected by admin';
            payout.processedAt = new Date();
            payout.processedBy = adminId;

            // Refund back to seller's pending payout
            const seller = await Seller.findById(payout.seller);
            if (seller) {
                seller.pendingPayout += payout.amount;
                await seller.save();
            }
        }

        await payout.save();
        return payout;
    }

    /**
     * Get all payouts (admin)
     */
    async getAllPayouts(query = {}) {
        const { page = 1, limit = 20, status } = query;
        const filter = {};
        if (status) filter.status = status;

        const skip = (page - 1) * limit;
        const payouts = await Payout.find(filter)
            .populate('seller', 'storeName bankDetails totalEarnings')
            .populate('processedBy', 'fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payout.countDocuments(filter);

        return {
            payouts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalPayouts: total,
            },
        };
    }
}

module.exports = new PayoutService();
