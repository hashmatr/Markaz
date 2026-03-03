const express = require('express');
const multer = require('multer');
const { searchByImage, getStatus } = require('../controller/visualSearchController');

const router = express.Router();

// In-memory storage for visual search uploads
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

// GET /api/visual-search/status — Get status (public)
router.get('/status', getStatus);

module.exports = router;
