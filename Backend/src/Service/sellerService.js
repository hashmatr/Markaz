const Seller = require('../Modal/seller');
const User = require('../Modal/User');
const userRoles = require('../domain/userRole');
const slugify = require('slugify');

class SellerService {
    /**
     * Register as seller (user must already exist)
     */
    async registerSeller(userId, sellerData) {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw Object.assign(new Error('User not found'), { status: 404 });
        }

        // Check if already a seller
        const existingSeller = await Seller.findOne({ user: userId });
        if (existingSeller) {
            throw Object.assign(new Error('You are already registered as a seller'), { status: 409 });
        }

        // Check if store name is taken
        const existingStore = await Seller.findOne({ storeName: sellerData.storeName });
        if (existingStore) {
            throw Object.assign(new Error('Store name is already taken'), { status: 409 });
        }

        // Create seller
        const seller = await Seller.create({
            user: userId,
            storeName: sellerData.storeName,
            storeSlug: slugify(sellerData.storeName, { lower: true, strict: true }),
            storeDescription: sellerData.storeDescription,
            businessEmail: sellerData.businessEmail || user.email,
            businessPhone: sellerData.businessPhone,
            officialWebsite: sellerData.officialWebsite,
            businessDetails: sellerData.businessDetails,
            bankDetails: sellerData.bankDetails,
        });

        // Update user role to SELLER
        user.role = userRoles.SELLER;
        await user.save();

        return seller;
    }

    /**
     * Get seller profile by user ID
     */
    async getSellerByUserId(userId) {
        const seller = await Seller.findOne({ user: userId }).populate('user', 'fullName email avatar');
        if (!seller) {
            throw Object.assign(new Error('Seller profile not found'), { status: 404 });
        }
        return seller;
    }

    /**
     * Get seller profile by ID
     */
    async getSellerById(sellerId) {
        const seller = await Seller.findById(sellerId).populate('user', 'fullName email avatar');
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }
        return seller;
    }

    /**
     * Get seller by store slug
     */
    async getSellerBySlug(slug) {
        const seller = await Seller.findOne({ storeSlug: slug }).populate('user', 'fullName email avatar');
        if (!seller) {
            throw Object.assign(new Error('Store not found'), { status: 404 });
        }
        return seller;
    }

    /**
     * Get all sellers with filters
     */
    async getAllSellers(query = {}) {
        const { status, search, page = 1, limit = 10 } = query;
        const filter = {};

        if (status) filter.accountStatus = status;
        if (search) {
            filter.$or = [
                { storeName: { $regex: search, $options: 'i' } },
                { storeDescription: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const sellers = await Seller.find(filter)
            .populate('user', 'fullName email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Seller.countDocuments(filter);

        return {
            sellers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalSellers: total,
            },
        };
    }

    /**
     * Update seller profile
     */
    async updateSeller(sellerId, userId, updateData) {
        const seller = await Seller.findOne({ _id: sellerId, user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller profile not found or unauthorized'), { status: 404 });
        }

        const allowedUpdates = [
            'storeName', 'storeDescription', 'officialWebsite',
            'businessEmail', 'businessPhone', 'businessDetails', 'bankDetails',
        ];

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                seller[key] = updateData[key];
            }
        }

        // Update slug if store name changed
        if (updateData.storeName) {
            seller.storeSlug = slugify(updateData.storeName, { lower: true, strict: true });
        }

        await seller.save();
        return seller;
    }

    /**
     * Update seller account status (Admin only)
     */
    async updateSellerStatus(sellerId, status) {
        const seller = await Seller.findByIdAndUpdate(
            sellerId,
            { accountStatus: status },
            { new: true, runValidators: true }
        );
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }
        return seller;
    }

    /**
     * Delete seller (Admin only)
     */
    async deleteSeller(sellerId) {
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        // Reset user role to CUSTOMER
        await User.findByIdAndUpdate(seller.user, { role: userRoles.CUSTOMER });

        await Seller.findByIdAndDelete(sellerId);
        return { message: 'Seller deleted successfully' };
    }

    /**
     * Get seller dashboard stats
     */
    async getSellerDashboard(userId) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller profile not found'), { status: 404 });
        }

        return {
            storeName: seller.storeName,
            accountStatus: seller.accountStatus,
            totalProducts: seller.totalProducts,
            totalOrders: seller.totalOrders,
            totalEarnings: seller.totalEarnings,
            pendingPayout: seller.pendingPayout,
            rating: seller.rating,
            totalReviews: seller.totalReviews,
        };
    }
}

module.exports = new SellerService();