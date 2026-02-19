require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const https = require('https');

// ─── Models ──────────────────────────────────
const User = require('../Modal/User');
const Seller = require('../Modal/seller');
const Category = require('../Modal/Category');
const Product = require('../Modal/Product');
const Review = require('../Modal/Review');

// ─── Config ──────────────────────────────────
const SELLER_NAME = process.env.HASHMAT_SELLER_NAME;
const SELLER_EMAIL = process.env.HASHMAT_SELLER_EMAIL;
const SELLER_PASSWORD = process.env.HASHMAT_SELLER_PASSWORD;
const STORE_NAME = 'Hashmat Raza Store';

const COLORS = ['#000', '#fff', '#1a3a5c', '#C0C0C0', '#808080', '#FFD700', '#ff3333', '#3b82f6', '#01ab31'];
const SIZES = ['S', 'M', 'L', 'XL', 'Universal', '4GB', '8GB', '16GB', '256GB', '512GB', '1TB'];

// Map dummyjson categories → friendly names
const CATEGORY_MAP = {
    beauty: 'Beauty',
    fragrances: 'Fragrances',
    furniture: 'Furniture',
    groceries: 'Groceries',
    'home-decoration': 'Home Decoration',
    'kitchen-accessories': 'Kitchen Accessories',
    laptops: 'Laptops',
    'mens-shirts': "Men's Shirts",
    'mens-shoes': "Men's Shoes",
    'mens-watches': "Men's Watches",
    'mobile-accessories': 'Mobile Accessories',
    motorcycle: 'Motorcycle',
    'skin-care': 'Skin Care',
    smartphones: 'Smartphones',
    'sports-accessories': 'Sports Accessories',
    sunglasses: 'Sunglasses',
    tablets: 'Tablets',
    tops: 'Tops',
    vehicle: 'Vehicle',
    'womens-bags': "Women's Bags",
    'womens-dresses': "Women's Dresses",
    'womens-jewellery': "Women's Jewellery",
    'womens-shoes': "Women's Shoes",
    'womens-watches': "Women's Watches",
};

