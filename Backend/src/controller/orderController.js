const orderService = require('../Service/orderService');
const asyncHandler = require('../middleware/asyncHandler');

class OrderController {
    /**
     * POST /api/orders - Create order from cart
     */
    createOrder = asyncHandler(async (req, res) => {
        const order = await orderService.createOrder(req.user._id, req.body);

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: { order },
        });
    });

    /**
     * GET /api/orders/:id - Get order by ID
     */
    getOrderById = asyncHandler(async (req, res) => {
        const order = await orderService.getOrderById(req.params.id, req.user._id);

        return res.status(200).json({
            success: true,
            data: { order },
        });
    });

    /**
     * GET /api/orders - Get user's orders
     */
    getMyOrders = asyncHandler(async (req, res) => {
        const result = await orderService.getUserOrders(req.user._id, req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /api/orders/seller - Get seller's orders
     */
    getSellerOrders = asyncHandler(async (req, res) => {
        const result = await orderService.getSellerOrders(req.user._id, req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * PUT /api/orders/:orderId/items/:itemId/status - Update order item status (seller)
     */
    updateOrderItemStatus = asyncHandler(async (req, res) => {
        const order = await orderService.updateOrderItemStatus(
            req.params.orderId,
            req.params.itemId,
            req.user._id,
            req.body.status
        );

        return res.status(200).json({
            success: true,
            message: 'Order item status updated',
            data: { order },
        });
    });

    /**
     * PUT /api/orders/:id/cancel - Cancel order (user)
     */
    cancelOrder = asyncHandler(async (req, res) => {
        const order = await orderService.cancelOrder(req.params.id, req.user._id, req.body.cancelReason);

        return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: { order },
        });
    });

    /**
     * GET /api/orders/admin/all - Get all orders (admin)
     */
    getAllOrders = asyncHandler(async (req, res) => {
        const result = await orderService.getAllOrders(req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * PUT /api/orders/admin/:id/status - Update order status (admin)
     */
    updateOrderStatus = asyncHandler(async (req, res) => {
        const order = await orderService.updateOrderStatus(req.params.id, req.body.status);

        return res.status(200).json({
            success: true,
            message: 'Order status updated',
            data: { order },
        });
    });
}

module.exports = new OrderController();
