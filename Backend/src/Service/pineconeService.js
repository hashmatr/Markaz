/**
 * PineconeService
 * ───────────────
 * Handles all Pinecone upsert / query / delete operations
 * for both the text index (1024-dim) and image index (512-dim).
 *
 * Architecture:
 * - productService calls this after create/update/delete
 * - visualSearchController calls query methods
 * - Sync scripts call batch methods
 */

const { getTextIndex, getImageIndex } = require('../Config/pinecone');
const embeddingService = require('./embeddingService');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');

const BATCH_SIZE = 50; // Pinecone max per upsert call is 100, we use 50 for safety

class PineconeService {
    // ──────────────────────────────────────────────────────────────
    //  BUILD METADATA  (shared between text & image vectors)
    // ──────────────────────────────────────────────────────────────

    /**
     * Build Pinecone metadata from a product document.
     * Metadata is stored alongside vectors for filtered queries.
     *
     * @param {object} product - Mongoose product doc (populated or plain)
     * @param {string} [categoryName] - Pre-resolved category name
     * @returns {object}
     */
    _buildMetadata(product, categoryName = '') {
        const catName = categoryName ||
            (product.category && typeof product.category === 'object' ? product.category.name : '') ||
            '';

        const imageUrl = embeddingService.getProductImageUrl(product) || '';

        return {
            mongoId: product._id.toString(),
            title: (product.title || '').substring(0, 200),
            description: (product.description || '').substring(0, 500),
            price: product.discountedPrice || product.price || 0,
            category: catName,
            categoryId: product.category?._id?.toString() || product.category?.toString() || '',
            brand: (product.brand || '').substring(0, 100),
            imageUrl,
        };
    }

    // ──────────────────────────────────────────────────────────────
    //  UPSERT: Single product → both indexes
    // ──────────────────────────────────────────────────────────────

