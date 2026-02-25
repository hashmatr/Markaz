const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/image', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL is required');

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const contentType = response.headers['content-type'];
        if (contentType) res.setHeader('Content-Type', contentType);

        // Allow CORS
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Cache for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400');

        response.data.pipe(res);
    } catch (error) {
        console.error('Image proxy error:', error.message);
        res.status(500).send('Failed to fetch image');
    }
});

module.exports = router;
