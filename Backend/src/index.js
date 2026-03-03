require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDb = require('./Config/db');
const { connectRedis } = require('./Config/redis');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const visualSearchRoutes = require('./routes/visualSearchRoutes');
const stylistRoutes = require('./routes/stylistRoutes');
const proxyRoutes = require('./routes/proxyRoutes');
const flashSaleRoutes = require('./routes/flashSaleRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { CACHE_KEYS, TTL, getCache, setCache } = require('./Service/cacheService');

const app = express();

// ─── Security Middleware ─────────────────────
/*
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https://cdn.dummyjson.com", "https://fakestoreapi.com", "https://api.escuelajs.co", "https://placehold.co", "https://p1.akcdn.net", "https://makeup-api.herokuapp.com"],
        },
    },
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
}));
*/

// ─── CORS ────────────────────────────────────
app.use(
    cors({
        origin: [
            process.env.CLIENT_URL || 'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            process.env.ADMIN_URL || 'http://localhost:3001',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    })
);

// ─── Body Parsing ────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ─── Rate Limiting ───────────────────────────
app.use('/api', generalLimiter);

// ─── Health Check ────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Markaz Multi-Vendor E-Commerce API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            otp: '/api/otp',
            sellers: '/api/sellers',
            products: '/api/products',
            orders: '/api/orders',
            cart: '/api/cart',
            reviews: '/api/reviews',
            admin: '/api/admin',
        },
    });
});

// ─── API Routes ──────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', contactRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/visual-search', visualSearchRoutes);
app.use('/api/stylist', stylistRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// Sitemap
const sitemapController = require('./controller/sitemapController');
app.get('/api/sitemap.xml', sitemapController.getSitemapIndex);
app.get('/api/sitemap-products.xml', sitemapController.getProductSitemap);
app.get('/api/sitemap-categories.xml', sitemapController.getCategorySitemap);
app.get('/api/sitemap-vendors.xml', sitemapController.getVendorSitemap);

// ─── Public Categories Route (Redis Cached) ─────────────────
const Category = require('./Modal/Category');
app.get('/api/categories', async (req, res) => {
    try {
        // Try Redis cache first for sub-200ms response
        const cached = await getCache(CACHE_KEYS.CATEGORY_TREE);
        if (cached) {
            return res.status(200).json({ success: true, data: cached, fromCache: true });
        }

        const categories = await Category.find()
            .populate('parentCategory', 'name slug')
            .sort({ level: 1, name: 1 });

        const responseData = { categories };
        // Cache for 10 minutes
        await setCache(CACHE_KEYS.CATEGORY_TREE, responseData, TTL.CATEGORY_TREE);

        res.status(200).json({ success: true, data: responseData });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

// ─── 404 Handler ─────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ─── Global Error Handler ────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}`);
    console.log('────────────────────────────────────────');
    await connectDb();
    await connectRedis(); // Non-fatal — falls back to in-memory if Redis unavailable
});

module.exports = app;
