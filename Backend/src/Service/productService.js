const mongoose = require('mongoose');
const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
const Category = require('../Modal/Category');
const { generateUniqueSlug } = require('../utils/slugUtils');
const cloudinary = require('../Config/cloudinary');
const { CACHE_KEYS, TTL, getCache, setCache, invalidateProductCaches } = require('./cacheService');
const pineconeService = require('./pineconeService');

class ProductService {
    /**
     * Create a new product
     */
    async createProduct(userId, productData, files = []) {
        // Find seller by user ID
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('You must be a registered seller to add products'), { status: 403 });
        }
        if (seller.accountStatus !== 'active') {
            throw Object.assign(new Error('Your seller account must be active to add products'), { status: 403 });
        }

        // Validate category
        const category = await Category.findById(productData.category);
        if (!category) {
            throw Object.assign(new Error('Invalid category'), { status: 400 });
        }

        // Process uploaded images
        const images = [];
        if (files && files.length > 0) {
            for (const file of files) {
                images.push({
                    public_id: file.filename,
                    url: file.path,
                });
            }
        }

        // Create product
        const product = await Product.create({
            ...productData,
            slug: await generateUniqueSlug(Product, 'slug', productData.title),
            seller: seller._id,
            images: images.length > 0 ? images : productData.images || [],
        });

        // Increment seller's product count
        seller.totalProducts += 1;
        await seller.save();

        // Invalidate caches
        await invalidateProductCaches();

        // ── Pinecone: Upsert text + image embeddings (fire-and-forget) ──
        pineconeService.upsertProduct(product, { categoryName: category.name })
            .catch(err => console.error('Pinecone sync (create) failed:', err.message));

        return product;
    }

    /**
     * Get all products with filters, search, and pagination.
     * Uses pure MongoDB text search and regex matching.
     */
    async getAllProducts(query = {}) {
        const {
            search, category, seller, minPrice, maxPrice,
            brand, color, size, rating, sort, page = 1, limit = 12, freeDelivery
        } = query;

        // RESOLVE: Category Slug -> ID
        let resolvedCategoryId = category;
        if (category && !mongoose.Types.ObjectId.isValid(category)) {
            let foundCat = await Category.findOne({ slug: category });
            if (!foundCat) {
                foundCat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
            }
            if (foundCat) resolvedCategoryId = foundCat._id.toString();
            else resolvedCategoryId = new mongoose.Types.ObjectId().toString();
        }

        // 1. RESOLVE RECURSIVE CATEGORIES (Parent -> Children -> Grandchildren)
        let categoryIds = [];
        if (resolvedCategoryId && mongoose.Types.ObjectId.isValid(resolvedCategoryId)) {
            categoryIds = [resolvedCategoryId];
            const subCategories = await Category.find({ parentCategory: resolvedCategoryId });
            if (subCategories.length > 0) {
                const subIds = subCategories.map(c => c._id.toString());
                categoryIds.push(...subIds);
                const subSubCategories = await Category.find({ parentCategory: { $in: subIds } });
                if (subSubCategories.length > 0) {
                    categoryIds.push(...subSubCategories.map(c => c._id.toString()));
                }
            }
        }

        // 0. CHECK CACHE FOR SPECIFIC HOME PAGE QUERIES
        const isHomePageQuery = (limit == 8 || limit == 12) && !search && !category && !seller && !minPrice && !maxPrice && !brand && !color && !size && !rating;
        let cacheKey = null;

        if (isHomePageQuery) {
            if (sort === 'newest') cacheKey = CACHE_KEYS.NEW_ARRIVALS;
            else if (sort === 'popular') cacheKey = CACHE_KEYS.TRENDING_PRODUCTS;
            else if (sort === 'price_asc') cacheKey = CACHE_KEYS.HOME_PAGE;
        }

        if (cacheKey) {
            const cachedData = await getCache(cacheKey);
            if (cachedData) return cachedData;
        }

        // ────────────────────────────────────────────────
        // MONGODB SEARCH
        // ────────────────────────────────────────────────
        const filter = { isActive: true };

        // Search
        if (search) {
            const isMen = /\b(men|male|boy|gent|him)\b/i.test(search);
            const isWomen = /\b(women|female|girl|lady|her)\b/i.test(search);

            if (isMen && !isWomen) {
                filter.$and = filter.$and || [];
                filter.$and.push({
                    $or: [
                        { title: { $regex: /\b(men|male|boy)\b/i } },
                        { description: { $regex: /\b(men|male|boy)\b/i } },
                        { tags: { $in: [/men/i, /male/i, /boy/i] } }
                    ]
                });
            } else if (isWomen && !isMen) {
                filter.$and = filter.$and || [];
                filter.$and.push({
                    $or: [
                        { title: { $regex: /\b(women|female|girl|lady)\b/i } },
                        { description: { $regex: /\b(women|female|girl|lady)\b/i } },
                        { tags: { $in: [/women/i, /female/i, /girl/i, /lady/i] } }
                    ]
                });
            }

            if (!category) {
                const matchedCategory = await Category.findOne({
                    $or: [
                        { name: { $regex: new RegExp(`^${search}$`, 'i') } },
                        { slug: search.toLowerCase() }
                    ]
                });
                if (matchedCategory) {
                    resolvedCategoryId = matchedCategory._id.toString();
                    categoryIds = [resolvedCategoryId];
                    // Also get children
                    const subCategories = await Category.find({ parentCategory: resolvedCategoryId });
                    if (subCategories.length > 0) {
                        const subIds = subCategories.map(c => c._id.toString());
                        categoryIds.push(...subIds);
                        const subSubCategories = await Category.find({ parentCategory: { $in: subIds } });
                        if (subSubCategories.length > 0) {
                            categoryIds.push(...subSubCategories.map(c => c._id.toString()));
                        }
                    }
                } else {
                    // Full text search with $or across key fields
                    filter.$or = [
                        { title: { $regex: search, $options: 'i' } },
                        { brand: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                        { tags: { $regex: search, $options: 'i' } },
                    ];
                }
            } else {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } },
                ];
            }
        }

        // Recursive Category Filter (include children)
        if (categoryIds.length > 0) {
            filter.category = { $in: categoryIds };
        }

        if (seller) {
            if (mongoose.Types.ObjectId.isValid(seller)) {
                filter.seller = seller;
            } else {
                const sellerDoc = await Seller.findOne({ storeSlug: seller });
                if (sellerDoc) {
                    filter.seller = sellerDoc._id;
                } else {
                    filter.seller = new mongoose.Types.ObjectId();
                }
            }
        }
        if (freeDelivery === 'true' || freeDelivery === true) {
            filter.freeDelivery = true;
        }

        // ────────────────────────────────────────────────
        // ATTRIBUTE FILTERS (Properly AND-ed together)
        // ────────────────────────────────────────────────
        const andFilters = [];

        if (brand) {
            andFilters.push({
                $or: [
                    { brand: { $regex: brand, $options: 'i' } },
                    { 'specifications.value': { $regex: brand, $options: 'i' } }
                ]
            });
        }

        if (color) {
            andFilters.push({
                $or: [
                    { color: { $regex: color, $options: 'i' } },
                    { 'variantOptions.values': { $regex: color, $options: 'i' } },
                    { 'variants.options.Color': { $regex: color, $options: 'i' } }
                ]
            });
        }

        if (size) {
            andFilters.push({
                $or: [
                    { 'sizes.name': { $regex: size, $options: 'i' } },
                    { 'variantOptions.values': { $regex: size, $options: 'i' } },
                    { 'variants.options.Size': { $regex: size, $options: 'i' } }
                ]
            });
        }

        if (query.condition) {
            andFilters.push({
                $or: [
                    { description: { $regex: query.condition, $options: 'i' } },
                    { 'specifications.value': { $regex: query.condition, $options: 'i' } }
                ]
            });
        }

        if (andFilters.length > 0) {
            filter.$and = [...(filter.$and || []), ...andFilters];
        }

        if (rating) filter.rating = { $gte: parseFloat(rating) };

        // Price range
        if (minPrice || maxPrice) {
            filter.discountedPrice = {};
            if (minPrice) filter.discountedPrice.$gte = parseFloat(minPrice);
            if (maxPrice) filter.discountedPrice.$lte = parseFloat(maxPrice);
        }

        // Flash Sale Filter
        if (query.flashSale === 'true') {
            const FlashSale = require('../Modal/FlashSale');
            const now = new Date();
            const activeSales = await FlashSale.find({
                isActive: true,
                $or: [
                    { startTime: { $lte: now }, endTime: { $gte: now } },
                    { isPermanent: true }
                ]
            });
            const flashProductIds = activeSales.reduce((acc, sale) => {
                return [...acc, ...sale.products.map(p => p.product)];
            }, []);
            filter._id = { $in: flashProductIds };
        }

        // Sort options
        let sortOption = { createdAt: -1 }; // default: newest
        if (sort === 'price_asc') sortOption = { discountedPrice: 1 };
        else if (sort === 'price_desc') sortOption = { discountedPrice: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };
        else if (sort === 'popular') sortOption = { totalSold: -1 };
        else if (sort === 'newest') sortOption = { createdAt: -1 };
        const skip = (page - 1) * limit;

        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .populate('seller', 'storeName storeSlug storeLogo rating')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        const finalResult = {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
            },
        };

        if (cacheKey) {
            const ttl = sort === 'newest' ? TTL.NEW_ARRIVALS : TTL.TRENDING_PRODUCTS;
            await setCache(cacheKey, finalResult, ttl);
        }

        return finalResult;
    }

    /**
     * Get single product by ID
     */
    async getProductById(productId) {
        let product;

        // Strict ObjectId check: must be exactly 24 hex characters.
        // mongoose.Types.ObjectId.isValid() is too lenient (accepts any 12-char string),
        // which causes slugs like "blue-t-shirt" to be incorrectly treated as ObjectIds.
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);

        if (isObjectId) {
            product = await Product.findById(productId)
                .populate('category', 'name slug')
                .populate('seller', 'storeName storeSlug storeLogo rating businessPhone');
        }

        // If not found by ID (or not an ObjectId), try by slug
        if (!product) {
            product = await Product.findOne({ slug: productId.toLowerCase() })
                .populate('category', 'name slug')
                .populate('seller', 'storeName storeSlug storeLogo rating businessPhone');
        }

        if (!product) {
            throw Object.assign(new Error('Product not found'), { status: 404 });
        }

        // Apply flash sale prices dynamically if active
        const FlashSale = require('../Modal/FlashSale');
        const now = new Date();
        const activeFlashSale = await FlashSale.findOne({
            isActive: true,
            'products.product': product._id,
            $or: [
                { startTime: { $lte: now }, endTime: { $gte: now } },
                { isPermanent: true }
            ]
        });

        if (activeFlashSale) {
            const flashInfo = activeFlashSale.products.find(p => p.product.toString() === product._id.toString());
            if (flashInfo) {
                product.discountedPrice = flashInfo.flashPrice;
                product.discountPercent = flashInfo.flashDiscountPercent;
                product.isFlashSale = true;
            }
        }

        if (product) {
            // Increment views in a background-like way
            product.views = (product.views || 0) + 1;
            product.save().catch(err => console.error('View increment failed:', err));

            // Also increment seller store views
            if (product.seller) {
                const Seller = require('../Modal/seller');
                Seller.findByIdAndUpdate(product.seller._id || product.seller, { $inc: { storeViews: 1 } })
                    .catch(err => console.error('Seller view increment failed:', err));
            }
        }

        return product;
    }

    /**
     * Get single product by slug
     */
    async getProductBySlug(slug) {
        const product = await Product.findOne({ slug })
            .populate('category', 'name slug')
            .populate('seller', 'storeName storeSlug storeLogo rating');

        if (!product) {
            throw Object.assign(new Error('Product not found'), { status: 404 });
        }
        return product;
    }

    /**
     * Get products by seller (for seller dashboard)
     */
    async getProductsBySeller(userId, query = {}) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        const {
            page = 1, limit = 10, search, category,
            minPrice, maxPrice, color, sort, freeDelivery
        } = query;

        const filter = { seller: seller._id };

        // Search
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        // Filters
        if (category) filter.category = category;
        if (color) filter.color = { $regex: color, $options: 'i' };
        if (freeDelivery === 'true' || freeDelivery === true) filter.freeDelivery = true;

        // Price range
        if (minPrice || maxPrice) {
            filter.discountedPrice = {};
            if (minPrice) filter.discountedPrice.$gte = parseFloat(minPrice);
            if (maxPrice) filter.discountedPrice.$lte = parseFloat(maxPrice);
        }

        // Sort options
        let sortOption = { createdAt: -1 }; // default: newest
        if (sort === 'price_asc') sortOption = { discountedPrice: 1 };
        else if (sort === 'price_desc') sortOption = { discountedPrice: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };
        else if (sort === 'popular') sortOption = { totalSold: -1 };
        else if (sort === 'newest') sortOption = { createdAt: -1 };

        const skip = (page - 1) * limit;
        const products = await Product.find(filter)
            .populate('category', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        return {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
            },
        };
    }

    /**
     * Update product (seller only - must own the product)
     */
    async updateProduct(productId, userId, updateData, files = []) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        const product = await Product.findOne({ _id: productId, seller: seller._id });
        if (!product) {
            throw Object.assign(new Error('Product not found or unauthorized'), { status: 404 });
        }

        // Handle new image uploads
        if (files && files.length > 0) {
            const newImages = files.map((file) => ({
                public_id: file.filename,
                url: file.path,
            }));
            updateData.images = [...(product.images || []), ...newImages];
        }

        // Update slug if title changed
        if (updateData.title && updateData.title !== product.title) {
            updateData.slug = await generateUniqueSlug(Product, 'slug', updateData.title);
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
            new: true,
            runValidators: true,
        });

        // Invalidate caches
        await invalidateProductCaches();

        // ── Pinecone: Re-upsert embeddings if relevant fields changed ──
        const relevantFieldsChanged = updateData.title || updateData.description ||
            updateData.category || updateData.images || (files && files.length > 0);
        if (relevantFieldsChanged && updatedProduct) {
            const populatedProduct = await Product.findById(productId)
                .populate('category', 'name').lean();
            const skipImage = !updateData.images && !(files && files.length > 0);
            pineconeService.upsertProduct(populatedProduct, { skipImage })
                .catch(err => console.error('Pinecone sync (update) failed:', err.message));
        }

        return updatedProduct;
    }

    /**
     * Delete product
     */
    async deleteProduct(productId, userId, isAdmin = false) {
        let product;
        let seller;

        if (isAdmin) {
            product = await Product.findById(productId);
            if (!product) {
                throw Object.assign(new Error('Product not found'), { status: 404 });
            }
            seller = await Seller.findById(product.seller);
        } else {
            seller = await Seller.findOne({ user: userId });
            if (!seller) {
                throw Object.assign(new Error('Seller not found'), { status: 404 });
            }

            product = await Product.findOne({ _id: productId, seller: seller._id });
            if (!product) {
                throw Object.assign(new Error('Product not found or unauthorized'), { status: 404 });
            }
        }

        // Delete images from cloudinary
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                if (image.public_id) {
                    try {
                        await cloudinary.uploader.destroy(image.public_id);
                    } catch (err) {
                        console.error('Error deleting image from Cloudinary:', err.message);
                    }
                }
            }
        }

        await Product.findByIdAndDelete(productId);

        // Decrement seller's product count
        if (seller) {
            seller.totalProducts = Math.max(0, seller.totalProducts - 1);
            await seller.save();
        }

        // Invalidate caches
        await invalidateProductCaches();

        // ── Pinecone: Remove vectors from both indexes ──
        pineconeService.deleteProduct(productId)
            .catch(err => console.error('Pinecone sync (delete) failed:', err.message));

        return { message: 'Product deleted successfully' };
    }

    /**
     * Get products by category (Supports ID or Slug)
     */
    async getProductsByCategory(categoryIdentifier, query = {}) {
        const { page = 1, limit = 12, sort } = query;

        let categoryId = categoryIdentifier;
        if (!mongoose.Types.ObjectId.isValid(categoryIdentifier)) {
            const category = await Category.findOne({ slug: categoryIdentifier });
            if (!category) {
                throw Object.assign(new Error('Category not found'), { status: 404 });
            }
            categoryId = category._id;
        }

        // Recursive Category Filter (include children)
        const categoryIds = [categoryId];
        const subCategories = await Category.find({ parentCategory: categoryId });
        if (subCategories.length > 0) {
            categoryIds.push(...subCategories.map(c => c._id));

            const subSubCategories = await Category.find({ parentCategory: { $in: subCategories.map(c => c._id) } });
            if (subSubCategories.length > 0) {
                categoryIds.push(...subSubCategories.map(c => c._id));
            }
        }

        const filter = { category: { $in: categoryIds }, isActive: true };

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { discountedPrice: 1 };
        else if (sort === 'price_desc') sortOption = { discountedPrice: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };

        const skip = (page - 1) * limit;
        const products = await Product.find(filter)
            .populate('seller', 'storeName storeSlug')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        return {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
            },
        };
    }

    /**
     * Get distinct brands with product count
     */
    async getBrands() {
        const brands = await Product.aggregate([
            { $match: { isActive: true, brand: { $nin: [null, ''] } } },
            {
                $group: {
                    _id: '$brand',
                    count: { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                    image: { $first: { $arrayElemAt: ['$images.url', 0] } },
                },
            },
            { $sort: { count: -1 } },
        ]);
        return brands.map(b => ({
            name: b._id,
            productCount: b.count,
            avgRating: Math.round((b.avgRating || 0) * 10) / 10,
            image: b.image,
        }));
    }
}

module.exports = new ProductService();
