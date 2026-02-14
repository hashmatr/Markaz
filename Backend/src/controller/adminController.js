const User = require('../Modal/User');
const Seller = require('../Modal/seller');
const Order = require('../Modal/Order');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');
const Payout = require('../Modal/Payout');
const payoutService = require('../Service/payoutService');
const sellerService = require('../Service/sellerService');
const asyncHandler = require('../middleware/asyncHandler');
const slugify = require('slugify');

class AdminController {
    /**
     * GET /api/admin/dashboard - Admin dashboard stats
     */
    getDashboard = asyncHandler(async (req, res) => {
        const [
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            pendingSellers,
            pendingPayouts,
        ] = await Promise.all([
            User.countDocuments(),
            Seller.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Seller.countDocuments({ accountStatus: 'pending' }),
            Payout.countDocuments({ status: 'pending' }),
        ]);

        // Revenue calculation
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

        // Recent orders
        const recentOrders = await Order.find()
            .populate('user', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(10);

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalSellers,
                    totalProducts,
                    totalOrders,
                    pendingSellers,
                    pendingPayouts,
                    totalRevenue: revenueStats[0]?.totalRevenue || 0,
                    totalCommission: revenueStats[0]?.totalCommission || 0,
                },
                recentOrders,
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
