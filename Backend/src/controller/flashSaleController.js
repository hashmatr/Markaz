const FlashSale = require('../Modal/FlashSale');
const { CACHE_KEYS, TTL, getCache, setCache, invalidateCache } = require('../Service/cacheService');
const asyncHandler = require('../middleware/asyncHandler');

class FlashSaleController {
    /**
     * GET /api/flash-sales/active
     * Get currently active flash sales
     */
    getActiveFlashSales = asyncHandler(async (req, res) => {
        // Try cache first
        const cached = await getCache(CACHE_KEYS.FLASH_SALES);
        if (cached) {
            return res.status(200).json({ success: true, data: cached, fromCache: true });
        }

        const now = new Date();
        const flashSales = await FlashSale.find({
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now },
        })
            .populate({
                path: 'products.product',
                select: 'title images rating totalReviews slug seller',
                populate: { path: 'seller', select: 'storeName storeSlug' },
            })
            .sort({ endTime: 1 });

        const response = { flashSales };
        await setCache(CACHE_KEYS.FLASH_SALES, response, TTL.FLASH_SALES);

        return res.status(200).json({ success: true, data: response });
    });

    /**
     * GET /api/flash-sales/upcoming
     * Get upcoming flash sales
     */
    getUpcomingFlashSales = asyncHandler(async (req, res) => {
        const now = new Date();
        const flashSales = await FlashSale.find({
            isActive: true,
            startTime: { $gt: now },
        })
            .populate({
                path: 'products.product',
                select: 'title images rating totalReviews slug',
            })
            .sort({ startTime: 1 })
            .limit(5);

        return res.status(200).json({ success: true, data: { flashSales } });
    });

    /**
     * POST /api/flash-sales (Admin)
     * Create a new flash sale
     */
    createFlashSale = asyncHandler(async (req, res) => {
        const { title, description, products, startTime, endTime, bannerColor, bannerGradient } = req.body;

        // Calculate flash discount percentages
        const processedProducts = products.map(p => ({
            ...p,
            flashDiscountPercent: Math.round(((p.originalPrice - p.flashPrice) / p.originalPrice) * 100),
        }));

        const flashSale = await FlashSale.create({
            title,
            description,
            products: processedProducts,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            bannerColor,
            bannerGradient,
        });

        await invalidateCache(CACHE_KEYS.FLASH_SALES);

        return res.status(201).json({
            success: true,
            message: 'Flash sale created',
            data: { flashSale },
        });
    });

    /**
     * DELETE /api/flash-sales/:id (Admin)
     * Delete a flash sale
     */
    deleteFlashSale = asyncHandler(async (req, res) => {
        const flashSale = await FlashSale.findByIdAndDelete(req.params.id);
        if (!flashSale) {
            return res.status(404).json({ success: false, message: 'Flash sale not found' });
        }

        await invalidateCache(CACHE_KEYS.FLASH_SALES);

        return res.status(200).json({ success: true, message: 'Flash sale deleted' });
    });
}

module.exports = new FlashSaleController();
