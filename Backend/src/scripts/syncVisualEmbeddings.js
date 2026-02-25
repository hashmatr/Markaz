/**
 * Sync Visual Search Embeddings (CLIP Text-Only Mode)
 * 
 * Generates CLIP TEXT embeddings for all product descriptions and stores them in MongoDB.
 * No image downloads needed — CLIP's cross-modal architecture allows
 * comparing image embeddings against text embeddings in the same vector space.
 * 
 * Run this script to build/rebuild the visual search index:
 *   node src/scripts/syncVisualEmbeddings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Register ALL models before any populate() calls
require('../Modal/Product');
require('../Modal/Category');
require('../Modal/seller');

const visualSearchService = require('../Service/visualSearchService');

async function main() {
    console.log('\n========================================');
    console.log('  MARKAZ - Visual Search Embedding Sync');
    console.log('  Mode: CLIP Text Embeddings (fast)');
    console.log('========================================\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.mongodb_url);
    console.log('MongoDB connected!\n');

    // Check current status
    const statusBefore = await visualSearchService.getSyncStatus();
    console.log(`Current status: ${statusBefore.syncedProducts}/${statusBefore.totalProducts} products synced (${statusBefore.percentage}%)\n`);

    // Run sync
    const startTime = Date.now();
    const result = await visualSearchService.syncAllProducts();
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    console.log('\n========================================');
    console.log('  Sync Results');
    console.log('========================================');
    console.log(`  Total Products : ${result.total}`);
    console.log(`  Synced         : ${result.synced}`);
    console.log(`  Failed         : ${result.failed}`);
    console.log(`  Time           : ${elapsed}s`);
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Done! MongoDB disconnected.');
    process.exit(0);
}

main().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});
