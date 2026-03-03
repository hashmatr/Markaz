const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../Modal/Order');
const Cart = require('../Modal/Cart');
const User = require('../Modal/User');
const { sendPaymentSuccessEmail } = require('../utils/sendEmail');

// Lazy Stripe initialization - only create when actually needed
let stripeInstance = null;
function getStripe() {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key || key.includes('YOUR_STRIPE')) {
            throw Object.assign(
                new Error('Stripe is not configured. Please add your STRIPE_SECRET_KEY to the .env file.'),
                { status: 503 }
            );
        }
        stripeInstance = require('stripe')(key);
    }
    return stripeInstance;
}

class PaymentController {
    /**
     * POST /api/payments/create-checkout-session
     * Creates a Stripe Checkout session for online payment
     */
    createCheckoutSession = asyncHandler(async (req, res) => {
        const userId = req.user._id;
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('orderItems.product', 'title images');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentMethod !== 'online') {
            return res.status(400).json({ success: false, message: 'This order is not marked for online payment' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'This order is already paid' });
        }

        // Determine URLs
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        // Conversion rate PKR to USD (Adjust as needed, e.g., 280)
        const PKR_TO_USD = 280;

        // Build line items for Stripe - Convert PKR to USD cents
        const lineItems = order.orderItems.map(item => {
            const productTitle = item.product?.title || 'Product';
            const productImage = item.product?.images?.[0]?.url;
            const pkrPrice = (item.discountedPrice || item.price);
            const usdCents = Math.round((pkrPrice / PKR_TO_USD) * 100);

            const lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: productTitle,
                    },
                    unit_amount: Math.max(usdCents, 50), // Stripe minimum is 50 cents
                },
                quantity: item.quantity,
            };

            if (productImage) {
                lineItem.price_data.product_data.images = [productImage];
            }

            return lineItem;
        });

        // Add shipping cost
        if (order.shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Shipping & Handling' },
                    unit_amount: Math.max(Math.round((order.shippingCost / PKR_TO_USD) * 100), 1),
                },
                quantity: 1,
            });
        }

        const sessionConfig = {
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            success_url: `${clientUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
            cancel_url: `${clientUrl}/checkout?payment=cancelled`,
            metadata: {
                orderId: orderId.toString(),
                userId: userId.toString(),
            },
            customer_email: req.user.email,
        };

        // Handle first order discount in PKR -> USD
        if (order.firstOrderDiscount > 0) {
            const usdDiscountCents = Math.round((order.firstOrderDiscount / PKR_TO_USD) * 100);
            if (usdDiscountCents > 0) {
                const coupon = await getStripe().coupons.create({
                    amount_off: usdDiscountCents,
                    currency: 'usd',
                    name: 'First Order Bonus',
                    duration: 'once',
                });
                sessionConfig.discounts = [{ coupon: coupon.id }];
            }
        }

        const session = await getStripe().checkout.sessions.create(sessionConfig);

        return res.status(200).json({
            success: true,
            data: {
                sessionId: session.id,
                url: session.url,
            },
        });
    });

    /**
     * POST /api/payments/verify-session
     * Verifies a completed Stripe checkout session and updates order payment
     */
    verifySession = asyncHandler(async (req, res) => {
        const { sessionId, orderId } = req.body;

        if (!sessionId || !orderId) {
            return res.status(400).json({ success: false, message: 'Session ID and Order ID are required' });
        }

        const session = await getStripe().checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Payment not completed' });
        }

        // Verify orderId matches
        if (session.metadata.orderId !== orderId) {
            return res.status(400).json({ success: false, message: 'Order ID mismatch' });
        }

        // Update order's payment status
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.paymentId = session.payment_intent;
            await order.save();

            // Send Payment Success Email
            User.findById(order.user).then(user => {
                if (user && user.email) {
                    sendPaymentSuccessEmail(user.email, order);
                }
            }).catch(err => console.error('PaymentController: Email user fetch failed:', err));
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: { order },
        });
    });

    /**
     * GET /api/payments/config
     * Returns the Stripe publishable key to the frontend
     */
    getConfig = asyncHandler(async (req, res) => {
        return res.status(200).json({
            success: true,
            data: {
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            },
        });
    });
}

module.exports = new PaymentController();
