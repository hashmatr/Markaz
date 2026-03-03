const Product = require('../Modal/Product');
const asyncHandler = require('../middleware/asyncHandler');
const pineconeService = require('../Service/pineconeService');

/**
 * POST /api/visual-search
 * Search by uploaded image → CLIP embedding → Pinecone image index.
 * Returns visually similar products ranked by similarity.
 */
const searchByImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image to search',
        });
    }

    const { category, topK = 10 } = req.body || {};

    try {
        // Pass the raw buffer directly — embeddingService handles Buffer→RawImage conversion
        const { products, matches } = await pineconeService.searchByImage(req.file.buffer, {
            topK: parseInt(topK),
            category,
        });

        return res.status(200).json({
            success: true,
            data: {
                products,
                totalResults: products.length,
                matches: matches.map(m => ({
                    productId: m.metadata?.mongoId,
                    score: Math.round((m.score || 0) * 1000) / 1000,
                    title: m.metadata?.title,
                })),
                searchType: 'visual',
            },
        });
    } catch (err) {
        console.error('Visual search error:', err.message);
        return res.status(200).json({
            success: true,
            data: {
                products: [],
                totalResults: 0,
                message: 'Visual search encountered an error. Please try again.',
                searchType: 'visual',
            },
        });
    }
});

/**
 * POST /api/visual-search/text
 * Semantic text search → BGE embedding → Pinecone text index.
 * Supports optional metadata filters (category, price range).
 */
const searchByText = asyncHandler(async (req, res) => {
    const { query, category, minPrice, maxPrice, topK = 10 } = req.body || {};

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required',
        });
    }

    try {
        const { products, matches } = await pineconeService.searchByText(query.trim(), {
            topK: parseInt(topK),
            category,
            minPrice,
            maxPrice,
        });

        return res.status(200).json({
            success: true,
            data: {
                products,
                totalResults: products.length,
                matches: matches.map(m => ({
                    productId: m.metadata?.mongoId,
                    score: Math.round((m.score || 0) * 1000) / 1000,
                    title: m.metadata?.title,
                })),
                searchType: 'semantic',
            },
        });
    } catch (err) {
        console.error('Semantic text search error:', err.message);
        return res.status(200).json({
            success: true,
            data: {
                products: [],
                totalResults: 0,
                message: 'Semantic search encountered an error. Falling back to regular search.',
                searchType: 'semantic',
            },
        });
    }
});

/**
 * GET /api/visual-search/status
 * Returns the status of both Pinecone indexes.
 */
const getStatus = asyncHandler(async (req, res) => {
    const totalProducts = await Product.countDocuments({ isActive: true });

    try {
        const stats = await pineconeService.getStats();

        const textVectors = stats.text?.totalRecordCount || 0;
        const imageVectors = stats.image?.totalRecordCount || 0;

        return res.status(200).json({
            success: true,
            data: {
                totalProducts,
                textIndex: {
                    syncedProducts: textVectors,
                    percentage: totalProducts > 0 ? Math.round((textVectors / totalProducts) * 100) : 0,
                    isReady: textVectors > 0,
                },
                imageIndex: {
                    syncedProducts: imageVectors,
                    percentage: totalProducts > 0 ? Math.round((imageVectors / totalProducts) * 100) : 0,
                    isReady: imageVectors > 0,
                },
                backend: 'pinecone-dual-index',
            },
        });
    } catch (err) {
        return res.status(200).json({
            success: true,
            data: {
                totalProducts,
                textIndex: { syncedProducts: 0, percentage: 0, isReady: false },
                imageIndex: { syncedProducts: 0, percentage: 0, isReady: false },
                backend: 'pinecone-dual-index',
                error: err.message,
            },
        });
    }
});

module.exports = { searchByImage, searchByText, getStatus };
