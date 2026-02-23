const express = require('express');
const paymentController = require('../controller/paymentController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Get Stripe publishable key (public, but still need auth for security)
router.get('/config', authenticate, paymentController.getConfig);

// Create a Stripe checkout session
router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);

// Verify payment after Stripe redirect
router.post('/verify-session', authenticate, paymentController.verifySession);

module.exports = router;
