const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/Modal/Category');
const Product = require('./src/Modal/Product');

async function check() {
    try {
        await mongoose.connect(process.env.mongodb_url);
        const products = await Product.find({ isActive: true }).limit(50).populate('category');
        const results = products.map(p => `PRODUCT=${p.title}, CAT_NAME=${p.category?.name}, CAT_SLUG=${p.category?.slug}`).join('\n');
        fs.writeFileSync('product-cats.txt', results);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('product-cats.txt', e.message);
        process.exit(1);
    }
}
check();
