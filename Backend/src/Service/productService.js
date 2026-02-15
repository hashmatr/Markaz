const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
const Category = require('../Modal/Category');
const slugify = require('slugify');
const cloudinary = require('../Config/cloudinary');

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

        return product;
    }

    /**
     * Get all products with filters, search, and pagination
     */
    async getAllProducts(query = {}) {
        const {
            search, category, seller, minPrice, maxPrice,
            brand, color, size, rating, sort, page = 1, limit = 12,
        } = query;

        const filter = { isActive: true };

        // Search
        if (search) {
            filter.$text = { $search: search };
        }

        // Filters
        if (category) filter.category = category;
        if (seller) filter.seller = seller;
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
     * Get single product by ID
     */
    async getProductById(productId) {
        const product = await Product.findById(productId)
            .populate('category', 'name slug')
            .populate('seller', 'storeName storeSlug storeLogo rating businessPhone');

        if (!product) {
            throw Object.assign(new Error('Product not found'), { status: 404 });
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

        return updatedProduct;
    }

    /**
     * Delete product
     */
    async deleteProduct(productId, userId) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        const product = await Product.findOne({ _id: productId, seller: seller._id });
        if (!product) {
            throw Object.assign(new Error('Product not found or unauthorized'), { status: 404 });
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
        seller.totalProducts = Math.max(0, seller.totalProducts - 1);
        await seller.save();

        return { message: 'Product deleted successfully' };
    }

    /**
     * Get products by category
     */
    async getProductsByCategory(categoryId, query = {}) {
        const { page = 1, limit = 12, sort } = query;
        const filter = { category: categoryId, isActive: true };

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