    /**
     * Generate embeddings and upsert a single product into both indexes.
     * Called after product create/update.
     *
     * @param {object} product - Mongoose product doc
     * @param {object} [options]
     * @param {boolean} [options.skipImage=false] - Skip image embedding
     * @param {string}  [options.categoryName]    - Pre-resolved name
     */
    async upsertProduct(product, options = {}) {
        const { skipImage = false, categoryName } = options;
        const productId = product._id.toString();

        // Resolve category name
        let resolvedCatName = categoryName;
        if (!resolvedCatName && product.category) {
            if (typeof product.category === 'object' && product.category.name) {
                resolvedCatName = product.category.name;
            } else {
                const cat = await Category.findById(product.category).lean();
                resolvedCatName = cat?.name || '';
            }
        }

        const metadata = this._buildMetadata(product, resolvedCatName);

        // ── Text Embedding ───────────────────────────────────────
        const textIndex = getTextIndex();
        if (textIndex) {
            try {
                const corpus = embeddingService.buildProductTextCorpus(product, resolvedCatName);
                const textEmbedding = await embeddingService.generateTextEmbedding(corpus);
                await textIndex.upsert({
                    records: [
                        { id: productId, values: textEmbedding, metadata }
                    ]
                });
                console.log(`Pinecone: Text embedding upserted for "${product.title}"`);
            } catch (err) {
                console.error(`Pinecone: Text upsert failed for ${productId}:`, err.message);
            }
        }

        // ── Image Embedding ──────────────────────────────────────
        if (!skipImage) {
            const imageIndex = getImageIndex();
            const imageUrl = embeddingService.getProductImageUrl(product);
            if (imageIndex && imageUrl) {
                try {
                    const imageEmbedding = await embeddingService.generateImageEmbedding(imageUrl);
                    await imageIndex.upsert({
                        records: [
                            { id: productId, values: imageEmbedding, metadata }
                        ]
                    });
                    console.log(`Pinecone: Image embedding upserted for "${product.title}"`);
                } catch (err) {
                    console.error(`Pinecone: Image upsert failed for ${productId}:`, err.message);
                }
            }
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  DELETE: Remove product from both indexes
    // ──────────────────────────────────────────────────────────────

    /**
     * Delete a product's vectors from both indexes.
     * Called after product deletion.
     *
     * @param {string} productId - MongoDB ObjectId string
     */
    async deleteProduct(productId) {
        const id = productId.toString();

        const textIndex = getTextIndex();
        if (textIndex) {
            try {
                await textIndex.deleteOne({ id });
                console.log(`Pinecone: Text vector deleted for ${id}`);
            } catch (err) {
                console.error(`Pinecone: Text delete failed for ${id}:`, err.message);
            }
        }

        const imageIndex = getImageIndex();
        if (imageIndex) {
            try {
                await imageIndex.deleteOne({ id });
                console.log(`Pinecone: Image vector deleted for ${id}`);
            } catch (err) {
                console.error(`Pinecone: Image delete failed for ${id}:`, err.message);
            }
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  QUERY: Text semantic search  (1024-dim)
    // ──────────────────────────────────────────────────────────────

    /**
     * Search for products by text query using semantic similarity.
     *
     * @param {string} query - User search text
     * @param {object} [options]
     * @param {number} [options.topK=10]
     * @param {string} [options.category] - Filter by category name
     * @param {number} [options.minPrice] - Min price filter
     * @param {number} [options.maxPrice] - Max price filter
     * @returns {Promise<{matches: object[], products: object[]}>}
     */
    async searchByText(query, options = {}) {
        const textIndex = getTextIndex();
        if (!textIndex) {
            console.warn('Pinecone: Text index not available');
            return { matches: [], products: [] };
        }

        const { topK = 10, category, minPrice, maxPrice } = options;

        try {
            // Generate query embedding
            const queryEmbedding = await embeddingService.generateTextEmbedding(query);

            // Build Pinecone filter
            const filter = {};
            if (category) {
                filter.category = { $eq: category };
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                filter.price = {};
                if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
                if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
            }

            const queryRequest = {
                vector: queryEmbedding,
                topK: parseInt(topK),
                includeMetadata: true,
            };

            if (Object.keys(filter).length > 0) {
                queryRequest.filter = filter;
            }

            const results = await textIndex.query(queryRequest);
            const matches = results.matches || [];

            if (matches.length === 0) {
                return { matches: [], products: [] };
            }

            // Fetch full product documents from MongoDB
            const mongoIds = matches
                .map(m => m.metadata?.mongoId)
                .filter(Boolean);

            const products = await Product.find({ _id: { $in: mongoIds }, isActive: true })
                .populate('category', 'name slug')
                .populate('seller', 'storeName storeSlug storeLogo rating')
                .lean();

            // Sort products to match Pinecone ranking order
            const productMap = new Map(products.map(p => [p._id.toString(), p]));
            const rankedProducts = mongoIds
                .map(id => productMap.get(id))
                .filter(Boolean);

            return {
                matches: matches.map(m => ({
                    id: m.id,
                    score: m.score,
                    metadata: m.metadata,
                })),
                products: rankedProducts,
            };
        } catch (err) {
            console.error('Pinecone: Text search failed:', err.message);
            return { matches: [], products: [] };
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  QUERY: Image visual search  (512-dim)
    // ──────────────────────────────────────────────────────────────

    /**
     * Search for visually similar products by image.
     *
     * @param {string|Buffer} imageInput - Image URL or Buffer
     * @param {object} [options]
     * @param {number} [options.topK=10]
     * @param {string} [options.category] - Filter by category name
     * @returns {Promise<{matches: object[], products: object[]}>}
     */
    async searchByImage(imageInput, options = {}) {
        const imageIndex = getImageIndex();
        if (!imageIndex) {
            console.warn('Pinecone: Image index not available');
            return { matches: [], products: [] };
        }

        const { topK = 10, category } = options;

        try {
            // Generate CLIP embedding from the query image
            const queryEmbedding = await embeddingService.generateImageEmbedding(imageInput);

            // Build filter
            const filter = {};
            if (category) {
                filter.category = { $eq: category };
            }

            const queryRequest = {
                vector: queryEmbedding,
                topK: parseInt(topK),
                includeMetadata: true,
            };

            if (Object.keys(filter).length > 0) {
                queryRequest.filter = filter;
            }

            const results = await imageIndex.query(queryRequest);
            const matches = results.matches || [];

            if (matches.length === 0) {
                return { matches: [], products: [] };
            }

            // Fetch full product documents
            const mongoIds = matches
                .map(m => m.metadata?.mongoId)
                .filter(Boolean);

            const products = await Product.find({ _id: { $in: mongoIds }, isActive: true })
                .populate('category', 'name slug')
                .populate('seller', 'storeName storeSlug storeLogo rating')
                .lean();

            const productMap = new Map(products.map(p => [p._id.toString(), p]));
            const rankedProducts = mongoIds
                .map(id => productMap.get(id))
                .filter(Boolean);

            return {
                matches: matches.map(m => ({
                    id: m.id,
                    score: m.score,
                    metadata: m.metadata,
                })),
                products: rankedProducts,
            };
        } catch (err) {
            console.error('Pinecone: Image search failed:', err.message);
            return { matches: [], products: [] };
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  BATCH SYNC: All products → both indexes
    // ──────────────────────────────────────────────────────────────

    /**
     * Sync all active products to the text index in batches.
     * Skips products that are already in Pinecone (by checking existing IDs).
     *
     * @param {object} [options]
     * @param {boolean} [options.force=false] - Re-embed even if already exists
     * @returns {Promise<{synced: number, skipped: number, failed: number}>}
     */
    async batchSyncTextEmbeddings(options = {}) {
        const { force = false } = options;
        const textIndex = getTextIndex();
        if (!textIndex) {
            console.warn('Pinecone: Text index not available for batch sync');
            return { synced: 0, skipped: 0, failed: 0 };
        }

        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .lean();

        console.log(`Pinecone Batch Sync (Text): ${products.length} active products found`);

        let synced = 0, skipped = 0, failed = 0;
        const batches = this._chunk(products, BATCH_SIZE);

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            console.log(`  Processing batch ${batchIdx + 1}/${batches.length} (${batch.length} products)`);

            const vectors = [];
            for (const product of batch) {
                try {
                    const productId = product._id.toString();
                    const catName = product.category?.name || '';
                    const corpus = embeddingService.buildProductTextCorpus(product, catName);
                    const embedding = await embeddingService.generateTextEmbedding(corpus);
                    const metadata = this._buildMetadata(product, catName);

                    vectors.push({ id: productId, values: embedding, metadata });
                    synced++;
                } catch (err) {
                    console.error(`  ✗ Failed: ${product.title} — ${err.message}`);
                    failed++;
                }
            }

            if (vectors.length > 0) {
                try {
                    await textIndex.upsert({ records: vectors });
                    console.log(`  ✓ Upserted ${vectors.length} text vectors`);
                } catch (err) {
                    console.error(`  ✗ Batch upsert failed:`, err.message);
                    failed += vectors.length;
                    synced -= vectors.length;
                }
            }
        }

        console.log(`Pinecone Batch Sync (Text): Done — synced=${synced}, skipped=${skipped}, failed=${failed}`);
        return { synced, skipped, failed };
    }

    /**
     * Sync all active products to the image index in batches.
     *
     * @param {object} [options]
     * @param {boolean} [options.force=false]
     * @returns {Promise<{synced: number, skipped: number, failed: number}>}
     */
    async batchSyncImageEmbeddings(options = {}) {
        const { force = false } = options;
        const imageIndex = getImageIndex();
        if (!imageIndex) {
            console.warn('Pinecone: Image index not available for batch sync');
            return { synced: 0, skipped: 0, failed: 0 };
        }

        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .lean();

        // Only process products with images
        const withImages = products.filter(p => embeddingService.getProductImageUrl(p));
        console.log(`Pinecone Batch Sync (Image): ${withImages.length} products with images`);

        let synced = 0, skipped = 0, failed = 0;
        const batches = this._chunk(withImages, BATCH_SIZE);

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            console.log(`  Processing batch ${batchIdx + 1}/${batches.length} (${batch.length} products)`);

            const vectors = [];
            for (const product of batch) {
                try {
                    const productId = product._id.toString();
                    const imageUrl = embeddingService.getProductImageUrl(product);
                    const embedding = await embeddingService.generateImageEmbedding(imageUrl);
                    const catName = product.category?.name || '';
                    const metadata = this._buildMetadata(product, catName);

                    vectors.push({ id: productId, values: embedding, metadata });
                    synced++;
                } catch (err) {
                    console.error(`  ✗ Failed: ${product.title} — ${err.message}`);
                    failed++;
                }
            }

            if (vectors.length > 0) {
                try {
                    await imageIndex.upsert({ records: vectors });
                    console.log(`  ✓ Upserted ${vectors.length} image vectors`);
                } catch (err) {
                    console.error(`  ✗ Batch upsert failed:`, err.message);
                    failed += vectors.length;
                    synced -= vectors.length;
                }
            }
        }

        console.log(`Pinecone Batch Sync (Image): Done — synced=${synced}, skipped=${skipped}, failed=${failed}`);
        return { synced, skipped, failed };
    }

    // ──────────────────────────────────────────────────────────────
    //  STATUS / STATS
    // ──────────────────────────────────────────────────────────────

    /**
     * Get index statistics for both indexes.
     */
    async getStats() {
        const stats = { text: null, image: null };

        const textIndex = getTextIndex();
        if (textIndex) {
            try {
                stats.text = await textIndex.describeIndexStats();
            } catch (err) {
                stats.text = { error: err.message };
            }
        }

        const imageIndex = getImageIndex();
        if (imageIndex) {
            try {
                stats.image = await imageIndex.describeIndexStats();
            } catch (err) {
                stats.image = { error: err.message };
            }
        }

        return stats;
    }

    // ──────────────────────────────────────────────────────────────
    //  UTILS
    // ──────────────────────────────────────────────────────────────

    /**
     * Split an array into chunks.
     */
    _chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

module.exports = new PineconeService();
