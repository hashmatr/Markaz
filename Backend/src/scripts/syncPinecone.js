/**
 * syncPinecone.js
 * ───────────────
 * Batch-sync all active products to the Pinecone TEXT index.
 *
 * Usage:
 *   npm run sync:pinecone
 *   node src/scripts/syncPinecone.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectPinecone } = require('../Config/pinecone');
const pineconeService = require('../Service/pineconeService');

const MONGO_URI = process.env.mongodb_url;

async function main() {
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Pinecone Text Embedding Sync               │');
    console.log('└─────────────────────────────────────────────┘');
    console.log();

    // Connect MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected\n');

    // Connect Pinecone
    console.log('Connecting to Pinecone...');
    await connectPinecone();
    console.log();

    // Run batch sync
    const startTime = Date.now();
    const result = await pineconeService.batchSyncTextEmbeddings({ force: false });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n┌─────────────────────────────────────────────┐');
    console.log(`│  RESULTS                                     │`);
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│  Synced:  ${String(result.synced).padEnd(35)}│`);
    console.log(`│  Skipped: ${String(result.skipped).padEnd(35)}│`);
    console.log(`│  Failed:  ${String(result.failed).padEnd(35)}│`);
    console.log(`│  Time:    ${String(elapsed + 's').padEnd(35)}│`);
    console.log('└─────────────────────────────────────────────┘');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
