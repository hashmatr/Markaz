const express = require('express');
const multer = require('multer');
const { searchByImage, searchByText, getStatus } = require('../controller/visualSearchController');

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

// GET /api/visual-search — Informative error for wrong method
router.get('/', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Visual search requires a POST request with an image file. If you see this error, make sure your URL ends with a trailing slash to avoid redirects.'
    });
});

// POST /api/visual-search — Search by image (public)
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer Error:', err.message);
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Unknown Upload Error:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        }
        // Everything went fine.
        next();
    });
}, searchByImage);

// POST /api/visual-search/text — Semantic text search (public)
router.post('/text', searchByText);

// GET /api/visual-search/status — Get index status (public)
router.get('/status', getStatus);

module.exports = router;
