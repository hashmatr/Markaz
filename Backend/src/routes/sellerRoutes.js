const express = require('express');
const sellerController = require('../controller/sellerController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');
const { validateSellerRegistration, validateSellerUpdate } = require('../validators/sellerValidator');

const router = express.Router();

// ─── Public Routes ───────────────────────────
router.get('/all', sellerController.getAllSellers);
router.get('/store/:slug', sellerController.getSellerBySlug);
router.get('/:id', sellerController.getSellerById);

// ─── Protected Routes (Authenticated Users) ──
router.post(
    '/register',
    authenticate,
    validateSellerRegistration,
    validate,
    sellerController.registerSeller
);

// ─── Seller Only Routes ──────────────────────
router.get('/me/profile', authenticate, authorize('SELLER'), sellerController.getSellerProfile);
router.put(
    '/me/profile',
    authenticate,
    authorize('SELLER'),
    validateSellerUpdate,
    validate,
    sellerController.updateSeller
);
router.get('/me/dashboard', authenticate, authorize('SELLER'), sellerController.getSellerDashboard);

// ─── Admin Only Routes ──────────────────────
router.put('/:id/status', authenticate, authorize('ADMIN'), sellerController.updateSellerStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), sellerController.deleteSeller);

module.exports = router;
