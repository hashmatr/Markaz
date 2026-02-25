/**
 * Seed a demo Flash Sale with existing products.
 * Run: node src/scripts/seedFlashSale.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const FlashSale = require('../Modal/FlashSale');
const Product = require('../Modal/Product');

async function seed() {
    await mongoose.connect(process.env.mongodb_url);
    console.log('Connected to MongoDB');

    // Get some random products
    const products = await Product.find({}).limit(6).lean();
    if (products.length === 0) {
        console.log('No products found — please seed products first.');
        process.exit(1);
    }

    // Create a flash sale that lasts 3 days from now
    const now = new Date();
    const endTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const flashProducts = products.map(p => ({
        product: p._id,
        originalPrice: p.price,
        flashPrice: Math.round(p.price * 0.6), // 40% off
        flashDiscountPercent: 40,
        maxQuantity: 50,
        soldCount: Math.floor(Math.random() * 20),
    }));

    // Delete old flash sales first
    await FlashSale.deleteMany({});

    const sale = await FlashSale.create({
        title: 'MEGA FLASH SALE',
        description: 'Up to 40% off on selected products! Limited time only!',
        products: flashProducts,
        startTime: now,
        endTime: endTime,
        isActive: true,
        bannerColor: '#ef4444',
        bannerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
    });

    console.log(`Flash sale created: "${sale.title}" with ${sale.products.length} products`);
    console.log(`Active from: ${sale.startTime.toISOString()}`);
    console.log(`Ends at:     ${sale.endTime.toISOString()}`);

    await mongoose.disconnect();
    console.log('Done!');
}

seed().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
