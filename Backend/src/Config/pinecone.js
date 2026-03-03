const { Pinecone } = require('@pinecone-database/pinecone');

let pineconeClient = null;
let textIndex = null;
let imageIndex = null;

/**
 * Connect to Pinecone and initialize both indexes.
 * - products-text-index  : 1024-dim text embeddings (BGE-large)
 * - products-image-index : 512-dim image embeddings (CLIP ViT-B/32)
 */
const connectPinecone = async () => {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
        console.warn('⚠️  Pinecone: PINECONE_API_KEY not set. Vector search disabled.');
        return { textIndex: null, imageIndex: null };
    }

    const textIndexName = process.env.PINECONE_TEXT_INDEX || 'products-text-index';
    const imageIndexName = process.env.PINECONE_IMAGE_INDEX || 'products-image-index';

    try {
        pineconeClient = new Pinecone({ apiKey });

        // ── Connect to Text Index (1024-dim) ─────────────────────
        console.log(`Pinecone: Connecting to text index "${textIndexName}"...`);
        textIndex = pineconeClient.index(textIndexName);
        const textStats = await textIndex.describeIndexStats();
        console.log(`✅ Pinecone: Text index connected (${textStats.totalRecordCount || 0} vectors)`);

        // ── Connect to Image Index (512-dim) ─────────────────────
        console.log(`Pinecone: Connecting to image index "${imageIndexName}"...`);
        imageIndex = pineconeClient.index(imageIndexName);
        const imageStats = await imageIndex.describeIndexStats();
        console.log(`✅ Pinecone: Image index connected (${imageStats.totalRecordCount || 0} vectors)`);

        return { textIndex, imageIndex };
    } catch (err) {
        console.error('❌ Pinecone: Connection error:', err.message);
        // Gracefully degrade — app still works without vector search
        textIndex = null;
        imageIndex = null;
        return { textIndex: null, imageIndex: null };
    }
};

/**
 * Returns the text embeddings index (1024-dim)
 */
const getTextIndex = () => textIndex;

/**
 * Returns the image/CLIP embeddings index (512-dim)
 */
const getImageIndex = () => imageIndex;

/**
 * Returns the raw Pinecone client
 */
const getPineconeClient = () => pineconeClient;

module.exports = {
    connectPinecone,
    getTextIndex,
    getImageIndex,
    getPineconeClient,
};
