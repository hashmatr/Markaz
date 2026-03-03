/**
 * EmbeddingService
 * ────────────────
 * Generates text & image embeddings for Pinecone vector search.
 *
 * Text  : @xenova/transformers  →  BAAI/bge-large-en-v1.5  →  1024-dim
 * Image : @xenova/transformers  →  openai/clip-vit-base-patch32  →  512-dim
 *
 * Both models are loaded lazily (singleton) and cached for the process lifetime.
 */

const { pipeline, env } = require('@xenova/transformers');

// Use remote models from HuggingFace (no local cache issues on Windows)
env.allowLocalModels = false;

class EmbeddingService {
    constructor() {
        this._textPipeline = null;
        this._imagePipeline = null;
        this._textLoading = null;
        this._imageLoading = null;
    }

    // ──────────────────────────────────────────────────────────────
    //  TEXT EMBEDDINGS  (1024-dim via BGE-large)
    // ──────────────────────────────────────────────────────────────

    /**
     * Lazily load the text embedding pipeline (singleton).
     */
    async _getTextPipeline() {
        if (this._textPipeline) return this._textPipeline;
        if (this._textLoading) return this._textLoading;

        this._textLoading = (async () => {
            console.log('EmbeddingService: Loading text model (bge-large-en-v1.5)...');
            this._textPipeline = await pipeline(
                'feature-extraction',
                'Xenova/bge-large-en-v1.5',
                { quantized: true }
            );
            console.log('✅ EmbeddingService: Text model loaded (1024-dim)');
            return this._textPipeline;
        })();

        return this._textLoading;
    }

    /**
     * Generate a 1024-dim text embedding from a string.
     * Prepends "Represent this sentence: " for BGE models (improves retrieval quality).
     *
     * @param {string} text - The text to embed
     * @returns {Promise<number[]>} 1024-dimensional embedding
     */
    async generateTextEmbedding(text) {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            throw new Error('EmbeddingService: text is required for text embedding');
        }

        const pipe = await this._getTextPipeline();
        const prefixed = `Represent this sentence: ${text.trim().substring(0, 2000)}`;
        const output = await pipe(prefixed, { pooling: 'cls', normalize: true });
        return Array.from(output.data);
    }

    /**
     * Batch-generate text embeddings.
     * Processes sequentially to avoid OOM on large batches.
     *
     * @param {string[]} texts
     * @returns {Promise<number[][]>}
     */
    async generateTextEmbeddingsBatch(texts) {
        const results = [];
        for (const text of texts) {
            try {
                const embedding = await this.generateTextEmbedding(text);
                results.push(embedding);
            } catch (err) {
                console.error(`EmbeddingService: Failed to embed text: "${text.substring(0, 60)}..."`, err.message);
                results.push(null);
            }
        }
        return results;
    }

    // ──────────────────────────────────────────────────────────────
    //  IMAGE EMBEDDINGS  (512-dim via CLIP ViT-B/32)
    // ──────────────────────────────────────────────────────────────

    /**
     * Lazily load the CLIP image embedding pipeline (singleton).
     */
    async _getImagePipeline() {
        if (this._imagePipeline) return this._imagePipeline;
        if (this._imageLoading) return this._imageLoading;

        this._imageLoading = (async () => {
            console.log('EmbeddingService: Loading CLIP model (clip-vit-base-patch32)...');
            this._imagePipeline = await pipeline(
                'image-feature-extraction',
                'Xenova/clip-vit-base-patch32',
                { quantized: true }
            );
            console.log('✅ EmbeddingService: CLIP model loaded (512-dim)');
            return this._imagePipeline;
        })();

        return this._imageLoading;
    }

    /**
     * Generate a 512-dim CLIP embedding from an image.
     *
     * Accepts:
     * - URL string (http/https) — fetched by the pipeline
     * - Buffer — decoded via sharp into RawImage pixels
     * - data:... URL — decoded from base64 via sharp into RawImage pixels
     *
     * @param {string|Buffer} imageInput - URL string or image Buffer
     * @returns {Promise<number[]>} 512-dimensional embedding
     */
    async generateImageEmbedding(imageInput) {
        if (!imageInput) {
            throw new Error('EmbeddingService: imageInput is required for image embedding');
        }

        const pipe = await this._getImagePipeline();

        // Determine the appropriate input for the pipeline
        let pipelineInput;

        if (Buffer.isBuffer(imageInput)) {
            // Buffer from multer upload — convert via sharp to RawImage
            pipelineInput = await this._bufferToRawImage(imageInput);
        } else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
            // data:image/...;base64,... — extract base64 and decode
            const base64Data = imageInput.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            pipelineInput = await this._bufferToRawImage(buffer);
        } else if (typeof imageInput === 'string') {
            // Regular URL — the pipeline can fetch it directly
            pipelineInput = imageInput;
        } else {
            throw new Error('EmbeddingService: unsupported image input type');
        }

        const output = await pipe(pipelineInput);

        // The output shape is [1, 512] — extract the first (only) embedding
        const embedding = Array.from(output.data).slice(0, 512);

        // L2-normalize
        const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= norm;
            }
        }
        return embedding;
    }

    /**
     * Convert an image Buffer to a RawImage compatible with @xenova/transformers.
     * Uses sharp to decode and extract raw pixel data.
     *
     * @param {Buffer} buffer
     * @returns {Promise<object>} RawImage-compatible object
     * @private
     */
    async _bufferToRawImage(buffer) {
        const sharp = require('sharp');
        const { RawImage } = require('@xenova/transformers');

        const image = sharp(buffer);
        const { data, info } = await image
            .removeAlpha()    // Ensure RGB (3 channels)
            .raw()
            .toBuffer({ resolveWithObject: true });

        return new RawImage(
            new Uint8ClampedArray(data),
            info.width,
            info.height,
            info.channels      // 3 (RGB)
        );
    }

    /**
     * Batch-generate CLIP embeddings from image URLs.
     * Processes sequentially (CLIP is memory-heavy).
     *
     * @param {string[]} imageUrls
     * @returns {Promise<number[][]>}
     */
    async generateImageEmbeddingsBatch(imageUrls) {
        const results = [];
        for (const url of imageUrls) {
            try {
                const embedding = await this.generateImageEmbedding(url);
                results.push(embedding);
            } catch (err) {
                console.error(`EmbeddingService: Failed to embed image: ${url}`, err.message);
                results.push(null);
            }
        }
        return results;
    }

    // ──────────────────────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────────────────────

    /**
     * Build the text corpus for a product (title + description + category).
     * Used for both indexing and deduplication checks.
     *
     * @param {object} product - Mongoose product document
     * @param {string} [categoryName] - Optional pre-resolved category name
     * @returns {string}
     */
    buildProductTextCorpus(product, categoryName = '') {
        const parts = [];
        if (product.title) parts.push(product.title);
        if (product.description) parts.push(product.description);

        const catName = categoryName ||
            (product.category && typeof product.category === 'object' ? product.category.name : '') ||
            '';
        if (catName) parts.push(catName);

        if (product.brand) parts.push(product.brand);
        if (product.tags && product.tags.length > 0) parts.push(product.tags.join(' '));

        return parts.join(' ').trim();
    }

    /**
     * Get the primary image URL from a product.
     *
     * @param {object} product
     * @returns {string|null}
     */
    getProductImageUrl(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].url || null;
        }
        return null;
    }
}

module.exports = new EmbeddingService();
