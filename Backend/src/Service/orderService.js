const Order = require('../Modal/Order');
const Cart = require('../Modal/Cart');
const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
const calculateCommission = require('../utils/calculateCommission');
const ORDER_STATUS = require('../domain/orderStatus');
const Address = require('../Modal/Address');

class OrderService {
    /**
     * Create order from cart
     */
    async createOrder(userId, orderData) {
        let { shippingAddressId, shippingAddress, paymentMethod = 'COD', orderNotes } = orderData;

        // 1. Handle Shipping Address
        if (!shippingAddressId && shippingAddress) {
            try {
                const newAddress = await Address.create(shippingAddress);
                shippingAddressId = newAddress._id;
            } catch (err) {
                console.error('OrderService: Address creation failed:', err.message);
                throw Object.assign(new Error('Invalid shipping address: ' + err.message), { status: 400 });
            }
        }

        if (!shippingAddressId) {
            throw Object.assign(new Error('Shipping address is required'), { status: 400 });
        }

        // 2. Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            throw Object.assign(new Error('Cart is empty'), { status: 400 });
        }

        // 3. Build order items & Validate stock
        let totalCommission = 0;
        let totalPrice = 0;
        let totalDiscountedPrice = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = item.product;
            if (!product || !product.isActive) {
                throw Object.assign(new Error(`Product is no longer available`), { status: 400 });
            }

            const itemQty = Number(item.quantity || 1);
            if (product.quantity < itemQty) {
                throw Object.assign(new Error(`Insufficient stock for "${product.title}"`), { status: 400 });
            }

            // Find seller - fallback to product's seller
            const sellerId = item.seller || product.seller;
            if (!sellerId) {
                throw Object.assign(new Error(`Seller information missing for product "${product.title}"`), { status: 400 });
            }

            const seller = await Seller.findById(sellerId);

            // Force numeric conversion to prevent NaN
            const itemPrice = Number(item.price || product.price || 0);
            const itemDiscPrice = Number(item.discountedPrice || product.discountedPrice || itemPrice);

            const itemTotalDisc = itemDiscPrice * itemQty;
            const { commission, sellerEarnings } = calculateCommission(
                itemTotalDisc,
                seller?.commissionRate
            );

            totalCommission += commission;
            totalPrice += itemPrice * itemQty;
            totalDiscountedPrice += itemTotalDisc;

            orderItems.push({
                product: product._id,
                seller: sellerId,
                quantity: itemQty,
                size: item.size,
                color: item.color,
                price: itemPrice,
                discountedPrice: itemDiscPrice,
                commission,
                sellerEarnings,
                itemStatus: ORDER_STATUS.PENDING
            });

            // Decrease product stock
            product.quantity -= itemQty;
            product.totalSold += itemQty;
            await product.save();

            // Update seller stats
            if (seller) {
                seller.totalOrders = (seller.totalOrders || 0) + 1;
                await seller.save();
            }
        }

        // 4. Create order
        try {
            // Normalize payment method to match enum
            let normalizedPaymentMethod = paymentMethod || 'COD';
            if (paymentMethod && paymentMethod.toLowerCase() === 'cod') normalizedPaymentMethod = 'COD';
            if (paymentMethod && (paymentMethod.toLowerCase() === 'card' || paymentMethod.toLowerCase() === 'online')) normalizedPaymentMethod = 'online';

            // Ensure no NaN values reach Database
            const finalTotalPrice = Number(totalPrice || 0);
            const finalTotalDisc = Number(totalDiscountedPrice || 0);
            const finalCommission = Number(totalCommission || 0);

            console.log('OrderService: Attempting to create order:', {
                user: userId,
                itemsCount: orderItems.length,
                totalPrice: finalTotalPrice,
                paymentMethod: normalizedPaymentMethod
            });

            const order = await Order.create({
                user: userId,
                orderItems,
                shippingAddress: shippingAddressId,
                paymentMethod: normalizedPaymentMethod,
                totalPrice: finalTotalPrice,
                totalDiscountedPrice: finalTotalDisc,
                discount: Math.max(0, finalTotalPrice - finalTotalDisc),
                totalCommission: finalCommission,
                orderNotes,
                paymentStatus: 'pending',
                orderStatus: ORDER_STATUS.PENDING
            });

            // 5. Clear cart
            cart.items = [];
            await cart.save();

            return order;
        } catch (err) {
            console.error('OrderService: Order creation failed. Full error:', err);
            // Throw more specific error if it's a validation error
            if (err.name === 'ValidationError') {
                const messages = Object.values(err.errors).map(e => e.message);
                throw Object.assign(new Error('Validation failed: ' + messages.join(', ')), { status: 400 });
            }
            throw Object.assign(new Error('Order fulfillment failed: ' + err.message), { status: 400 });
        }
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

        const previousStatus = order.orderStatus;

        order.orderStatus = newStatus;
        order.orderItems.forEach((item) => {
            item.itemStatus = newStatus;
        });

        // When delivered → mark payment as paid, credit seller earnings, add revenue + commission
        if (newStatus === ORDER_STATUS.DELIVERED) {
            order.deliveredAt = new Date();

            // Mark payment as paid (this is what makes revenue + commission appear in admin dashboard)
            if (order.paymentStatus !== 'paid') {
                order.paymentStatus = 'paid';
            }

            // Credit each seller their earnings (only if not already credited)
            if (previousStatus !== ORDER_STATUS.DELIVERED) {
                const sellerUpdates = {};
                for (const item of order.orderItems) {
                    const sellerId = item.seller.toString();
                    if (!sellerUpdates[sellerId]) {
                        sellerUpdates[sellerId] = 0;
                    }
                    sellerUpdates[sellerId] += item.sellerEarnings || 0;
                }

                for (const [sellerId, earnings] of Object.entries(sellerUpdates)) {
                    if (earnings > 0) {
                        await Seller.findByIdAndUpdate(sellerId, {
                            $inc: { totalEarnings: earnings, pendingPayout: earnings },
                        });
                    }
                }
            }
        }

        // When cancelled → restore product stock
        if (newStatus === ORDER_STATUS.CANCELLED && previousStatus !== ORDER_STATUS.CANCELLED) {
            order.cancelledAt = new Date();
            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { quantity: item.quantity },
                });
            }
        }

        await order.save();
        return order;
    }
}

module.exports = new OrderService();
