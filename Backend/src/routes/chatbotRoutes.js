const express = require('express');
const router = express.Router();
const { chat, clearChat } = require('../controller/chatbotController');

// POST /api/chatbot — Send a message
router.post('/', chat);

// POST /api/chatbot/clear — Clear chat history
router.post('/clear', clearChat);

module.exports = router;
