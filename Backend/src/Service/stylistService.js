const Groq = require('groq-sdk');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');
const BrowsingHistory = require('../Modal/BrowsingHistory');
const Order = require('../Modal/Order');
const embeddingService = require('./embeddingService');

class StylistService {
    constructor() {
        this.client = null;
        this.conversations = new Map(); // sessionId -> chat history
        this._init();
    }

    _init() {
        const groqKey = process.env.Groq_Api || process.env.GROQ_API_KEY;
        if (groqKey) {
            this.client = new Groq({ apiKey: groqKey });
            console.log('StylistService: Groq AI Personal Shopper initialized.');
        } else {
            console.warn('StylistService: No Groq API key found. Stylist will use fallback mode.');
        }
    }

    // ─────────────────────────────────────────────────────────
    //  RECORD A PRODUCT VIEW  
    // ─────────────────────────────────────────────────────────
    async recordView(userId, productId) {
        try {
            const product = await Product.findById(productId)
                .populate('category', 'name')
                .lean();

            if (!product) return null;

            const priceRange = BrowsingHistory.classifyPrice(product.discountedPrice || product.price);

            // Upsert: increment viewCount if already viewed
            const entry = await BrowsingHistory.findOneAndUpdate(
                { user: userId, product: productId },
                {
                    $set: {
                        category: product.category?._id,
                        brand: product.brand || '',
                        priceRange,
                        tags: product.tags || [],
                        lastViewedAt: new Date(),
                    },
                    $inc: { viewCount: 1 },
                },
                { upsert: true, new: true }
            );

            return entry;
        } catch (err) {
            console.error('StylistService: Error recording view:', err.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────
    //  BUILD USER TASTE PROFILE
    //  Aggregates browsing history into a structured profile
    // ─────────────────────────────────────────────────────────
    async buildUserProfile(userId) {
        try {
            // 1. Get recent browsing history (last 50 views)
            const history = await BrowsingHistory.find({ user: userId })
                .sort({ lastViewedAt: -1 })
                .limit(50)
                .populate('product', 'title brand price discountedPrice images category')
                .populate('category', 'name')
                .lean();

            if (history.length === 0) return null;

            // 2. Aggregate category preferences (weighted by viewCount & recency)
            const categoryMap = {};
            const brandMap = {};
            const priceRangeMap = {};
            const tagMap = {};

            history.forEach((entry, index) => {
                // Recency weight: most recent views count more
                const recencyWeight = 1 + (0.5 * (1 - index / history.length));
                const weight = entry.viewCount * recencyWeight;

                // Category
                const catName = entry.category?.name || 'Unknown';
                categoryMap[catName] = (categoryMap[catName] || 0) + weight;

                // Brand
                if (entry.brand) {
                    brandMap[entry.brand] = (brandMap[entry.brand] || 0) + weight;
                }

                // Price range
                priceRangeMap[entry.priceRange] = (priceRangeMap[entry.priceRange] || 0) + weight;

                // Tags
                (entry.tags || []).forEach(tag => {
                    tagMap[tag] = (tagMap[tag] || 0) + weight;
                });
            });

            // 3. Sort and extract top preferences
            const sortByWeight = (map) =>
                Object.entries(map).sort((a, b) => b[1] - a[1]);

            const topCategories = sortByWeight(categoryMap).slice(0, 5);
            const topBrands = sortByWeight(brandMap).slice(0, 5);
            const topPriceRange = sortByWeight(priceRangeMap)[0]?.[0] || 'mid';
            const topTags = sortByWeight(tagMap).slice(0, 10);

            // 4. Get recently viewed product titles
            const recentProducts = history.slice(0, 10).map(h => ({
                title: h.product?.title || 'Unknown',
                brand: h.product?.brand || '',
                category: h.category?.name || '',
                viewCount: h.viewCount,
            }));

            // 5. Get purchase history for deeper insights
            let purchasedCategories = [];
            try {
                const orders = await Order.find({ user: userId })
                    .populate({ path: 'orderItems.product', select: 'category brand title' })
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean();

                const purchasedProducts = orders.flatMap(o =>
                    o.orderItems.map(item => item.product).filter(Boolean)
                );

                purchasedCategories = [...new Set(
                    purchasedProducts.map(p => p.category?.toString()).filter(Boolean)
                )];
            } catch {
                // Orders might fail if user has none
            }

            return {
                totalViews: history.length,
                topCategories,
                topBrands,
                preferredPriceRange: topPriceRange,
                topTags,
                recentProducts,
                purchasedCategories,
            };
        } catch (err) {
            console.error('StylistService: Error building profile:', err.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────
    //  GET PERSONALIZED RECOMMENDATIONS
    //  Multi-signal scoring: category affinity, brand affinity,
    //  price range match, tag overlap, vector similarity
    // ─────────────────────────────────────────────────────────
    async getRecommendations(userId, limit = 12) {
        try {
            const profile = await this.buildUserProfile(userId);
            if (!profile) return { products: [], message: 'Start browsing to get personalized recommendations!' };

            // 1. Get candidate products (exclude already-viewed products)
            const viewedProductIds = (
                await BrowsingHistory.find({ user: userId }).select('product').lean()
            ).map(h => h.product);

            // Build a query from the user's preferences
            const categoryNames = profile.topCategories.map(([name]) => name);
            const categoryDocs = await Category.find({ name: { $in: categoryNames } }).select('_id').lean();
            const categoryIds = categoryDocs.map(c => c._id);

            const brandNames = profile.topBrands.map(([name]) => name);
            const topTagNames = profile.topTags.map(([name]) => name);

            let candidates = await Product.find({
                _id: { $nin: viewedProductIds },
                isActive: true,
                $or: [
                    { category: { $in: categoryIds } },
                    { brand: { $in: brandNames.map(b => new RegExp(b, 'i')) } },
                    { tags: { $in: topTagNames.map(t => new RegExp(t, 'i')) } },
                ],
            })
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .limit(60)
                .lean();

            // 2. Score each candidate using multi-signal scoring
            const categoryWeight = profile.topCategories.reduce((acc, [name, weight]) => {
                acc[name] = weight;
                return acc;
            }, {});

            const brandWeight = profile.topBrands.reduce((acc, [name, weight]) => {
                acc[name] = weight;
                return acc;
            }, {});

            const tagSet = new Set(topTagNames);

            const scored = candidates.map(product => {
                let score = 0;

                // Category affinity (highest impact)
                const catName = product.category?.name || '';
                if (categoryWeight[catName]) {
                    score += categoryWeight[catName] * 3;
                }

                // Brand affinity
                const brand = product.brand || '';
                if (brandWeight[brand]) {
                    score += brandWeight[brand] * 2;
                }

                // Price range match
                const prodPriceRange = BrowsingHistory.classifyPrice(product.discountedPrice || product.price);
                if (prodPriceRange === profile.preferredPriceRange) {
                    score += 2;
                }

                // Tag overlap
                const productTags = product.tags || [];
                const tagOverlap = productTags.filter(t => tagSet.has(t)).length;
                score += tagOverlap * 1.5;

                // Rating boost 
                if (product.rating >= 4) score += 1;

                // Discount boost (deals are attractive)
                if (product.discountPercent > 0) score += 0.5;

                return { product, score };
            });

            // 3. Sort by score and pick top results
            scored.sort((a, b) => b.score - a.score);
            const recommended = scored.slice(0, limit).map(s => ({
                ...s.product,
                recommendationScore: Math.round(s.score * 10),
            }));

            return {
                products: recommended,
                profile: {
                    topCategories: profile.topCategories.slice(0, 3).map(([name]) => name),
                    topBrands: profile.topBrands.slice(0, 3).map(([name]) => name),
                    priceRange: profile.preferredPriceRange,
                },
                message: `Curated ${recommended.length} picks based on your style`,
            };
        } catch (err) {
            console.error('StylistService: Recommendation error:', err.message);
            return { products: [], message: 'Unable to generate recommendations right now.' };
        }
    }

    // ─────────────────────────────────────────────────────────
    //  AI PERSONAL SHOPPER CHAT
    //  Enhanced chatbot that uses user browsing profile
    //  to personalize every response
    // ─────────────────────────────────────────────────────────
    async chat(sessionId, userMessage, userId = null) {
        // 1. Build user profile context if user is logged in
        let profileContext = '';
        let profileData = null;
        if (userId) {
            profileData = await this.buildUserProfile(userId);
            if (profileData) {
                profileContext = this._formatProfileContext(profileData);
            }
        }

        // 2. Search products relevant to the query
        const products = await this._searchProducts(userMessage, profileData);
        const productContext = this._formatProductContext(products);

        // 3. Get personalized recommendations if user asks for them
        let recommendations = [];
        const isRecommendationQuery = /recommend|suggest|for me|my style|what should|pick for|personal|outfit|match|goes with|pair with/i.test(userMessage);

        if (isRecommendationQuery && userId) {
            const recResult = await this.getRecommendations(userId, 8);
            recommendations = recResult.products || [];
        }

        const recommendationContext = recommendations.length > 0
            ? '\n\nPERSONALIZED RECOMMENDATIONS (Based on user\'s browsing history):\n' +
            recommendations.map((p, i) =>
                `REC ${i + 1}: [${p.title}] | Price: Rs.${p.price} | Brand: ${p.brand || 'N/A'} | ID: ${p._id}`
            ).join('\n')
            : '';

        // 4. Build system prompt
        const systemPrompt = await this._buildSystemPrompt(
            productContext, profileContext, recommendationContext
        );

        // 5. Call AI
        if (!this.client) {
            return this._fallbackResponse(userMessage, products, recommendations);
        }

        try {
            let history = this.conversations.get(sessionId) || [];
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
                { role: 'user', content: userMessage },
            ];

            const completion = await this.client.chat.completions.create({
                messages,
                model: 'llama-3.1-8b-instant',
                temperature: 0.3,
            });

            const aiResponse = completion.choices[0].message.content;

            // Save conversation history
            history.push({ role: 'user', text: userMessage });
            history.push({ role: 'assistant', text: aiResponse });
            if (history.length > 20) history = history.slice(-20);
            this.conversations.set(sessionId, history);

            // Merge search products + recommendation products for cards
            const allProducts = [...products];
            if (recommendations.length > 0) {
                const existingIds = new Set(products.map(p => p._id.toString()));
                recommendations.forEach(r => {
                    if (!existingIds.has(r._id.toString())) {
                        allProducts.push(r);
                    }
                });
            }

            return {
                message: aiResponse,
                products: allProducts.length > 0 ? this._formatProductCards(allProducts) : undefined,
                isPersonalized: !!profileData,
            };
        } catch (err) {
            console.error('StylistService: AI Error:', err.message);
            return this._fallbackResponse(userMessage, products, recommendations);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  FORMAT USER PROFILE FOR AI CONTEXT
    // ─────────────────────────────────────────────────────────
    _formatProfileContext(profile) {
        if (!profile) return '';

        const lines = ['USER PREFERENCE PROFILE (from their browsing history):'];

        if (profile.topCategories.length > 0) {
            lines.push(`- Favorite Categories: ${profile.topCategories.map(([name]) => name).join(', ')}`);
        }
        if (profile.topBrands.length > 0) {
            lines.push(`- Preferred Brands: ${profile.topBrands.map(([name]) => name).join(', ')}`);
        }
        lines.push(`- Price Preference: ${profile.preferredPriceRange}`);

        if (profile.recentProducts.length > 0) {
            lines.push(`- Recently Viewed: ${profile.recentProducts.slice(0, 5).map(p => p.title).join(', ')}`);
        }
        if (profile.topTags.length > 0) {
            lines.push(`- Interests: ${profile.topTags.slice(0, 8).map(([name]) => name).join(', ')}`);
        }

        return lines.join('\n');
    }

    // ─────────────────────────────────────────────────────────
    //  BUILD SYSTEM PROMPT
    // ─────────────────────────────────────────────────────────
    async _buildSystemPrompt(productContext, profileContext, recommendationContext) {
        const categories = await Category.find({ isActive: true }).select('name').lean();
        const categoryList = categories.map(c => c.name).join(', ');

        return `You are "Markaz Personal Shopper", a sophisticated AI fashion and shopping stylist for Markaz marketplace.

YOUR PERSONA:
- You are warm, knowledgeable, and passionate about helping customers find the perfect products.
- You speak like a trusted personal shopper at a premium department store.
- You give specific, actionable advice based on the user's actual browsing data.
- You notice patterns in their taste and point them out naturally.

CRITICAL SAFETY RULES:
1. ONLY recommend products from the database lists below. NEVER invent or hallucinate products.
2. If a product is NOT in the lists, say we don't carry it.
3. NEVER use placeholder IDs or links. Only use real IDs from the provided list.
4. When the user asks for suggestions, prioritize the PERSONALIZED RECOMMENDATIONS section.
5. Reference the user's browsing history naturally: "I noticed you've been looking at..." or "Based on your interest in...".
6. If no user profile exists, provide general recommendations and encourage them to browse more.

${profileContext ? '\n' + profileContext + '\n' : '\nNO USER PROFILE AVAILABLE. This is a guest or new user. Provide general assistance.\n'}

AVAILABLE STORE CATEGORIES:
${categoryList}

SEARCH RESULTS FOR THIS QUERY:
${productContext || 'NO PRODUCTS FOUND FOR THIS QUERY.'}
${recommendationContext}

RESPONSE GUIDELINES:
- Be conversational and personal, not robotic
- When suggesting products, explain WHY it matches their taste
- Group suggestions logically (e.g., "For your electronics interest..." or "Since you love premium brands...")
- If they ask about outfit pairing or product combinations, be creative  
- Keep responses concise but informative (2-4 paragraphs max)`;
    }

    // ─────────────────────────────────────────────────────────
    //  SEARCH PRODUCTS (enhanced with profile awareness)
    // ─────────────────────────────────────────────────────────
    async _searchProducts(query, userProfile = null) {
        try {
            const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'show', 'find', 'want', 'need', 'me', 'my', 'i', 'looking', 'for', 'best', 'give', 'suggest', 'recommend', 'what', 'should', 'buy']);
            const cleaned = query.toLowerCase().replace(/[?!.,;:/]/g, ' ').trim();
            const rawTerms = cleaned.split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));

            if (rawTerms.length === 0) {
                // No search terms: return featured or profile-based products
                if (userProfile && userProfile.topCategories.length > 0) {
                    const topCatName = userProfile.topCategories[0][0];
                    const cat = await Category.findOne({ name: topCatName });
                    if (cat) {
                        return await Product.find({ category: cat._id, isActive: true })
                            .populate('category', 'name')
                            .populate('seller', 'storeName')
                            .limit(10)
                            .lean();
                    }
                }
                return await Product.find({ isActive: true, isFeatured: true }).limit(8).lean();
            }

            // Standard search
            let products = await Product.find({
                isActive: true,
                $or: [
                    { title: { $regex: rawTerms.join('|'), $options: 'i' } },
                    { brand: { $regex: rawTerms.join('|'), $options: 'i' } },
                    { tags: { $in: rawTerms.map(t => new RegExp(t, 'i')) } },
                ],
            })
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .limit(15)
                .lean();

            // Category fallback
            if (products.length === 0) {
                const matchedCats = await Category.find({
                    name: { $regex: rawTerms.join('|'), $options: 'i' },
                }).select('_id');

                if (matchedCats.length > 0) {
                    products = await Product.find({
                        category: { $in: matchedCats.map(c => c._id) },
                        isActive: true,
                    })
                        .populate('category', 'name')
                        .populate('seller', 'storeName')
                        .limit(10)
                        .lean();
                }
            }

            return products;
        } catch (err) {
            console.error('StylistService: Search Error:', err.message);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────
    //  FORMAT HELPERS
    // ─────────────────────────────────────────────────────────
    _formatProductContext(products) {
        if (!products || products.length === 0) return '';
        return products.map((p, i) =>
            `MATCH ${i + 1}:\n- NAME: ${p.title}\n- PRICE: Rs.${p.price}\n- ID: ${p._id}\n- BRAND: ${p.brand || 'N/A'}\n- CATEGORY: ${p.category?.name || 'N/A'}`
        ).join('\n\n');
    }

    _formatProductCards(products) {
        return products.slice(0, 8).map(p => ({
            _id: p._id,
            title: p.title,
            price: p.price,
            discountedPrice: p.discountedPrice,
            discountPercent: p.discountPercent,
            image: p.images?.[0]?.url || null,
            rating: p.rating,
            seller: p.seller?.storeName || null,
            recommendationScore: p.recommendationScore || undefined,
        }));
    }

    _fallbackResponse(message, products, recommendations = []) {
        const allProducts = [...products, ...recommendations];
        if (allProducts.length > 0) {
            return {
                message: "Here are some items I think you'll love based on your browsing style:",
                products: this._formatProductCards(allProducts),
                isPersonalized: recommendations.length > 0,
            };
        }
        return {
            message: "I'm here to help you find the perfect products! Tell me what you're looking for, or ask me to recommend something based on your browsing history.",
            products: undefined,
            isPersonalized: false,
        };
    }

    clearHistory(sessionId) {
        this.conversations.delete(sessionId);
    }

    // ─────────────────────────────────────────────────────────
    //  GET BROWSING STATS FOR USER
    // ─────────────────────────────────────────────────────────
    async getBrowsingStats(userId) {
        try {
            const totalViews = await BrowsingHistory.countDocuments({ user: userId });
            const uniqueProducts = await BrowsingHistory.distinct('product', { user: userId });

            // Top categories
            const categoryAgg = await BrowsingHistory.aggregate([
                { $match: { user: userId } },
                { $group: { _id: '$category', count: { $sum: '$viewCount' } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
                { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
                { $project: { name: '$cat.name', count: 1 } },
            ]);

            // Top brands
            const brandAgg = await BrowsingHistory.aggregate([
                { $match: { user: userId, brand: { $ne: '' } } },
                { $group: { _id: '$brand', count: { $sum: '$viewCount' } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]);

            return {
                totalViews,
                uniqueProducts: uniqueProducts.length,
                topCategories: categoryAgg.map(c => ({ name: c.name || 'Unknown', views: c.count })),
                topBrands: brandAgg.map(b => ({ name: b._id, views: b.count })),
            };
        } catch (err) {
            console.error('StylistService: Stats error:', err.message);
            return { totalViews: 0, uniqueProducts: 0, topCategories: [], topBrands: [] };
        }
    }
}

module.exports = new StylistService();
