const Cart = require('../Modal/Cart');
const Product = require('../Modal/Product');
const asyncHandler = require('../middleware/asyncHandler');

class CartController {
    /**
     * GET /api/cart - Get user's cart
     */
    getCart = asyncHandler(async (req, res) => {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'title images price discountedPrice quantity isActive')
            .populate('items.seller', 'storeName');

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        return res.status(200).json({
            success: true,
            data: { cart },
        });
    });

    /**
     * POST /api/cart/add - Add item to cart
     */
    addToCart = asyncHandler(async (req, res) => {
        const { productId, quantity = 1, size, color } = req.body;

        // Validate product
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable',
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.quantity} items available in stock`,
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            (item) =>
                item.product.toString() === productId &&
                item.size === (size || null) &&
                item.color === (color || null)
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                seller: product.seller,
                quantity,
                size: size || undefined,
                color: color || undefined,
                price: product.price,
                discountedPrice: product.discountedPrice || product.price,
            });
        }

        await cart.save();

        // Populate for response
        cart = await Cart.findById(cart._id)
            .populate('items.product', 'title images price discountedPrice quantity')
            .populate('items.seller', 'storeName');

        return res.status(200).json({
            success: true,
            message: 'Item added to cart',
            data: { cart },
        });
    });

    /**
     * PUT /api/cart/update - Update cart item quantity
     */
    updateCartItem = asyncHandler(async (req, res) => {
        const { itemId, quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart',
            });
        }

        // Validate stock
        const product = await Product.findById(item.product);
        if (product && quantity > product.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.quantity} items available in stock`,
            });
        }

        if (quantity <= 0) {
            // Remove item
            cart.items.pull(itemId);
        } else {
            item.quantity = quantity;
        }

        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'title images price discountedPrice quantity')
            .populate('items.seller', 'storeName');

        return res.status(200).json({
            success: true,
            message: 'Cart updated',
            data: { cart: updatedCart },
        });
    });

    /**
     * DELETE /api/cart/item/:itemId - Remove item from cart
     */
    removeFromCart = asyncHandler(async (req, res) => {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        cart.items.pull(req.params.itemId);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'title images price discountedPrice quantity')
            .populate('items.seller', 'storeName');

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: { cart: updatedCart },
        });
    });

    /**
     * DELETE /api/cart/clear - Clear entire cart
     */
    clearCart = asyncHandler(async (req, res) => {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Cart cleared',
            data: { cart },
        });
    });
}

module.exports = new CartController();
