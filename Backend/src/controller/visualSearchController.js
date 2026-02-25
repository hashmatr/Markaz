const visualSearchService = require('../Service/visualSearchService');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * POST /api/visual-search - Search products by uploaded image
 */
const searchByImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image to search',
        });
    }

    console.log(`VisualSearch API: Received image (${Math.round(req.file.size / 1024)}KB, ${req.file.mimetype})`);

    const result = await visualSearchService.searchByImage(req.file.buffer);

    return res.status(200).json({
        success: true,
        data: {
            products: result.products,
            message: result.message,
            totalResults: result.products.length,
        },
    });
});

/**
 * POST /api/visual-search/sync - Sync product embeddings (admin only)
 */
const syncEmbeddings = asyncHandler(async (req, res) => {
    const result = await visualSearchService.syncAllProducts();

    return res.status(200).json({
        success: true,
        message: `Sync complete: ${result.synced}/${result.total} products synced`,
        data: result,
    });
});

/**
 * GET /api/visual-search/status - Get sync status
 */
const getStatus = asyncHandler(async (req, res) => {
    const status = await visualSearchService.getSyncStatus();

    return res.status(200).json({
        success: true,
        data: status,
    });
});

module.exports = { searchByImage, syncEmbeddings, getStatus };
