const chatbotService = require('../Service/chatbotService');

/**
 * Handle chat messages
 */
const chat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        // Use provided sessionId or generate one
        const session = sessionId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await chatbotService.chat(session, message.trim());

        return res.status(200).json({
            success: true,
            data: {
                ...response,
                sessionId: session,
            },
        });
    } catch (err) {
        console.error('ChatbotController: Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.',
        });
    }
};

/**
 * Clear chat history
 */
const clearChat = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (sessionId) {
            chatbotService.clearHistory(sessionId);
        }
        return res.status(200).json({
            success: true,
            message: 'Chat history cleared',
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to clear chat history',
        });
    }
};

module.exports = { chat, clearChat };
