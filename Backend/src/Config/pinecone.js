const { Pinecone } = require('@pinecone-database/pinecone');

let pineconeIndex = null;
let pineconeClient = null;

const connectPinecone = async () => {
    const apiKey = process.env.PINECONE_API_KEY;
    // Since only one index exists (markaz-clip), use it for everything via namespaces
    const indexName = process.env.PINECONE_CLIP_INDEX_NAME || process.env.PINECONE_INDEX_NAME || 'markaz-clip';

    if (!apiKey) {
        console.warn('Pinecone: PINECONE_API_KEY not set. Vector search disabled.');
        return null;
    }

    try {
        pineconeClient = new Pinecone({ apiKey });

        console.log(`Pinecone: Connecting to shared index "${indexName}"...`);
        pineconeIndex = pineconeClient.index(indexName);

        // Verify connection
        await pineconeIndex.describeIndexStats();
        console.log(`Pinecone: Connected to shared index "${indexName}" (using namespaces)`);

        return pineconeIndex;
    } catch (err) {
        console.error('Pinecone: Connection error:', err.message);
        return null;
    }
};

/**
 * Returns the text-embeddings namespace (1024-dim BGE)
 */
const getTextIndex = () => {
    if (!pineconeIndex) return null;
    return pineconeIndex.namespace('text-embeddings');
};

/**
 * Returns the clip-embeddings namespace (1024-dim padded CLIP)
 */
const getClipIndex = () => {
    if (!pineconeIndex) return null;
    return pineconeIndex.namespace('clip-embeddings');
};

/**
 * Returns the category-embeddings namespace (1024-dim BGE)
 */
const getCategoryIndex = () => {
    if (!pineconeIndex) return null;
    return pineconeIndex.namespace('category-embeddings');
};

/**
 * Compatibility alias
 */
const getPineconeIndex = () => pineconeIndex;

module.exports = { connectPinecone, getPineconeIndex, getClipIndex, getTextIndex, getCategoryIndex };
