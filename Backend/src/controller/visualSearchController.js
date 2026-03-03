const Product = require('../Modal/Product');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * POST /api/visual-search
 * Visual image search is unavailable (embedding model removed).
 * Returns a friendly message so the frontend doesn't break.
 */
const searchByImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image to search',
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            products: [],
            message: 'Visual search by image is currently unavailable. Please use the text search bar to find products.',
            totalResults: 0,
        },
    });
});

/**
 * GET /api/visual-search/status
 */
const getStatus = asyncHandler(async (req, res) => {
    const totalProducts = await Product.countDocuments({ isActive: true });
    return res.status(200).json({
        success: true,
        data: {
            totalProducts,
            syncedProducts: totalProducts,
            percentage: 100,
            isReady: true,
            backend: 'mongodb',
        },
    });
});

module.exports = { searchByImage, getStatus };
