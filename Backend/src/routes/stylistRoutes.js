const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { recordView, getRecommendations, chat, clearChat, getProfile } = require('../controller/stylistController');

// ─── Public (works for guests too, auth is optional for chat) ───
// Chat uses req.user optionally if present via authenticate middleware
router.post('/chat', (req, res, next) => {
    // Optional auth: try to authenticate, but don't block if no token
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    if (authHeader || cookieToken) {
        return authenticate(req, res, next);
    }
    next();
}, chat);

router.post('/chat/clear', clearChat);

// ─── Protected (requires login) ─────────────────────────────────
router.post('/view', authenticate, recordView);
router.get('/recommendations', authenticate, getRecommendations);
router.get('/profile', authenticate, getProfile);

module.exports = router;
