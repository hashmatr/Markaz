const express = require('express');
const orderController = require('../controller/orderController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../validators/orderValidator');

const router = express.Router();

// ─── Customer Routes ─────────────────────────
router.post('/', authenticate, validateCreateOrder, validate, orderController.createOrder);
router.get('/', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.put('/:id/cancel', authenticate, orderController.cancelOrder);

// ─── Seller Routes ───────────────────────────
router.get('/seller/orders', authenticate, authorize('SELLER'), orderController.getSellerOrders);
router.put(
    '/:orderId/items/:itemId/status',
    authenticate,
    authorize('SELLER'),
    validateUpdateOrderStatus,
    validate,
    orderController.updateOrderItemStatus
);

// ─── Admin Routes ────────────────────────────
router.get('/admin/all', authenticate, authorize('ADMIN'), orderController.getAllOrders);
router.put(
    '/admin/:id/status',
    authenticate,
    authorize('ADMIN'),
    validateUpdateOrderStatus,
    validate,
    orderController.updateOrderStatus
);

module.exports = router;
