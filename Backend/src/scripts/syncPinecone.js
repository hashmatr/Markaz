/**
 * syncPinecone.js
 * ────────────────
 * Syncs all active products from MongoDB to Pinecone as embeddings.
 *
 * Usage:
 *   node src/scripts/syncPinecone.js
 *
 * This reads all products, builds a text representation of each,
 * generates embedding vectors using Gemini text-embedding-004,
 * and upserts them into the configured Pinecone index.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');
const Seller = require('../Modal/seller');
const { connectPinecone } = require('../Config/pinecone');
const embeddingService = require('../Service/embeddingService');

async function syncAllProducts() {
    console.log('\n═══════════════════════════════════════════');
    console.log('   Markaz → Pinecone Product Sync');
    console.log('═══════════════════════════════════════════\n');

    // 1. Connect to MongoDB
    try {
        await mongoose.connect(process.env.mongodb_url);
        console.log('MongoDB: Connected');
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }

    // 2. Connect to Pinecone
    const pineconeIndex = await connectPinecone();
    if (!pineconeIndex) {
        console.error('Pinecone connection failed. Set PINECONE_API_KEY and PINECONE_INDEX_NAME in .env');
        process.exit(1);
    }

    try {
        const stats = await pineconeIndex.describeIndexStats();
        console.log('Pinecone: Index stats:', JSON.stringify(stats));
    } catch (err) {
        console.warn('Pinecone: Could not fetch index stats:', err.message);
    }

    // 3. Fetch all active products with populated fields
    console.log('\nFetching products from MongoDB...');
    const products = await Product.find({ isActive: true })
        .populate('category', 'name slug')
        .populate('seller', 'storeName storeSlug rating')
        .lean();

    console.log(`Found ${products.length} active products to sync.\n`);

    if (products.length === 0) {
        console.log('No products to sync. Exiting.');
        process.exit(0);
    }

    // 4. Upsert all products to Pinecone
    console.log('Starting embedding generation & Pinecone upsert...');
    console.log('(This may take a while depending on the number of products)\n');

    const startTime = Date.now();
    const successCount = await embeddingService.upsertProducts(products);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════');
    console.log(`   Sync Complete`);
    console.log(`   ${successCount}/${products.length} products upserted`);
    console.log(`   Time: ${elapsed}s`);
    console.log('═══════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
}

syncAllProducts().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});
