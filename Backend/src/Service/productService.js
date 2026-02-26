const mongoose = require('mongoose');
const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
const Category = require('../Modal/Category');
const slugify = require('slugify');
const cloudinary = require('../Config/cloudinary');
const embeddingService = require('./embeddingService');

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
            slug: slugify(productData.title, { lower: true, strict: true }) + '-' + Date.now(),
            seller: seller._id,
            images: images.length > 0 ? images : productData.images || [],
        });

        // Increment seller's product count
        seller.totalProducts += 1;
        await seller.save();

        // ── Auto-embed in Pinecone (non-blocking) ──
        this._embedProductAsync(product._id);

        return product;
    }

    /**
     * Get all products with filters, search, and pagination.
     * When a search query is present and Pinecone is available,
     * uses vector similarity search (RAG) for smarter results.
     */
    async getAllProducts(query = {}) {
        const {
            search, category, seller, minPrice, maxPrice,
            brand, color, size, rating, sort, page = 1, limit = 12,
        } = query;

        // 1. TRY GROQ HYBRID SEARCH (Most Intelligent + Fast)
        const groqSearchService = require('./groqSearchService');
        if (search && groqSearchService.groq) {
            try {
                const results = await groqSearchService.hybridSearch(search, { category, brand });

                // If Groq has results, return them. 
                // If Groq EXPLICITLY says "no matches", return empty now to prevent "junk fallback"
                if (results) {
                    return {
                        products: results.products,
                        aiSummary: results.aiSummary,
                        pagination: {
                            currentPage: 1,
                            totalPages: results.products.length > 0 ? 1 : 0,
                            totalProducts: results.products.length
                        }
                    };
                }
            } catch (err) {
                console.warn('ProductService: Groq search failed, trying fallback search:', err.message);
            }
        }

        // 2. TRY VECTOR SEARCH (Pinecone)
        if (search && embeddingService.isAvailable()) {
            try {
                return await this._vectorSearch(query);
            } catch (err) {
                console.error('ProductService: Vector search failed, falling back to text search:', err.message);
            }
        }

        // ────────────────────────────────────────────────
        // TRADITIONAL SEARCH (fallback / non-search queries)
        // ────────────────────────────────────────────────
        const filter = { isActive: true };

        // Search Intelligence: Check if search term is a category
        if (search && !category) {
            const matchedCategory = await Category.findOne({
                $or: [
                    { name: { $regex: new RegExp(`^${search}$`, 'i') } },
                    { slug: search.toLowerCase() }
                ]
            });
            if (matchedCategory) {
                // If search matches a category, use it as a category filter instead
                query.category = matchedCategory._id.toString();
                // We keep search null so we don't do $text search which might be too restrictive
            } else {
                filter.$text = { $search: search };
            }
        } else if (search) {
            filter.$text = { $search: search };
        }

        // Recursive Category Filter (include children)
        if (query.category) {
            const categoryIds = [query.category];
            const subCategories = await Category.find({ parentCategory: query.category });
            if (subCategories.length > 0) {
                categoryIds.push(...subCategories.map(c => c._id));

                // One more level for deeper nests if needed
                const subSubCategories = await Category.find({ parentCategory: { $in: subCategories.map(c => c._id) } });
                if (subSubCategories.length > 0) {
                    categoryIds.push(...subSubCategories.map(c => c._id));
                }
            }
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
        if (brand) filter.brand = { $regex: brand, $options: 'i' };
        if (color) filter.color = { $regex: color, $options: 'i' };
        if (size) filter['sizes.name'] = { $regex: size, $options: 'i' };
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
     * ── RAG Vector Search ──
     * 1. Takes user's natural language query
     * 2. Generates an embedding for the query using Gemini
     * 3. Searches Pinecone for the most similar product vectors
     * 4. Fetches the full product documents from MongoDB by ID
     * 5. Applies any additional MongoDB filters (price, color, etc.)
     * 6. Returns ranked results
     */
    async _vectorSearch(query) {
        const {
            search, category, seller, minPrice, maxPrice,
            brand, color, size, rating, sort, page = 1, limit = 12,
        } = query;

        console.log(`ProductService [RAG]: Vector search for "${search}"`);

        // Build Pinecone metadata filter
        const pineconeFilter = { isActive: true };
        if (color) pineconeFilter.color = { $eq: color };
        if (brand) pineconeFilter.brand = { $eq: brand };

        // Query Pinecone — get top 50 similar results
        const vectorResults = await embeddingService.searchSimilar(
            search,
            50,
            Object.keys(pineconeFilter).length > 1 ? pineconeFilter : {}
        );

        if (!vectorResults || vectorResults.length === 0) {
            console.log('ProductService [RAG]: No vector results, falling back to text search.');
            throw new Error('No vector results');
        }

        console.log(`ProductService [RAG]: Pinecone returned ${vectorResults.length} matches.`);

        // Extract product IDs in ranking order
        const productIds = vectorResults.map((r) => r.productId);
        const scoreMap = {};
        vectorResults.forEach((r) => {
            scoreMap[r.productId] = r.score;
        });

        // Fetch full products from MongoDB
        const mongoFilter = {
            _id: { $in: productIds },
            isActive: true,
        };

        // Apply additional MongoDB filters
        if (category) mongoFilter.category = category;
        if (seller) mongoFilter.seller = seller;
        if (rating) mongoFilter.rating = { $gte: parseFloat(rating) };
        if (size) mongoFilter['sizes.name'] = { $regex: size, $options: 'i' };
        if (minPrice || maxPrice) {
            mongoFilter.discountedPrice = {};
            if (minPrice) mongoFilter.discountedPrice.$gte = parseFloat(minPrice);
            if (maxPrice) mongoFilter.discountedPrice.$lte = parseFloat(maxPrice);
        }

        let products = await Product.find(mongoFilter)
            .populate('category', 'name slug')
            .populate('seller', 'storeName storeSlug storeLogo rating')
            .lean();

        // Re-sort by Pinecone similarity score (preserving vector ranking)
        products = products.map((p) => ({
            ...p,
            _vectorScore: scoreMap[p._id.toString()] || 0,
        }));

        // Apply sort override if user selected one
        if (sort === 'price_asc') {
            products.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
        } else if (sort === 'price_desc') {
            products.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
        } else if (sort === 'rating') {
            products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort === 'newest') {
            products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            // Default: sort by vector similarity (most relevant first)
            products.sort((a, b) => (b._vectorScore || 0) - (a._vectorScore || 0));
        }

        // Paginate
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIdx = (page - 1) * limit;
        const paginatedProducts = products.slice(startIdx, startIdx + parseInt(limit));

        // Remove internal score field before returning
        const cleanProducts = paginatedProducts.map(({ _vectorScore, ...rest }) => rest);

        console.log(`ProductService [RAG]: Returning ${cleanProducts.length} products (page ${page}/${totalPages}).`);

        return {
            products: cleanProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
            },
        };
    }

    /**
     * Get single product by ID
     */
    async getProductById(productId) {
        let product;

        // Try by ObjectId first, fallback to slug
        if (mongoose.Types.ObjectId.isValid(productId)) {
            product = await Product.findById(productId)
                .populate('category', 'name slug')
                .populate('seller', 'storeName storeSlug storeLogo rating businessPhone');
        }

        // If not found by ID, try by slug
        if (!product) {
            product = await Product.findOne({ slug: productId })
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
            minPrice, maxPrice, color, sort,
        } = query;

        const filter = { seller: seller._id };

        // Search
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        // Filters
        if (category) filter.category = category;
        if (color) filter.color = { $regex: color, $options: 'i' };

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
        if (updateData.title) {
            updateData.slug = slugify(updateData.title, { lower: true, strict: true }) + '-' + Date.now();
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
            new: true,
            runValidators: true,
        });

        // ── Re-embed in Pinecone (non-blocking) ──
        this._embedProductAsync(productId);

        return updatedProduct;
    }

    /**
     * Delete product
     */
    async deleteProduct(productId, userId, isAdmin = false) {
        let product;
        let seller;

        if (isAdmin) {
            // Admin can delete any product
            product = await Product.findById(productId);
            if (!product) {
                throw Object.assign(new Error('Product not found'), { status: 404 });
            }
            seller = await Seller.findById(product.seller);
        } else {
            // Seller can only delete their own products
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

        // ── Remove from Pinecone ──
        embeddingService.deleteProduct(productId).catch(() => { });

        return { message: 'Product deleted successfully' };
    }

    /**
     * Get products by category
     */
    async getProductsByCategory(categoryId, query = {}) {
        const { page = 1, limit = 12, sort } = query;

        // Recursive Category Filter (include children)
        const categoryIds = [categoryId];
        const subCategories = await Category.find({ parentCategory: categoryId });
        if (subCategories.length > 0) {
            categoryIds.push(...subCategories.map(c => c._id));

            // One more level for deeper nests
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

    /**
     * ── Helper: Embed a product into Pinecone asynchronously ──
     * Called after create/update. Non-blocking (fire-and-forget).
     */
    async _embedProductAsync(productId) {
        try {
            if (!embeddingService.isAvailable()) return;

            const product = await Product.findById(productId)
                .populate('category', 'name slug')
                .populate('seller', 'storeName storeSlug rating')
                .lean();

            if (product) {
                await embeddingService.upsertProduct(product);
                console.log(`ProductService: Product ${productId} embedded in Pinecone.`);
            }
        } catch (err) {
            console.error(`ProductService: Failed to embed product ${productId}:`, err.message);
        }
    }
}

module.exports = new ProductService();
