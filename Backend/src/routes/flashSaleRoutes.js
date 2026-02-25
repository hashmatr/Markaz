const express = require('express');
const router = express.Router();
const flashSaleController = require('../controller/flashSaleController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// Public routes
router.get('/active', flashSaleController.getActiveFlashSales);
router.get('/upcoming', flashSaleController.getUpcomingFlashSales);

// Admin routes
router.post('/', authenticate, authorize('ADMIN'), flashSaleController.createFlashSale);
router.delete('/:id', authenticate, authorize('ADMIN'), flashSaleController.deleteFlashSale);

module.exports = router;
