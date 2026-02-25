const express = require('express');
const multer = require('multer');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { searchByImage, syncEmbeddings, getStatus } = require('../controller/visualSearchController');

const router = express.Router();

// In-memory storage for visual search uploads (no need to save to disk/cloud)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
        }
    },
});

// POST /api/visual-search — Search by image (public)
router.post('/', upload.single('image'), searchByImage);

// POST /api/visual-search/sync — Sync product embeddings (admin only)
router.post('/sync', authenticate, authorize('ADMIN'), syncEmbeddings);

// GET /api/visual-search/status — Get sync status (public)
router.get('/status', getStatus);

module.exports = router;
