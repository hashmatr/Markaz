const Groq = require('groq-sdk');
const Product = require('../Modal/Product');
const embeddingService = require('./embeddingService');

class GroqSearchService {
    constructor() {
        this.groq = null;
        const apiKey = process.env.Groq_Api || process.env.GROQ_API_KEY;
        if (apiKey) {
            this.groq = new Groq({ apiKey });
        }
    }

    /**
     * THE PERFECT RAG SEARCH:
     * 1. Pinecone Vector Search (finds semantic matches)
     * 2. MongoDB Fetch (gets full data)
     * 3. Groq LLM Ranking (picks the best)
     */
    async hybridSearch(query, filters = {}) {
        if (!this.groq) return null;

        console.log(`GroqSearch: Starting AI search for "${query}"`);

        let candidates = [];

        try {
            // 1. Try Vector Search first (The "RAG" way)
            if (embeddingService.isAvailable()) {
                const vectorMatches = await embeddingService.searchSimilar(query, 20);
                if (vectorMatches && vectorMatches.length > 0) {
                    const productIds = vectorMatches.map(m => m.productId);
                    candidates = await Product.find({ _id: { $in: productIds }, isActive: true })
                        .populate('category', 'name')
                        .populate('seller', 'storeName')
                        .lean();
                    console.log(`GroqSearch: Found ${candidates.length} candidates via Vector Search`);
                }
            }
        } catch (err) {
            console.warn('GroqSearch: Vector search failed, falling back to MongoDB:', err.message);
        }

        // 2. Fallback to MongoDB Text Search if Pinecone is empty or failed
        if (candidates.length === 0) {
            candidates = await Product.find({
                isActive: true,
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { brand: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ]
            })
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .limit(30)
                .lean();
            console.log(`GroqSearch: Found ${candidates.length} candidates via MongoDB fallback`);
        }

        if (candidates.length === 0) return { products: [], aiSummary: "No matches found." };

        // 3. Use Groq to rank and explain
        const productContext = candidates.map((p, i) =>
            `MATCH ${i}: [${p.title}] | Price: Rs.${p.price} | ID: ${p._id} | Brand: ${p.brand}`
        ).join('\n');

        const completion = await this.groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a Strict Product Matcher. Your goal is to filtered candidates for EXACT relevance.

STRICT RULES:
1. If user ask for "parts/accessories", EXCLUDE the main vehicle or device.
2. If user ask for "clothes/garments", EXCLUDE perfumes, bags, or unrelated accessories.
3. If a candidate is only "related" but not the "exact type" of item requested, EXCLUDE IT.
4. If no candidates are exactly what was asked for, return "rankedIds": [].

Return a JSON object with: 1) "rankedIds": an array of IDs for products that match the EXACT TYPE requested. 2) "aiSummary": a short explanation.`
                },
                {
                    role: 'user',
                    content: `User wants the exact type of item: "${query}"\n\nCandidates:\n${productContext}\n\nReturn JSON only.`
                }
            ],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // 4. Sort candidates based on Groq's ranking
        const rankedProducts = (result.rankedIds || [])
            .map(id => candidates.find(p => p._id.toString() === id.toString()))
            .filter(Boolean);

        return {
            products: rankedProducts, // Return ONLY what Groq approved
            aiSummary: rankedProducts.length > 0 ? result.aiSummary : "I couldn't find any products that exactly match your description in our current inventory."
        };
    }
}

module.exports = new GroqSearchService();
