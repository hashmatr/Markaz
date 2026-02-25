const stylistService = require('../Service/stylistService');
const mongoose = require('mongoose');

/**
 * Record a product view (called when user views a product)
 */
const recordView = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Login required to track views' });
        }

        if (!productId || !mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ success: false, message: 'Valid productId is required' });
        }

        const entry = await stylistService.recordView(userId, productId);

        return res.status(200).json({
            success: true,
            data: { recorded: !!entry },
        });
    } catch (err) {
        console.error('StylistController: recordView error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to record view' });
    }
};

/**
 * Get personalized recommendations
 */
const getRecommendations = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Login required for recommendations' });
        }

        const limit = parseInt(req.query.limit) || 12;
        const result = await stylistService.getRecommendations(userId, limit);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error('StylistController: getRecommendations error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to get recommendations' });
    }
};

/**
 * AI Personal Shopper chat (profile-aware)
 */
const chat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user?._id || null; // Optional: works for guests too

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const session = sessionId || `stylist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await stylistService.chat(session, message.trim(), userId);

        return res.status(200).json({
            success: true,
            data: {
                ...response,
                sessionId: session,
            },
        });
    } catch (err) {
        console.error('StylistController: chat error:', err.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
};

/**
 * Clear chat history
 */
const clearChat = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (sessionId) {
            stylistService.clearHistory(sessionId);
        }
        return res.status(200).json({ success: true, message: 'Chat history cleared' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to clear chat history' });
    }
};

/**
 * Get user's browsing stats / taste profile
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Login required' });
        }

        const [profile, stats] = await Promise.all([
            stylistService.buildUserProfile(userId),
            stylistService.getBrowsingStats(userId),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                profile,
                stats,
            },
        });
    } catch (err) {
        console.error('StylistController: getProfile error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
};

module.exports = { recordView, getRecommendations, chat, clearChat, getProfile };
