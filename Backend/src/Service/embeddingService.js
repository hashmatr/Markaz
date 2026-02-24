const { pipeline } = require('@xenova/transformers');
const { getPineconeIndex } = require('../Config/pinecone');

class LocalEmbeddingService {
    constructor() {
        this.extractor = null;
        this.modelName = 'Xenova/bge-large-en-v1.5'; // 1024 dimensions
        this._init();
    }

    async _init() {
        if (this.extractor) return; // Already initialized
        try {
            console.log(`EmbeddingService: Loading local model (${this.modelName})...`);
            this.extractor = await pipeline('feature-extraction', this.modelName);
            console.log('EmbeddingService: Local model loaded successfully!');
        } catch (err) {
            console.error('EmbeddingService: Failed to load local model:', err.message);
        }
    }

    buildProductText(p) {
        return `${p.title || ''}. ${p.brand || ''}. ${p.description || ''}`.substring(0, 1000);
    }

    async generateEmbedding(text) {
        if (!this.extractor) {
            await this._init();
        }

        try {
            const output = await this.extractor(text, { pooling: 'mean', normalize: true });
            const vector = Array.from(output.data);
            if (!vector || vector.length === 0) throw new Error('Generated vector is empty');
            return vector;
        } catch (err) {
            console.error('Embedding Generation Error:', err.message);
            throw err;
        }
    }

    async searchSimilar(queryText, topK = 20) {
        const index = getPineconeIndex();
        if (!index) return [];

        try {
            const embedding = await this.generateEmbedding(queryText);
            const results = await index.query({
                vector: embedding,
                topK,
                includeMetadata: true,
                filter: { isActive: true }
            });
            return (results.matches || []).map(m => ({
                productId: m.id,
                score: m.score
            }));
        } catch (err) {
            console.error('Local Embedding Search failed:', err.message);
            return [];
        }
    }

    /**
     * Upsert a single product
     */
    async upsertProduct(p) {
        const index = getPineconeIndex();
        if (!index) return;

        try {
            const text = this.buildProductText(p);
            const values = await this.generateEmbedding(text);

            if (!values || values.length === 0) {
                throw new Error('Could not generate embedding values');
            }

            const record = {
                id: p._id.toString(),
                values: values,
                metadata: {
                    title: p.title || '',
                    brand: p.brand || '',
                    isActive: true
                }
            };

            // Updated for Pinecone SDK v7.1.0
            await index.upsert({ records: [record] });
            console.log(`ProductService: Product ${p._id} updated in Pinecone.`);
        } catch (err) {
            console.error(`EmbeddingService: Failed to upsert product ${p._id}:`, err.message);
        }
    }

    /**
     * BATCH SYNC - More robust and faster
     */
    async upsertProducts(products) {
        const index = getPineconeIndex();
        if (!index) return 0;

        console.log(`Starting batch sync of ${products.length} products...`);
        let successCount = 0;
        const batchSize = 10;

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            const records = [];

            for (const p of batch) {
                try {
                    const text = this.buildProductText(p);
                    const values = await this.generateEmbedding(text);

                    if (values && values.length > 0) {
                        records.push({
                            id: p._id.toString(),
                            values: values,
                            metadata: {
                                title: (p.title || '').substring(0, 500),
                                brand: (p.brand || '').substring(0, 100),
                                isActive: true
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Skipping product ${p.title}: Embedding failed`);
                }
            }

            if (records.length > 0) {
                try {
                    // Updated for v7.1.0: use { records: [...] }
                    await index.upsert({ records });
                    successCount += records.length;
                    console.log(`Progress: ${successCount}/${products.length} products synced.`);
                } catch (err) {
                    console.error(`Batch upsert failed at index ${i}:`, err.message);
                    // Fallback: try one by one
                    for (const rec of records) {
                        try {
                            await index.upsert({ records: [rec] });
                            successCount++;
                        } catch (singleErr) {
                            console.error(`Individual upsert failed for ${rec.id}:`, singleErr.message);
                        }
                    }
                }
            }
        }
        return successCount;
    }

    isAvailable() {
        return !!(getPineconeIndex());
    }
}

module.exports = new LocalEmbeddingService();
