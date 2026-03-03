const express = require('express');
const productController = require('../controller/productController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');
const { uploadProductImages } = require('../middleware/uploadMiddleware');
const parseFormData = require('../middleware/parseFormData');
const { validateCreateProduct, validateUpdateProduct } = require('../validators/productValidator');

const router = express.Router();

// ─── Public Routes ───────────────────────────
router.get('/', productController.getAllProducts);
router.get('/brands', productController.getBrands);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/category/:categoryId', productController.getProductsByCategory);

// ─── Seller Routes ───────────────────────────
// NOTE: /seller/my-products MUST come BEFORE /:id to prevent Express from
// matching "seller" as an :id parameter.
router.get(
    '/seller/my-products',
    authenticate,
    authorize('SELLER'),
    productController.getMyProducts
);

router.post(
    '/',
    authenticate,
    authorize('SELLER'),
    uploadProductImages,
    parseFormData(['sizes', 'specifications', 'tags']),
    validateCreateProduct,
    validate,
    productController.createProduct
);

// Dynamic :id route MUST be last among GET routes
router.get('/:id', productController.getProductById);

router.put(
    '/:id',
    authenticate,
    authorize('SELLER'),
    uploadProductImages,
    validateUpdateProduct,
    validate,
    productController.updateProduct
);

router.delete(
    '/:id',
    authenticate,
    authorize('SELLER', 'ADMIN'),
    productController.deleteProduct
);

module.exports = router;
