const FlashSale = require('../Modal/FlashSale');
const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
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
            $or: [
                { startTime: { $lte: now }, endTime: { $gte: now } },
                { isPermanent: true }
            ],
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
        const { title, description, products, startTime, endTime, bannerColor, bannerGradient, isPermanent } = req.body;

        // Calculate flash discount percentages
        const processedProducts = products.map(p => ({
            ...p,
            flashDiscountPercent: Math.round(((p.originalPrice - p.flashPrice) / p.originalPrice) * 100),
        }));

        const flashSale = await FlashSale.create({
            title,
            description,
            products: processedProducts,
            startTime: startTime ? new Date(startTime) : new Date(),
            endTime: endTime ? new Date(endTime) : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Default to 100 years if permanent
            bannerColor,
            bannerGradient,
            isPermanent: isPermanent || false,
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

    /**
     * POST /api/flash-sales/add-product (Seller)
     * Seller adds their product to an active or permanent flash sale
     */
    addProductToFlashSale = asyncHandler(async (req, res) => {
        const { flashSaleId, productId, flashPrice, maxQuantity } = req.body;
        const userId = req.user._id;

        // 1. Verify seller
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(403).json({ success: false, message: 'Only sellers can add products to flash sales' });
        }

        // 2. Verify product ownership
        const product = await Product.findOne({ _id: productId, seller: seller._id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found or doesn\'t belong to you' });
        }

        // 3. Find Flash Sale
        const flashSale = await FlashSale.findById(flashSaleId);
        if (!flashSale) {
            return res.status(404).json({ success: false, message: 'Flash sale not found' });
        }

        // 4. Check if product already in this flash sale
        const alreadyExists = flashSale.products.find(p => p.product.toString() === productId);
        if (alreadyExists) {
            return res.status(400).json({ success: false, message: 'Product is already in this flash sale' });
        }

        // 5. Add product to Flash Sale document
        const flashDiscountPercent = Math.round(((product.price - flashPrice) / product.price) * 100);

        flashSale.products.push({
            product: productId,
            flashPrice,
            originalPrice: product.price,
            flashDiscountPercent,
            maxQuantity: maxQuantity || 50,
            soldCount: 0,
        });

        await flashSale.save();

        // 6. Update Product document directly so it shows up in general shop queries
        product.discountedPrice = flashPrice;
        product.discountPercent = flashDiscountPercent;
        await product.save();

        await invalidateCache(CACHE_KEYS.FLASH_SALES);

        return res.status(200).json({
            success: true,
            message: 'Product added to flash sale successfully',
            data: { flashSale },
        });
    });
}

module.exports = new FlashSaleController();
