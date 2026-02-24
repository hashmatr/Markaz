const Groq = require('groq-sdk');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');

class ChatbotService {
    constructor() {
        this.client = null;
        this.conversations = new Map(); // sessionId -> chat history
        this._init();
    }

    _init() {
        const groqKey = process.env.Groq_Api || process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (groqKey) {
            this.client = new Groq({ apiKey: groqKey });
            this.aiProvider = 'groq';
            console.log('ChatbotService: Groq AI initialized successfully.');
        } else if (geminiKey) {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            this.genAI = new GoogleGenerativeAI(geminiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            this.aiProvider = 'gemini';
            console.log('ChatbotService: Gemini AI initialized successfully.');
        } else {
            console.warn('ChatbotService: No AI API key found. Chatbot will use fallback mode.');
        }
    }

    async _buildSystemPrompt(productContext = '') {
        // Fetch real categories to prevent hallucinations
        const categories = await Category.find({ isActive: true }).select('name').lean();
        const categoryList = categories.map(c => c.name).join(', ');

        return `You are "Markaz Assistant", a friendly AI shopping assistant for Markaz.

CRITICAL SAFETY RULES (ZERO HALLUCINATION & STRICT RELEVANCE POLICY):
1. **ONLY talk about products listed in the "REAL DATABASE PRODUCTS" section below.**
2. **STRICT TYPE MATCHING**: If user asks for "parts", DO NOT suggest the vehicle. If user asks for "clothes", DO NOT suggest perfumes or bags.
3. **If a product is NOT in that list, IT DOES NOT EXIST in our store.** 
4. **NEVER suggest famous brands like Samsung, Apple, iPhone, or Nike unless they are explicitly in the list below.**
5. If the user asks for something we don't have, OR if we only have "related" items but not the exact item type, say: "I couldn't find an exact match for [item type] in our current inventory. I see some related items, but I am restricted to suggesting only exact matches to ensure your satisfaction."
6. NEVER use placeholder IDs or links. Only use IDs from the provided list.

YOUR PERSONALITY:
- Helpful, professional, and honest.
- If we don't have a product, be honest about it. Don't try to be "too helpful" by inventing items.

AVAILABLE STORE CATEGORIES:
${categoryList}

REAL DATABASE PRODUCTS FOR THIS QUERY:
${productContext || 'NO PRODUCTS FOUND. DO NOT SUGGEST ANY SPECIFIC PRODUCTS.'}`;
    }

    _extractSearchTerms(query) {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'show', 'find', 'want', 'need', 'me', 'my', 'i', 'looking', 'for', 'best', 'give', 'suggest', 'recommend']);
        const cleaned = query.toLowerCase().replace(/[?!.,;:/]/g, ' ').trim();
        return cleaned.split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));
    }

    async _searchProducts(query) {
        try {
            const rawTerms = this._extractSearchTerms(query);
            if (rawTerms.length === 0) {
                return await Product.find({ isActive: true, isFeatured: true }).limit(5).lean();
            }

            // Search logic: try to find exact title matches first, then broad search
            let products = await Product.find({
                isActive: true,
                $or: [
                    { title: { $regex: rawTerms.join('|'), $options: 'i' } },
                    { brand: { $regex: rawTerms.join('|'), $options: 'i' } },
                    { tags: { $in: rawTerms.map(t => new RegExp(t, 'i')) } }
                ]
            })
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .limit(15)
                .lean();

            // If still no products, try a very broad category search
            if (products.length === 0) {
                const matchedCats = await Category.find({ name: { $regex: rawTerms.join('|'), $options: 'i' } }).select('_id');
                if (matchedCats.length > 0) {
                    products = await Product.find({ category: { $in: matchedCats.map(c => c._id) }, isActive: true })
                        .populate('category', 'name')
                        .populate('seller', 'storeName')
                        .limit(10)
                        .lean();
                }
            }

            return products;
        } catch (err) {
            console.error('ChatbotService Search Error:', err.message);
            return [];
        }
    }

    _formatProductContext(products) {
        if (!products || products.length === 0) return '';
        return products.map((p, i) =>
            `MATCH ${i + 1}:\n- NAME: ${p.title}\n- PRICE: Rs.${p.price}\n- ID: ${p._id}\n- BRAND: ${p.brand || 'N/A'}\n- CATEGORY: ${p.category?.name || 'N/A'}`
        ).join('\n\n');
    }

    async chat(sessionId, userMessage) {
        const products = await this._searchProducts(userMessage);
        const productContext = this._formatProductContext(products);
        const systemPrompt = await this._buildSystemPrompt(productContext);

        if (this.aiProvider === 'groq') {
            try {
                let history = this.conversations.get(sessionId) || [];
                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
                    { role: 'user', content: userMessage }
                ];

                const completion = await this.client.chat.completions.create({
                    messages,
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.1, // Set temperature very low to prevent creativity/hallucination
                });

                const aiResponse = completion.choices[0].message.content;

                history.push({ role: 'user', text: userMessage });
                history.push({ role: 'assistant', text: aiResponse });
                if (history.length > 20) history = history.slice(-20);
                this.conversations.set(sessionId, history);

                return {
                    message: aiResponse,
                    products: products.length > 0 ? this._formatProductCards(products) : undefined
                };
            } catch (err) {
                console.error('ChatbotService Groq Error:', err.message);
                return this._fallbackResponse(userMessage, products);
            }
        }

        // Gemini Logic
        if (this.aiProvider === 'gemini') {
            try {
                let history = this.conversations.get(sessionId) || [];
                const chat = this.model.startChat({
                    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
                    systemInstruction: systemPrompt,
                });
                const result = await chat.sendMessage(userMessage);
                const aiResponse = result.response.text();
                history.push({ role: 'user', text: userMessage });
                history.push({ role: 'model', text: aiResponse });
                this.conversations.set(sessionId, history);
                return { message: aiResponse, products: this._formatProductCards(products) };
            } catch (err) {
                return this._fallbackResponse(userMessage, products);
            }
        }

        return this._fallbackResponse(userMessage, products);
    }

    _formatProductCards(products) {
        return products.slice(0, 5).map(p => ({
            _id: p._id,
            title: p.title,
            price: p.price,
            discountedPrice: p.discountedPrice,
            image: p.images?.[0]?.url || null,
            rating: p.rating,
            seller: p.seller?.storeName || null,
        }));
    }

    _fallbackResponse(message, products) {
        if (products.length > 0) {
            return {
                message: "I couldn't find an exact match for your query, but here are some items you might be interested in from our store:",
                products: this._formatProductCards(products)
            };
        }
        return {
            message: "I'm sorry, I couldn't find any products in our store matching that description. Could you try searching for a category or a different keyword?",
            products: undefined
        };
    }
}

module.exports = new ChatbotService();
