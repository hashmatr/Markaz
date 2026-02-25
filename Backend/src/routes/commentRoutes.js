const express = require('express');
const router = express.Router();
const commentController = require('../controller/commentController');
const authenticate = require('../middleware/authMiddleware');

// Public - read comments
router.get('/product/:productId', commentController.getProductComments);

// Auth required - create, update, delete
router.post('/', authenticate, commentController.createComment);
router.put('/:id', authenticate, commentController.updateComment);
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;