// ─── Helper: fetch JSON via https ─────────────
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// ─── Main seed function ───────────────────────
async function seed() {
    console.log('\n🌱  Starting DummyJSON product seed with Reviews & Filters fix...\n');

    // 1. Connect to MongoDB
    const mongoUri = process.env.mongodb_url || process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;
    if (!mongoUri) {
        console.error('❌  No MongoDB URI found in .env (tried mongodb_url, MONGO_URI, MONGODB_URI, DB_URI)');
        process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅  Connected to MongoDB');

    // 2. Create / find User for Hashmat Raza
    let user = await User.findOne({ email: SELLER_EMAIL });
    if (!user) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(SELLER_PASSWORD, salt);
        user = await User.create({
            fullName: SELLER_NAME,
            email: SELLER_EMAIL,
            password: hashedPassword,
            role: 'SELLER',
            isEmailVerified: true,
            isActive: true,
        });
        console.log(`✅  Created user: ${SELLER_NAME} (${SELLER_EMAIL})`);
    } else {
        if (user.role !== 'SELLER') {
            user.role = 'SELLER';
            await user.save();
        }
        console.log(`ℹ️   User already exists: ${SELLER_NAME}`);
    }

    // 3. Create / find Seller profile
    let seller = await Seller.findOne({ user: user._id });
    if (!seller) {
        seller = await Seller.create({
            user: user._id,
            storeName: STORE_NAME,
            storeSlug: 'hashmat-raza-store',
            storeDescription: 'Premium products curated by Hashmat Raza — electronics, fashion, beauty and more.',
            businessEmail: SELLER_EMAIL,
            businessPhone: '+923001234567',
            accountStatus: 'active',
            isVerified: true,
            rating: 4.8,
        });
        console.log(`✅  Created seller profile: ${STORE_NAME}`);
    } else {
        if (seller.accountStatus !== 'active') {
            seller.accountStatus = 'active';
            seller.isVerified = true;
            await seller.save();
        }
        console.log(`ℹ️   Seller profile already exists: ${STORE_NAME}`);
    }

    // 4. Fetch ALL products from dummyjson (up to 194)
    console.log('\n📦  Fetching products from dummyjson.com...');
    const data = await fetchJSON('https://dummyjson.com/products?limit=194&skip=0');
    const dummyProducts = data.products;
    console.log(`✅  Fetched ${dummyProducts.length} products`);

    // 5. Collect unique categories
    const uniqueCats = [...new Set(dummyProducts.map((p) => p.category))];
    const categoryIdMap = {};

    for (const catSlug of uniqueCats) {
        const catName = CATEGORY_MAP[catSlug] || catSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        let cat = await Category.findOne({ slug: catSlug });
        if (!cat) {
            cat = await Category.create({
                name: catName,
                slug: catSlug,
                description: `${catName} products`,
                isActive: true,
                level: 0,
            });
            console.log(`  ➕ Created category: ${catName}`);
        }
        categoryIdMap[catSlug] = cat._id;
    }
    console.log(`✅  Categories ready (${uniqueCats.length} total)`);

    // Create multiple dummy reviewer users for reviews
    const reviewerEmails = ['reviewer1@markaz.pk', 'reviewer2@markaz.pk', 'reviewer3@markaz.pk'];
    const reviewers = [];
    for (const email of reviewerEmails) {
        let rev = await User.findOne({ email });
        if (!rev) {
            rev = await User.create({
                fullName: email.split('@')[0].replace('reviewer', 'Customer #'),
                email,
                password: await bcrypt.hash('reviewer123', 12),
                role: 'CUSTOMER',
                isEmailVerified: true,
            });
        }
        reviewers.push(rev);
    }

    // 6. Seed products
    console.log('\n🛒  Seeding products and reviews...');
    let created = 0;
    let skipped = 0;
    let reviewsCreated = 0;

    for (const dp of dummyProducts) {
        let product = await Product.findOne({ title: dp.title, seller: seller._id });

        if (!product) {
            const discountPercent = Math.round(dp.discountPercentage || 0);
            const price = Math.round(dp.price * 10) || 100;
            const images = (dp.images || [dp.thumbnail]).map((url) => ({ public_id: '', url }));
            const slug = dp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + dp.id;
            const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            const randomSizes = [
                { name: SIZES[Math.floor(Math.random() * SIZES.length)], quantity: 50 },
                { name: SIZES[Math.floor(Math.random() * SIZES.length)], quantity: 50 }
            ];

            product = await Product.create({
                title: dp.title,
                slug,
                description: dp.description,
                price,
                discountPercent,
                quantity: dp.stock || 50,
                images,
                category: categoryIdMap[dp.category],
                seller: seller._id,
                brand: dp.brand || 'Markaz Exclusive',
                color: randomColor,
                sizes: randomSizes,
                rating: Math.min(5, Math.max(0, dp.rating || 0)),
                totalReviews: (dp.reviews || []).length,
                totalSold: Math.floor(Math.random() * 200),
                isActive: true,
                isFeatured: dp.rating >= 4.5,
                tags: dp.tags || [],
            });
            created++;
        } else {
            if (!product.color || !product.sizes || product.sizes.length === 0) {
                product.color = COLORS[Math.floor(Math.random() * COLORS.length)];
                product.sizes = [
                    { name: SIZES[Math.floor(Math.random() * SIZES.length)], quantity: 50 },
                    { name: SIZES[Math.floor(Math.random() * SIZES.length)], quantity: 50 }
                ];
                product.brand = product.brand || 'Markaz Exclusive';
                await product.save();
            }
            skipped++;
        }

        // 7. Seed Reviews
        if (dp.reviews && dp.reviews.length > 0) {
            for (let i = 0; i < dp.reviews.length; i++) {
                const dr = dp.reviews[i];
                const reviewer = reviewers[i % reviewers.length];
                const existingReview = await Review.findOne({ user: reviewer._id, product: product._id });
                if (!existingReview) {
                    await Review.create({
                        user: reviewer._id,
                        product: product._id,
                        seller: seller._id,
                        rating: dr.rating || 5,
                        comment: dr.comment,
                        isApproved: true
                    });
                    reviewsCreated++;
                }
            }
        }
    }

    seller.totalProducts = await Product.countDocuments({ seller: seller._id });
    await seller.save();

    console.log(`\n✅  Seed & Fix complete!`);
    console.log(`   Created Products : ${created}`);
    console.log(`   Updated Products : ${skipped}`);
    console.log(`   Created Reviews  : ${reviewsCreated}`);
    console.log(`   Seller           : ${STORE_NAME}\n`);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
