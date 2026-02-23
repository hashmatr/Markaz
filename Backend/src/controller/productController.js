const productService = require('../Service/productService');
const asyncHandler = require('../middleware/asyncHandler');

class ProductController {
    /**
     * POST /api/products - Create product (seller only)
     */
    createProduct = asyncHandler(async (req, res) => {
        const product = await productService.createProduct(req.user._id, req.body, req.files);

        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product },
        });
    });

    /**
     * GET /api/products - Get all products (public)
     */
    getAllProducts = asyncHandler(async (req, res) => {
        const result = await productService.getAllProducts(req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /api/products/:id - Get single product
     */
    getProductById = asyncHandler(async (req, res) => {
        const product = await productService.getProductById(req.params.id);

        return res.status(200).json({
            success: true,
            data: { product },
        });
    });

    /**
     * GET /api/products/slug/:slug - Get product by slug
     */
    getProductBySlug = asyncHandler(async (req, res) => {
        const product = await productService.getProductBySlug(req.params.slug);

        return res.status(200).json({
            success: true,
            data: { product },
        });
    });

    /**
     * GET /api/products/seller/my-products - Get seller's products
     */
    getMyProducts = asyncHandler(async (req, res) => {
        const result = await productService.getProductsBySeller(req.user._id, req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /api/products/category/:categoryId - Get products by category
     */
    getProductsByCategory = asyncHandler(async (req, res) => {
        const result = await productService.getProductsByCategory(req.params.categoryId, req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * PUT /api/products/:id - Update product (seller only)
     */
    updateProduct = asyncHandler(async (req, res) => {
        const product = await productService.updateProduct(req.params.id, req.user._id, req.body, req.files);

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: { product },
        });
    });

    /**
     * DELETE /api/products/:id - Delete product (seller only)
     */
    deleteProduct = asyncHandler(async (req, res) => {
        const isAdmin = req.user.role === 'ADMIN';
        const result = await productService.deleteProduct(req.params.id, req.user._id, isAdmin);

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    });
    /**
     * GET /api/products/brands - Get all brands
     */
    getBrands = asyncHandler(async (req, res) => {
        const brands = await productService.getBrands();

        return res.status(200).json({
            success: true,
            data: { brands },
        });
    });
}

module.exports = new ProductController();
