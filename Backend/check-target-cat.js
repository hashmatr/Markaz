const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/Modal/Category');
const Product = require('./src/Modal/Product');

async function check() {
    try {
        await mongoose.connect(process.env.mongodb_url);
        const cat = await Category.findOne({ slug: 'men-s-clothing' });
        if (!cat) {
            fs.writeFileSync('target-cat-check.txt', 'Category not found');
            process.exit(0);
        }
        const count = await Product.countDocuments({ category: cat._id });
        fs.writeFileSync('target-cat-check.txt', `SLUG=men-s-clothing, ID=${cat._id}, NAME=${cat.name}, PRODUCT_COUNT=${count}`);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('target-cat-check.txt', e.message);
        process.exit(1);
    }
}
check();
