const { AutoTokenizer, CLIPTextModelWithProjection, AutoProcessor, CLIPVisionModelWithProjection, RawImage } = require('@xenova/transformers');
const Product = require('../Modal/Product');
const ProductEmbedding = require('../Modal/ProductEmbedding');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

class VisualSearchService {
    constructor() {
        this.textModel = null;
        this.textTokenizer = null;
        this.visionModel = null;
        this.visionProcessor = null;
        this.modelName = 'Xenova/clip-vit-base-patch32';
        this._initPromise = null;
    }

    async _init() {
        if (this.textModel && this.visionModel) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            try {
                console.log(`VisualSearch: Loading CLIP model (${this.modelName})...`);

                // Load CLIP text encoder + tokenizer
                this.textTokenizer = await AutoTokenizer.from_pretrained(this.modelName);
                this.textModel = await CLIPTextModelWithProjection.from_pretrained(this.modelName);

                // Load CLIP vision encoder + processor
                this.visionProcessor = await AutoProcessor.from_pretrained(this.modelName);
                this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(this.modelName);

                console.log('VisualSearch: CLIP model loaded successfully!');
            } catch (err) {
                console.error('VisualSearch: Failed to load CLIP model:', err.message);
                this.textModel = null;
                this.visionModel = null;
            }
        })();

        return this._initPromise;
    }

    /**
     * Download image from URL and return as Buffer
     */
    _downloadImage(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const request = protocol.get(url, { timeout: 15000 }, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    return this._downloadImage(response.headers.location).then(resolve).catch(reject);
                }
                if (response.statusCode !== 200) {
                    return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                }
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            });
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timed out'));
            });
        });
    }

    /**
     * Generate CLIP IMAGE embedding from a buffer
     */
    async generateImageEmbedding(imageBuffer) {
        await this._init();
        if (!this.visionModel) throw new Error('CLIP vision model not loaded');

        let tempPath = null;
        try {
            // Write to temp file for reliable RawImage loading
            tempPath = path.join(os.tmpdir(), `vs_${Date.now()}.png`);
            fs.writeFileSync(tempPath, imageBuffer);

            const image = await RawImage.read(tempPath);
            const imageInputs = await this.visionProcessor(image);
            const { image_embeds } = await this.visionModel(imageInputs);
            const vector = Array.from(image_embeds.data);

            if (!vector || vector.length === 0) throw new Error('Empty image embedding');
            return this._normalize(vector);
        } catch (err) {
            console.error('VisualSearch: Image embedding error:', err.message);
            throw err;
        } finally {
            if (tempPath && fs.existsSync(tempPath)) {
                try { fs.unlinkSync(tempPath); } catch (_) { }
            }
        }
    }

    /**
     * Generate CLIP TEXT embedding for product description
     */
    async generateTextEmbedding(text) {
        await this._init();
        if (!this.textModel) throw new Error('CLIP text model not loaded');

        try {
            const textInputs = this.textTokenizer(text, { padding: true, truncation: true });
            const { text_embeds } = await this.textModel(textInputs);
            const vector = Array.from(text_embeds.data);

            if (!vector || vector.length === 0) throw new Error('Empty text embedding');
            return this._normalize(vector);
        } catch (err) {
            console.error('VisualSearch: Text embedding error:', err.message);
            throw err;
        }
    }

    /**
     * L2-normalize a vector
     */
    _normalize(vec) {
        let norm = 0;
        for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
        norm = Math.sqrt(norm);
        if (norm === 0) return vec;
        return vec.map(v => v / norm);
    }

    /**
     * Build descriptive text for a product (for CLIP text embeddings)
     */
    _buildProductText(product) {
        const parts = [];
        if (product.title) parts.push(product.title);
        if (product.brand) parts.push(`by ${product.brand}`);
        if (product.category?.name) parts.push(product.category.name);
        if (product.description) parts.push(product.description.substring(0, 200));
        if (product.tags?.length > 0) parts.push(product.tags.join(', '));
        // CLIP has a 77-token limit, so keep it short
        return parts.join('. ').substring(0, 300);
    }

    /**
     * Cosine similarity between two vectors
     */
    _cosineSimilarity(a, b) {
        if (a.length !== b.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Search products by image similarity
     */
    async searchByImage(imageBuffer, topK = 12) {
        console.log('VisualSearch: Starting image search...');

        // 1. Generate CLIP embedding for the uploaded image
        const queryEmbedding = await this.generateImageEmbedding(imageBuffer);
        console.log(`VisualSearch: Generated query embedding (${queryEmbedding.length} dims)`);

        // 2. Fetch all stored product embeddings from MongoDB
        const storedEmbeddings = await ProductEmbedding.find({}).lean();

        if (storedEmbeddings.length === 0) {
            console.warn('VisualSearch: No product embeddings found. Run sync first.');
            return { products: [], message: 'Visual search index is empty. Please sync product embeddings first.' };
        }

        console.log(`VisualSearch: Comparing against ${storedEmbeddings.length} product embeddings...`);

        // 3. Calculate similarity scores
        const scored = storedEmbeddings.map((item) => ({
            productId: item.productId,
            score: this._cosineSimilarity(queryEmbedding, item.embedding),
        }));

        // 4. Sort by score (descending) and take top K
        scored.sort((a, b) => b.score - a.score);
        const topResults = scored.slice(0, topK);

        // 5. Filter results with minimum similarity threshold
        const MIN_SCORE = 0.15;
        const filtered = topResults.filter(r => r.score >= MIN_SCORE);

        if (filtered.length === 0) {
            return { products: [], message: 'No visually similar products found. Try a different image.' };
        }

        // 6. Fetch full product data
        const productIds = filtered.map(r => r.productId);
        const products = await Product.find({ _id: { $in: productIds }, isActive: true })
            .populate('category', 'name')
            .populate('seller', 'storeName')
            .lean();

        // 7. Maintain score order
        const productMap = {};
        products.forEach(p => { productMap[p._id.toString()] = p; });

        const rankedProducts = filtered
            .map(r => {
                const product = productMap[r.productId.toString()];
                if (!product) return null;
                return {
                    ...product,
                    similarityScore: Math.round(r.score * 100),
                };
            })
            .filter(Boolean);

        console.log(`VisualSearch: Found ${rankedProducts.length} matching products`);

        return {
            products: rankedProducts,
            message: `Found ${rankedProducts.length} visually similar product${rankedProducts.length === 1 ? '' : 's'}`,
        };
    }

    /**
     * Sync a single product's CLIP embedding to MongoDB.
     * Uses TEXT embedding by default (fast — no image download needed).
     * CLIP's cross-modal design allows comparing image queries against text embeddings.
     */
    async syncProductEmbedding(product, downloadImages = false) {
        try {
            const imageUrl = product.images?.[0]?.url || '';

            // Generate CLIP text embedding from product title + description
            const productText = this._buildProductText(product);
            const textEmbedding = await this.generateTextEmbedding(productText);

            let finalEmbedding = textEmbedding;
            let embeddingType = 'text';

            // Optionally download and embed the actual product image
            if (downloadImages && imageUrl) {
                try {
                    const imageBuffer = await this._downloadImage(imageUrl);
                    finalEmbedding = await this.generateImageEmbedding(imageBuffer);
                    embeddingType = 'image';
                } catch (imgErr) {
                    // Fall back to text embedding silently
                }
            }

            await ProductEmbedding.findOneAndUpdate(
                { productId: product._id },
                {
                    productId: product._id,
                    embedding: finalEmbedding,
                    embeddingType,
                    imageUrl,
                    updatedAt: new Date(),
                },
                { upsert: true, new: true }
            );

            return true;
        } catch (err) {
            console.error(`VisualSearch: Failed to sync ${product.title}:`, err.message);
            return false;
        }
    }

    /**
     * Batch sync all products
     */
    async syncAllProducts() {
        await this._init();

        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .lean();

        console.log(`VisualSearch: Starting batch sync of ${products.length} products...`);
        let success = 0;
        let failed = 0;

        for (let i = 0; i < products.length; i++) {
            const result = await this.syncProductEmbedding(products[i]);
            if (result) {
                success++;
            } else {
                failed++;
            }

            // Progress logging every 10 products
            if ((i + 1) % 10 === 0) {
                console.log(`VisualSearch: Progress ${i + 1}/${products.length} (${success} synced, ${failed} failed)`);
            }
        }

        console.log(`VisualSearch: Sync complete! ${success}/${products.length} products synced.`);
        return { total: products.length, synced: success, failed };
    }

    /**
     * Get sync status
     */
    async getSyncStatus() {
        const totalProducts = await Product.countDocuments({ isActive: true });
        const syncedProducts = await ProductEmbedding.countDocuments({});
        return {
            totalProducts,
            syncedProducts,
            percentage: totalProducts > 0 ? Math.round((syncedProducts / totalProducts) * 100) : 0,
            isReady: syncedProducts > 0,
        };
    }

    isAvailable() {
        return !!(this.textModel || this._initPromise);
    }
}

module.exports = new VisualSearchService();
