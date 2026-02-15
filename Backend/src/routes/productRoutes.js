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
router.get('/:id', productController.getProductById);

// ─── Seller Routes ───────────────────────────
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

router.get(
    '/seller/my-products',
    authenticate,
    authorize('SELLER'),
    productController.getMyProducts
);

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
    authorize('SELLER'),
    productController.deleteProduct
);

module.exports = router;
