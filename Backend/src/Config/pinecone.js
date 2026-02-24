const { Pinecone } = require('@pinecone-database/pinecone');

let pineconeIndex = null;

const connectPinecone = async () => {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'markaz-products';

    if (!apiKey) {
        console.warn('Pinecone: PINECONE_API_KEY not set. Vector search disabled.');
        return null;
    }

    try {
        const pc = new Pinecone({ apiKey });
        pineconeIndex = pc.index(indexName);
        console.log(`Pinecone: Connected to index "${indexName}"`);
        return pineconeIndex;
    } catch (err) {
        console.error('Pinecone: Connection error:', err.message);
        return null;
    }
};

const getPineconeIndex = () => pineconeIndex;

module.exports = { connectPinecone, getPineconeIndex };
