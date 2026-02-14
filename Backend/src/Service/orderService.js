const Order = require('../Modal/Order');
const Cart = require('../Modal/Cart');
const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
const calculateCommission = require('../utils/calculateCommission');
const ORDER_STATUS = require('../domain/orderStatus');

class OrderService {
    /**
     * Create order from cart
     */
    async createOrder(userId, orderData) {
        const { shippingAddressId, paymentMethod = 'COD', orderNotes } = orderData;

        // Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            throw Object.assign(new Error('Cart is empty'), { status: 400 });
        }

        // Validate stock for all items
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id || item.product);
            if (!product || !product.isActive) {
                throw Object.assign(new Error(`Product "${product?.title || 'Unknown'}" is no longer available`), { status: 400 });
            }
            if (product.quantity < item.quantity) {
                throw Object.assign(new Error(`Insufficient stock for "${product.title}". Available: ${product.quantity}`), { status: 400 });
            }
        }

        // Build order items with commission calculation
        let totalCommission = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.product._id || item.product);
            const seller = await Seller.findById(item.seller);

            const itemTotal = (item.discountedPrice || item.price) * item.quantity;
            const { commission, sellerEarnings } = calculateCommission(
                itemTotal,
                seller?.commissionRate
            );

            totalCommission += commission;

            orderItems.push({
                product: product._id,
                seller: item.seller,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                price: item.price,
                discountedPrice: item.discountedPrice || item.price,
                commission,
                sellerEarnings,
            });

            // Decrease product stock
            product.quantity -= item.quantity;
            product.totalSold += item.quantity;
            await product.save();

            // Update seller order count
            if (seller) {
                seller.totalOrders += 1;
                await seller.save();
            }
        }

        // Create order
        const order = await Order.create({
            user: userId,
            orderItems,
            shippingAddress: shippingAddressId,
            paymentMethod,
            totalPrice: cart.totalPrice,
            totalDiscountedPrice: cart.totalDiscountedPrice,
            discount: cart.discount,
            totalCommission,
            orderNotes,
            paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
        });

        // Clear cart
        cart.items = [];
        await cart.save();

        return order;
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId, userId) {
        const order = await Order.findById(orderId)
            .populate('user', 'fullName email')
            .populate('orderItems.product', 'title images slug price')
            .populate('orderItems.seller', 'storeName')
            .populate('shippingAddress');

        if (!order) {
            throw Object.assign(new Error('Order not found'), { status: 404 });
        }

        // Check authorization (user can see their own orders)
        if (order.user._id.toString() !== userId.toString()) {
            throw Object.assign(new Error('Not authorized to view this order'), { status: 403 });
        }

        return order;
    }

    /**
     * Get user's orders
     */
    async getUserOrders(userId, query = {}) {
        const { page = 1, limit = 10, status } = query;
        const filter = { user: userId };

        if (status) filter.orderStatus = status;

        const skip = (page - 1) * limit;
        const orders = await Order.find(filter)
            .populate('orderItems.product', 'title images slug price')
            .populate('orderItems.seller', 'storeName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        return {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total,
            },
        };
    }

    /**
     * Get seller's orders (items belonging to this seller)
     */
    async getSellerOrders(userId, query = {}) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        const { page = 1, limit = 10, status } = query;
        const filter = { 'orderItems.seller': seller._id };

        if (status) filter['orderItems.itemStatus'] = status;

        const skip = (page - 1) * limit;
        const orders = await Order.find(filter)
            .populate('user', 'fullName email phone')
            .populate('orderItems.product', 'title images price')
            .populate('shippingAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        return {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total,
            },
        };
    }

    /**
     * Update order item status (by seller)
     */
    async updateOrderItemStatus(orderId, itemId, userId, newStatus) {
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            throw Object.assign(new Error('Seller not found'), { status: 404 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw Object.assign(new Error('Order not found'), { status: 404 });
        }

        const orderItem = order.orderItems.id(itemId);
        if (!orderItem) {
            throw Object.assign(new Error('Order item not found'), { status: 404 });
        }

        if (orderItem.seller.toString() !== seller._id.toString()) {
            throw Object.assign(new Error('Not authorized to update this order item'), { status: 403 });
        }

        orderItem.itemStatus = newStatus;

        // If all items have same status, update overall order status
        const allStatuses = order.orderItems.map((item) => item.itemStatus);
        const allSame = allStatuses.every((s) => s === newStatus);
        if (allSame) {
            order.orderStatus = newStatus;
        }

        if (newStatus === ORDER_STATUS.DELIVERED) {
            // Add earnings to seller
            seller.totalEarnings += orderItem.sellerEarnings;
            seller.pendingPayout += orderItem.sellerEarnings;
            await seller.save();
        }

        if (newStatus === ORDER_STATUS.DELIVERED) {
            order.deliveredAt = new Date();
        }

        await order.save();
        return order;
    }

    /**
     * Cancel order (by user)
     */
    async cancelOrder(orderId, userId, cancelReason) {
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            throw Object.assign(new Error('Order not found'), { status: 404 });
        }

        if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(order.orderStatus)) {
            throw Object.assign(new Error('Cannot cancel order that has been shipped or delivered'), { status: 400 });
        }

        // Restore product stock
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: item.quantity, totalSold: -item.quantity },
            });
            item.itemStatus = ORDER_STATUS.CANCELLED;
        }

        order.orderStatus = ORDER_STATUS.CANCELLED;
        order.cancelledAt = new Date();
        order.cancelReason = cancelReason || 'Cancelled by user';
        await order.save();

        return order;
    }

    /**
     * Get all orders (admin)
     */
    async getAllOrders(query = {}) {
        const { page = 1, limit = 20, status, search } = query;
        const filter = {};

        if (status) filter.orderStatus = status;

        const skip = (page - 1) * limit;
        const orders = await Order.find(filter)
            .populate('user', 'fullName email')
            .populate('orderItems.product', 'title price')
            .populate('orderItems.seller', 'storeName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        return {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total,
            },
        };
    }

    /**
     * Update order status (admin)
     */
    async updateOrderStatus(orderId, newStatus) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw Object.assign(new Error('Order not found'), { status: 404 });
        }

        order.orderStatus = newStatus;
        order.orderItems.forEach((item) => {
            item.itemStatus = newStatus;
        });

        if (newStatus === ORDER_STATUS.DELIVERED) {
            order.deliveredAt = new Date();
        }

        await order.save();
        return order;
    }
}

module.exports = new OrderService();
