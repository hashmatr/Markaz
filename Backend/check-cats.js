const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/Modal/Category');

async function check() {
    try {
        await mongoose.connect(process.env.mongodb_url);
        const categories = await Category.find({ isActive: true });
        const results = categories.map(c => `ID=${c._id}, NAME=${c.name}, SLUG=${c.slug}, PARENT=${c.parentCategory}`).join('\n');
        fs.writeFileSync('cat-results.txt', results);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('cat-results.txt', e.message);
        process.exit(1);
    }
}
check();
