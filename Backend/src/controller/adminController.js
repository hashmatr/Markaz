const User = require('../Modal/User');
const Seller = require('../Modal/seller');
const Order = require('../Modal/Order');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');
const Review = require('../Modal/Review');
const Payout = require('../Modal/Payout');
const payoutService = require('../Service/payoutService');
const sellerService = require('../Service/sellerService');
const asyncHandler = require('../middleware/asyncHandler');
const slugify = require('slugify');

class AdminController {
    /**
     * GET /api/admin/dashboard - Admin dashboard stats (rich analytics)
     */
    getDashboard = asyncHandler(async (req, res) => {
        const now = new Date();

        // ─── Basic counts ─────────────────────────
        const [
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            pendingSellers,
            pendingPayouts,
            totalReviews,
            activeSellers,
            totalCategories,
        ] = await Promise.all([
            User.countDocuments(),
            Seller.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Seller.countDocuments({ accountStatus: 'pending' }),
            Payout.countDocuments({ status: 'pending' }),
            Review.countDocuments(),
            Seller.countDocuments({ accountStatus: 'active' }),
            Category.countDocuments(),
        ]);

        // ─── Revenue calculation ──────────────────
        const revenueStats = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalDiscountedPrice' },
                    totalCommission: { $sum: '$totalCommission' },
                },
            },
        ]);

        // ─── Monthly Revenue (last 6 months) ─────
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, paymentStatus: 'paid' } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    revenue: { $sum: '$totalDiscountedPrice' },
                    commission: { $sum: '$totalCommission' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // ─── Daily Orders (last 7 days) ──────────
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyOrders = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalDiscountedPrice' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // ─── Order Status Distribution ───────────
        const orderStatusDist = await Order.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        ]);

        // ─── New users last 24 hours ─────────────
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });

        // ─── New users last 7 days (daily) ────────
        const dailyNewUsers = await User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // ─── New orders last 24 hours ────────────
        const newOrdersToday = await Order.countDocuments({ createdAt: { $gte: oneDayAgo } });

        // ─── Revenue last 24 hours ───────────────
        const todayRevenueData = await Order.aggregate([
            { $match: { createdAt: { $gte: oneDayAgo }, paymentStatus: 'paid' } },
            { $group: { _id: null, revenue: { $sum: '$totalDiscountedPrice' } } },
        ]);

        // ─── Top selling products ────────────────
        const topProducts = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.product',
                    totalSold: { $sum: '$orderItems.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$orderItems.discountedPrice', '$orderItems.quantity'] } },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    totalSold: 1,
                    totalRevenue: 1,
                    'product.title': 1,
                    'product.images': { $slice: ['$product.images', 1] },
                    'product.price': 1,
                },
            },
        ]);

        // ─── Review stats ────────────────────────
        const reviewStats = await Review.aggregate([
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                },
            },
        ]);

        // ─── Recent reviews ──────────────────────
        const recentReviews = await Review.find()
            .populate('user', 'fullName avatar')
            .populate('product', 'title images')
            .sort({ createdAt: -1 })
            .limit(5);

        // ─── Recent orders ───────────────────────
        const recentOrders = await Order.find()
            .populate('user', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(10);

        // ─── Orders today by hour (website engagement proxy) ──
        const hourlyActivity = await Order.aggregate([
            { $match: { createdAt: { $gte: oneDayAgo } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // ─── Products per category ───────────────
        const categoryDist = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            { $project: { count: 1, name: { $ifNull: ['$category.name', 'Uncategorized'] } } },
            { $sort: { count: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalSellers,
                    activeSellers,
                    totalProducts,
                    totalOrders,
                    totalCategories,
                    totalReviews,
                    pendingSellers,
                    pendingPayouts,
                    totalRevenue: revenueStats[0]?.totalRevenue || 0,
                    totalCommission: revenueStats[0]?.totalCommission || 0,
                    newUsersToday,
                    newOrdersToday,
                    todayRevenue: todayRevenueData[0]?.revenue || 0,
                },
                charts: {
                    monthlyRevenue,
                    dailyOrders,
                    orderStatusDist,
                    dailyNewUsers,
                    hourlyActivity,
                    categoryDist,
                    topProducts,
                    reviewStats: reviewStats[0] || {
                        averageRating: 0,
                        totalReviews: 0,
                        fiveStar: 0,
                        fourStar: 0,
                        threeStar: 0,
                        twoStar: 0,
                        oneStar: 0,
                    },
                },
                recentOrders,
                recentReviews,
            },
        });
    });

    /**
     * GET /api/admin/users - Get all users
     */
    getAllUsers = asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, role, search } = req.query;
        const filter = {};

        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                },
            },
        });
    });

    /**
     * PUT /api/admin/users/:id/status - Toggle user active status
     */
    updateUserStatus = asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isActive = req.body.isActive;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { user },
        });
    });

    /**
     * DELETE /api/admin/users/:id - Delete user
     */
    deleteUser = asyncHandler(async (req, res) => {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Also delete seller profile if exists
        await Seller.findOneAndDelete({ user: req.params.id });

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    });

    // --- Category management ---

    /**
     * POST /api/admin/categories - Create category
     */
    createCategory = asyncHandler(async (req, res) => {
        const { name, description, parentCategory } = req.body;

        const category = await Category.create({
            name,
            slug: slugify(name, { lower: true, strict: true }),
            description,
            parentCategory: parentCategory || null,
            level: parentCategory ? 1 : 0,
            image: req.file
                ? { public_id: req.file.filename, url: req.file.path }
                : undefined,
        });

        return res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category },
        });
    });

    /**
     * GET /api/admin/categories - Get all categories
     */
    getAllCategories = asyncHandler(async (req, res) => {
        const categories = await Category.find()
            .populate('parentCategory', 'name slug')
            .sort({ level: 1, name: 1 });

        return res.status(200).json({
            success: true,
            data: { categories },
        });
    });

    /**
     * PUT /api/admin/categories/:id - Update category
     */
    updateCategory = asyncHandler(async (req, res) => {
        const updates = { ...req.body };
        if (updates.name) {
            updates.slug = slugify(updates.name, { lower: true, strict: true });
        }
        if (req.file) {
            updates.image = { public_id: req.file.filename, url: req.file.path };
        }

        const category = await Category.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category },
        });
    });

    /**
     * DELETE /api/admin/categories/:id - Delete category
     */
    deleteCategory = asyncHandler(async (req, res) => {
        // Check if products exist in this category
        const productCount = await Product.countDocuments({ category: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${productCount} products are using this category.`,
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    });

    // --- Seller management (Admin) ---

    /**
     * GET /api/admin/sellers - Get all sellers
     */
    getAllSellers = asyncHandler(async (req, res) => {
        const result = await sellerService.getAllSellers(req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * PUT /api/admin/sellers/:id/status - Update seller status
     */
    updateSellerStatus = asyncHandler(async (req, res) => {
        const seller = await sellerService.updateSellerStatus(req.params.id, req.body.status);

        return res.status(200).json({
            success: true,
            message: 'Seller status updated successfully',
            data: { seller },
        });
    });

    /**
     * DELETE /api/admin/sellers/:id - Delete seller (and their products + user account)
     */
    deleteSeller = asyncHandler(async (req, res) => {
        const seller = await Seller.findById(req.params.id);
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        // Delete all products belonging to this seller
        const deletedProducts = await Product.deleteMany({ seller: seller._id });

        // Delete the seller profile
        await Seller.findByIdAndDelete(seller._id);

        // Downgrade the user role to CUSTOMER (instead of deleting the user)
        await User.findByIdAndUpdate(seller.user, { role: 'CUSTOMER' });

        return res.status(200).json({
            success: true,
            message: `Seller deleted. ${deletedProducts.deletedCount} products removed. User account downgraded to Customer.`,
        });
    });

    // --- Payout management (Admin) ---

    /**
     * GET /api/admin/payouts - Get all payouts
     */
    getAllPayouts = asyncHandler(async (req, res) => {
        const result = await payoutService.getAllPayouts(req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * PUT /api/admin/payouts/:id/process - Process payout
     */
    processPayout = asyncHandler(async (req, res) => {
        const { action, transactionId, notes } = req.body;
        const payout = await payoutService.processPayout(
            req.params.id,
            req.user._id,
            action,
            transactionId,
            notes
        );

        return res.status(200).json({
            success: true,
            message: `Payout ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            data: { payout },
        });
    });
}

module.exports = new AdminController();
