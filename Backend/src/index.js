require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDb = require('./Config/db');
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

const app = express();

// ─── Security Middleware ─────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────
app.use(
    cors({
        origin: [
            process.env.CLIENT_URL || 'http://localhost:3000',
            process.env.ADMIN_URL || 'http://localhost:3001',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
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

// ─── Public Categories Route ─────────────────
const Category = require('./Modal/Category');
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parentCategory', 'name slug')
            .sort({ level: 1, name: 1 });
        res.status(200).json({ success: true, data: { categories } });
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
});

module.exports = app;
