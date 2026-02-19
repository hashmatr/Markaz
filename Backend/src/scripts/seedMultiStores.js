/**
 * ═══════════════════════════════════════════════════════════════
 *  MARKAZ — Multi-Store API Seed Script
 *  Seeds 4 unique stores from 4 different public APIs.
 * ═══════════════════════════════════════════════════════════════
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const https = require('https');
const http = require('http');

const User = require('../Modal/User');
const Seller = require('../Modal/seller');
const Category = require('../Modal/Category');
const Product = require('../Modal/Product');
const Review = require('../Modal/Review');

// ─── Utility: fetch JSON ───────────────────────────────────────
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, { headers: { 'User-Agent': 'Markaz-Seed/6.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`JSON parse error for ${url}: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const hashPw = async (pw) => await bcrypt.hash(pw, 10);

// ─── DB Helpers ──────────────────────────────────────────────
async function upsertUser(fullName, email, password) {
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            fullName, email,
            password: await hashPw(password),
            role: 'SELLER', isEmailVerified: true, isActive: true,
        });
    }
    return user;
}

async function upsertSeller(user, storeName, storeSlug, desc) {
    let seller = await Seller.findOne({ $or: [{ user: user._id }, { storeSlug }] });
    if (!seller) {
        seller = await Seller.create({
            user: user._id, storeName, storeSlug, storeDescription: desc,
            businessEmail: user.email, businessPhone: '+923000000000',
            accountStatus: 'active', isVerified: true,
            rating: 4.5,
        });
    }
    return seller;
}

async function upsertCategory(name) {
    const slug = slugify(name);
    let cat = await Category.findOne({ slug });
    if (!cat) {
        cat = await Category.create({ name, slug, description: `${name} products`, isActive: true });
    }
    return cat;
}

// ─── Store Definitions ────────────────────────────────────────
const STORE_CONFIGS = [
    {
        api: 'https://fakestoreapi.com/products',
        sellerName: process.env.STORE1_SELLER_NAME,
        email: process.env.STORE1_EMAIL,
        password: process.env.SEED_COMMON_PASSWORD,
        storeName: 'Classic Collection',
        slug: 'classic-collection',
        desc: 'Curated collection of jewelry, electronics, and fashion from around the world.',
        mapper: (item) => ({
            title: item.title,
            description: item.description,
            price: Math.round(item.price * 280), // USD to PKR approx
            images: [{ url: item.image }],
            categoryName: item.category,
            brand: 'Classic',
            specs: [{ key: 'Source', value: 'FakeStoreAPI' }]
        })
    },
    {
        api: 'https://api.escuelajs.co/api/v1/products',
        sellerName: process.env.STORE2_SELLER_NAME,
        email: process.env.STORE2_EMAIL,
        password: process.env.SEED_COMMON_PASSWORD,
        storeName: 'Escuela Hub',
        slug: 'escuela-hub',
        desc: 'Trending international styles in electronics, furniture, and apparel.',
        mapper: (item) => ({
            title: item.title,
            description: item.description,
            price: Math.round(item.price * 280),
            images: item.images.map(url => ({ url: url.replace(/[\[\]"]/g, '') })), // clean URLs if needed
            categoryName: item.category.name,
            brand: 'Escuela',
            specs: [{ key: 'Collection', value: 'Global Edition' }]
        })
    },
    {
        api: 'https://furniture-api.fly.dev/v1/products',
        sellerName: process.env.STORE3_SELLER_NAME,
        email: process.env.STORE3_EMAIL,
        password: process.env.SEED_COMMON_PASSWORD,
        storeName: 'Furniture Palace',
        slug: 'furniture-palace',
        desc: 'Premium quality furniture and home decor for modern living spaces.',
        mapper: (item) => ({
            title: item.name || item.title,
            description: item.description || 'Modern furniture piece.',
            price: Math.round((item.price || 100) * 280),
            images: [{ url: item.image_path || item.image_url || item.image }],
            categoryName: 'Furniture',
            brand: 'WoodCraft',
            specs: [{ key: 'Material', value: 'Mixed' }]
        })
    },
    {
        api: 'http://makeup-api.herokuapp.com/api/v1/products.json',
        sellerName: process.env.STORE4_SELLER_NAME,
        email: process.env.STORE4_EMAIL,
        password: process.env.SEED_COMMON_PASSWORD,
        storeName: 'Glow Makeup Studio',
        slug: 'glow-makeup',
        desc: 'Authentic beauty and skincare products from the most trusted global brands.',
        mapper: (item) => ({
            title: item.name,
            description: item.description || 'Premium makeup product.',
            price: Math.round((parseFloat(item.price) || 20) * 280),
            images: [{ url: item.api_featured_image || item.image_link }],
            categoryName: item.category || item.product_type || 'Beauty',
            brand: item.brand || 'Glow',
            specs: [
                { key: 'Brand', value: item.brand || 'N/A' },
                { key: 'Product Type', value: item.product_type || 'N/A' }
            ]
        })
    }
];

async function seed() {
    console.log('\n🚀  STARTING MULTI-STORE SEED...\n');

    const mongoUri = process.env.mongodb_url || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    for (const config of STORE_CONFIGS) {
        console.log(`📡 Fetching data for: ${config.storeName}...`);
        try {
            const rawData = await fetchJSON(config.api);
            const itemsToSeed = Array.isArray(rawData) ? rawData.slice(0, 30) : (rawData.products || rawData.data || []).slice(0, 30);

            if (itemsToSeed.length === 0) {
                console.warn(`   ⚠️ No products found for ${config.storeName}`);
                continue;
            }

            const user = await upsertUser(config.sellerName, config.email, config.password);
            const seller = await upsertSeller(user, config.storeName, config.slug, config.desc);

            // Cleanup existing products for this store to fix image issues
            console.log(`   🧹 Cleaning up existing products for ${config.storeName}...`);
            await Product.deleteMany({ seller: seller._id });

            console.log(`   ✨ Seeding ${itemsToSeed.length} products...`);
            let count = 0;

            for (const rawItem of itemsToSeed) {
                const mapped = config.mapper(rawItem);
                if (!mapped.title || !mapped.price) continue;

                const category = await upsertCategory(mapped.categoryName || 'General');
                const productSlug = `${slugify(mapped.title)}-${Math.random().toString(36).slice(2, 7)}`;

                // Ensure image URLs are valid and use HTTPS where possible
                const validImages = mapped.images
                    .filter(img => img.url && typeof img.url === 'string' && (img.url.startsWith('http') || img.url.startsWith('//')))
                    .map(img => {
                        let url = img.url;
                        if (url.startsWith('//')) {
                            url = 'https:' + url;
                        } else if (url.startsWith('http://')) {
                            url = url.replace('http://', 'https://');
                        }
                        return { url };
                    });

                if (validImages.length === 0) continue;

                await Product.create({
                    title: mapped.title,
                    slug: productSlug,
                    description: mapped.description?.slice(0, 5000) || 'No description available.',
                    price: mapped.price,
                    quantity: 50 + Math.floor(Math.random() * 50),
                    images: validImages,
                    category: category._id,
                    seller: seller._id,
                    brand: mapped.brand,
                    specifications: mapped.specs,
                    rating: 4.0 + Math.random(),
                    totalSold: Math.floor(Math.random() * 100),
                    isActive: true
                });
                count++;
            }

            seller.totalProducts = count;
            await seller.save();
            console.log(`   ✅ Success! ${count} products added for ${config.storeName}\n`);

        } catch (err) {
            console.error(`   ❌ Failed for ${config.storeName}: ${err.message}\n`);
        }
    }

    console.log('🎉 ALL STORES SEEDED SUCCESSFULLY!');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
