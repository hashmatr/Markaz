const express = require('express');
const cartController = require('../controller/cartController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCartItem);
router.delete('/item/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;
