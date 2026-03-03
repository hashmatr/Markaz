const mongoose = require('mongoose');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');

/**
 * GroqSearchService (simplified — Groq LLM re-ranking retained, Pinecone/embeddings removed)
 *
 * Flow:
 * 1. MongoDB text/regex search to build candidates
 * 2. Optional Groq LLM ranking to pick the most relevant results
 */
const Groq = require('groq-sdk');

class GroqSearchService {
    constructor() {
        this.groq = null;
        const apiKey = process.env.Groq_Api || process.env.GROQ_API_KEY;
        if (apiKey) {
            this.groq = new Groq({ apiKey });
        }
    }

    /**
     * MongoDB-first search with optional Groq LLM ranking.
     * Replaces the old Pinecone vector search + Groq pipeline.
     */
    async hybridSearch(query, filters = {}) {
        if (!this.groq) return null;

        const { category, categoryIds, brand, color, size, minPrice, maxPrice, seller, gender, categoryName } = filters;

        let effectiveQuery = query;
        if (!effectiveQuery && categoryName) effectiveQuery = categoryName;
        if (!effectiveQuery && !filters.category) return null;

        console.log(`GroqSearch: Starting MongoDB search for "${effectiveQuery}" with filters: category=${category}`);

        // ── Build MongoDB filter ──────────────────────────────────────────
        const baseFilter = { isActive: true };

        if (categoryIds && categoryIds.length > 0) {
            const objectIds = categoryIds
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            if (objectIds.length > 0) baseFilter.category = { $in: objectIds };
        } else if (category && mongoose.Types.ObjectId.isValid(category)) {
            baseFilter.category = new mongoose.Types.ObjectId(category);
        }

        if (brand) baseFilter.brand = { $regex: brand, $options: 'i' };
        if (color) baseFilter.color = { $regex: color, $options: 'i' };
        if (size) baseFilter['sizes.name'] = { $regex: size, $options: 'i' };
        if (minPrice || maxPrice) {
            baseFilter.discountedPrice = {};
            if (minPrice) baseFilter.discountedPrice.$gte = parseFloat(minPrice);
            if (maxPrice) baseFilter.discountedPrice.$lte = parseFloat(maxPrice);
        }
        if (seller && mongoose.Types.ObjectId.isValid(seller)) {
            baseFilter.seller = new mongoose.Types.ObjectId(seller);
        }

        // Gender filter
        if (gender === 'men') {
            baseFilter.title = { $not: { $regex: 'women|girl|lady', $options: 'i' } };
        } else if (gender === 'women') {
            baseFilter.title = { $not: { $regex: '\\bmen\\b|\\bboy\\b|\\bguy\\b', $options: 'i' } };
        }

        // ── MongoDB text search ────────────────────────────────────────────
        let candidates = [];

        if (effectiveQuery) {
            const searchFilter = {
                ...baseFilter,
                $or: [
                    { title: { $regex: effectiveQuery, $options: 'i' } },
                    { brand: { $regex: effectiveQuery, $options: 'i' } },
                    { description: { $regex: effectiveQuery, $options: 'i' } },
                    { tags: { $regex: effectiveQuery, $options: 'i' } },
                ],
            };
            candidates = await Product.find(searchFilter)
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .limit(60)
                .lean();
            console.log(`GroqSearch: MongoDB found ${candidates.length} candidates for query "${effectiveQuery}"`);
        }

        // If no query but category, just use the base category filter
        if (candidates.length === 0 && baseFilter.category) {
            candidates = await Product.find(baseFilter)
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .limit(60)
                .lean();
            console.log(`GroqSearch: MongoDB (category-only) found ${candidates.length} candidates`);
        }

        if (candidates.length === 0) {
            console.log('GroqSearch: No candidates found.');
            return { products: [], aiSummary: null };
        }

        // ── Groq LLM Ranking ─────────────────────────────────────────────
        const productContext = candidates.slice(0, 40).map((p, i) =>
            `${i}: [${p.title}] | Rs.${p.price} | ID: ${p._id} | Cat: ${p.category?.name || 'N/A'}`
        ).join('\n');

        const categoryContext = categoryName || effectiveQuery || 'general';

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are a product relevance ranker for an e-commerce store. Given a list of product candidates, return ONLY those that are genuinely relevant to the user's search context.

CRITICAL RULES:
1. RELEVANCE IS KEY: Only include products that a real shopper would expect to find when browsing "${categoryContext}".
2. Return between 5-20 product IDs ranked by relevance. Quality over quantity.
3. GENDER: If context mentions "men" — exclude women's items. If "women" — exclude men's items.
4. Return ONLY valid IDs from the candidate list.

Return JSON: { "rankedIds": ["id1", "id2", ...] }`
                    },
                    {
                        role: 'user',
                        content: `User is browsing: "${categoryContext}"\n${effectiveQuery && effectiveQuery !== categoryContext ? `Search query: "${effectiveQuery}"` : ''}\n\nCandidates:\n${productContext}\n\nReturn JSON only.`
                    }
                ],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(completion.choices[0].message.content);
            console.log(`GroqSearch: Groq ranked ${(result.rankedIds || []).length} products from ${candidates.length} candidates.`);

            const seenIds = new Set();
            const uniqueRankedIds = (result.rankedIds || []).filter(id => {
                const idStr = id.toString();
                if (seenIds.has(idStr)) return false;
                seenIds.add(idStr);
                return true;
            });

            const rankedProducts = uniqueRankedIds
                .map(id => candidates.find(p => p._id.toString() === id.toString()))
                .filter(Boolean);

            if (rankedProducts.length === 0 && candidates.length > 0) {
                console.warn(`GroqSearch: Groq returned 0 rankings. Returning raw MongoDB candidates.`);
                return { products: candidates, aiSummary: null };
            }

            return { products: rankedProducts, aiSummary: result.aiSummary || null };

        } catch (groqErr) {
            console.error('GroqSearch: LLM ranking failed, returning MongoDB candidates:', groqErr.message);
            return { products: candidates, aiSummary: null };
        }
    }
}

module.exports = new GroqSearchService();
