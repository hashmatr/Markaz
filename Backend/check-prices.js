const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/Modal/Product');

async function check() {
    try {
        await mongoose.connect(process.env.mongodb_url);
        const missing = await Product.countDocuments({ discountedPrice: { $exists: false } });
        const total = await Product.countDocuments();
        const results = `TOTAL=${total}\nMISSING=${missing}\n`;
        fs.writeFileSync('check-results.txt', results);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('check-results.txt', e.message);
        process.exit(1);
    }
}
check();
