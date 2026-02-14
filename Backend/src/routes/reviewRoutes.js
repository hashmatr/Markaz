const express = require('express');
const reviewController = require('../controller/reviewController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Public Routes ───────────────────────────
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/seller/:sellerId', reviewController.getSellerReviews);

// ─── Protected Routes ────────────────────────
router.post('/', authenticate, reviewController.createReview);
router.put('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;
