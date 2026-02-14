const express = require('express');
const adminController = require('../controller/adminController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { uploadCategoryImage } = require('../middleware/uploadMiddleware');

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// ─── Dashboard ───────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ─── User Management ─────────────────────────
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// ─── Category Management ─────────────────────
router.post('/categories', uploadCategoryImage, adminController.createCategory);
router.get('/categories', adminController.getAllCategories);
router.put('/categories/:id', uploadCategoryImage, adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ─── Seller Management ──────────────────────
router.get('/sellers', adminController.getAllSellers);
router.put('/sellers/:id/status', adminController.updateSellerStatus);

// ─── Payout Management ──────────────────────
router.get('/payouts', adminController.getAllPayouts);
router.put('/payouts/:id/process', adminController.processPayout);

module.exports = router;
