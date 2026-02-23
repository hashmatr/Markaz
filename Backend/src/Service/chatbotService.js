const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../Modal/Product');
const Category = require('../Modal/Category');
const Order = require('../Modal/Order');

class ChatbotService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.conversations = new Map(); // sessionId -> chat history
        this._init();
    }

    _init() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('ChatbotService: GEMINI_API_KEY not set. Chatbot will use fallback mode.');
            return;
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        console.log('ChatbotService: Gemini AI initialized successfully.');
    }

    /**
     * Build the system prompt with live product/store context
     */
    _buildSystemPrompt(productContext = '') {
        return `You are "Markaz Assistant", a friendly, helpful, and knowledgeable AI shopping assistant for Markaz — Pakistan's premier multi-vendor eCommerce marketplace.

YOUR PERSONALITY:
- Warm, professional, and conversational — like a trusted shop assistant.
- Use short, clear responses. Avoid walls of text.
- Use bullet points for product details.
- Add relevant emojis sparingly for friendliness.

YOUR CAPABILITIES:
1. Answer questions about products (price, specs, availability, variants).
2. Recommend products based on user preferences (budget, category, brand).
3. Compare products side-by-side.
4. Explain return policy: "7-day easy return if the product is damaged or not as described."
5. Explain shipping: "Standard delivery across Pakistan in 3-7 business days."
6. Explain payment methods: "COD (Cash on Delivery) and Online Payment available."
7. Help users navigate: suggest visiting /shop, /cart, /orders, /contact pages.
8. Mention the 20% first-order discount for new customers.
9. If a user asks about order tracking, tell them to visit their Orders page or use the Track Order feature.
10. If you don't know something, say so honestly and suggest contacting support.

STORE POLICIES:
- Free delivery on orders above $100.
- Standard delivery fee: $15.
- 7-day return policy.
- 20% discount on first order for new members.
- Payment: COD and Online.
- Working hours: 9 AM – 9 PM PKT, Mon–Sat.
- Contact: hashraxa266@gmail.com | +92 311 5732241 | WhatsApp available.

FORMATTING RULES:
- When showing product info, use this format:
  **Product Name** — $Price
  Brief description. Rating: ⭐X.X
- When comparing, use a clean table-like format.
- Always include prices in $ (USD).
- When suggesting products, include a maximum of 5 items.
- If products are found in the database, use ONLY real data. Never fabricate product details.
- For product links, use format: [Product Name](/product/PRODUCT_ID)

CURRENT PRODUCT DATA FROM DATABASE:
${productContext || 'No specific product data loaded for this query. Provide general assistance.'}

Remember: You represent Markaz. Always be helpful, accurate, and encourage shopping!`;
    }

    /**
     * Synonym map — expand user terms into multiple search terms
     */
    _getSynonyms() {
        return {
            'mobile': ['mobile', 'smartphone', 'phone', 'cell phone', 'cellphone', 'android', 'iphone'],
            'phone': ['phone', 'smartphone', 'mobile', 'cell phone', 'iphone', 'android'],
            'smartphone': ['smartphone', 'mobile', 'phone', 'cell phone'],
            'laptop': ['laptop', 'notebook', 'macbook', 'chromebook', 'pc laptop', 'netbook'],
            'watch': ['watch', 'smartwatch', 'smart watch', 'wristwatch', 'apple watch'],
            'headphone': ['headphone', 'headphones', 'earphone', 'earbuds', 'earpiece', 'audio'],
            'earbuds': ['earbuds', 'earphone', 'headphone', 'headphones', 'audio'],
            'tv': ['tv', 'television', 'monitor', 'screen', 'display'],
            'shirt': ['shirt', 'top', 'tee', 't-shirt', 'tshirt', 'clothing'],
            'shoes': ['shoes', 'sneakers', 'footwear', 'boots', 'sandals'],
            'dress': ['dress', 'gown', 'frock', 'outfit', 'clothing'],
            'bag': ['bag', 'handbag', 'purse', 'backpack', 'tote'],
            'camera': ['camera', 'dslr', 'digital camera', 'lens'],
            'tablet': ['tablet', 'ipad', 'tab'],
            'gaming': ['gaming', 'game', 'console', 'playstation', 'xbox', 'ps5'],
            'furniture': ['furniture', 'sofa', 'chair', 'table', 'bed', 'desk'],
            'makeup': ['makeup', 'cosmetic', 'lipstick', 'mascara', 'foundation', 'beauty'],
            'perfume': ['perfume', 'fragrance', 'cologne', 'scent'],
            'car': ['car', 'vehicle', 'automobile', 'sedan', 'suv'],
            'bike': ['bike', 'motorcycle', 'motorbike'],
            'kitchen': ['kitchen', 'cookware', 'utensil', 'spatula', 'pan'],
            'skincare': ['skincare', 'skin care', 'moisturizer', 'cleanser', 'serum', 'cream'],
            'jewellery': ['jewellery', 'jewelry', 'necklace', 'ring', 'bracelet', 'earring'],
        };
    }

    /**
     * Category keyword map — map user keywords to DB category names
     */
    _getCategoryMap() {
        return {
            'mobile': ['Mobiles', 'Smartphones', 'Cell Phones & Smartphones', 'Mobile Accessories'],
            'phone': ['Mobiles', 'Smartphones', 'Cell Phones & Smartphones', 'Mobile Accessories', 'VoIP Home Phones'],
            'smartphone': ['Smartphones', 'Mobiles', 'Cell Phones & Smartphones'],
            'laptop': ['Laptops', 'Apple Laptops', 'PC Laptops & Netbooks', 'Laptop Housings & Touchpads'],
            'watch': ['Watches', 'Smart Watches', "Men's Watches", "Women's Watches", 'Wristwatches'],
            'headphone': ['Headphones', 'Electronics'],
            'camera': ['Digital Cameras', 'Lenses'],
            'tablet': ['Tablets'],
            'gaming': ['Gaming', 'Video Game Consoles'],
            'furniture': ['Furniture', 'Home & Living'],
            'fashion': ['Fashion', "Men's Fashion", "Women's Fashion", "Men's Clothing", "Women's Clothing"],
            'shoe': ['Footwear', "Men's Shoes", "Women's Shoes", 'Athletic Shoes'],
            'shoes': ['Footwear', "Men's Shoes", "Women's Shoes", 'Athletic Shoes'],
            'beauty': ['Beauty', 'Skin Care'],
            'makeup': ['Beauty', 'lipstick', 'mascara', 'eyeshadow', 'gel', 'lip_gloss', 'powder', 'pencil', 'liquid'],
            'clothes': ['Clothes', "MEN'S CLOTHING", "WOMEN'S CLOTHING", 'Tops', "Women's Dresses", "Men's Shirts"],
            'electronics': ['Electronics', 'Laptops', 'Smartphones', 'Tablets', 'Headphones'],
            'car': ['Vehicle', 'Motorcycle'],
            'vehicle': ['Vehicle', 'Motorcycle'],
            'jewellery': ['JEWELERY', 'Jewellery', "Women's Jewellery"],
            'bag': ["Women's Bags"],
            'sports': ['Sports', 'Sports Accessories'],
            'kitchen': ['Kitchen Accessories'],
            'sunglasses': ['Sunglasses'],
            'kids': ['Kids', 'Toys'],
            'perfume': ['Fragrances'],
            'book': ['Books'],
            'grocery': ['Groceries', 'Dried Fruit & Veg', 'Cans'],
        };
    }

    /**
     * Extract meaningful search keywords from user message
     */
    _extractSearchTerms(query) {
        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'and', 'or', 'but', 'if', 'of', 'at', 'by', 'in', 'on', 'to', 'up',
            'for', 'how', 'can', 'you', 'what', 'show', 'find', 'want', 'need',
            'looking', 'any', 'have', 'has', 'get', 'buy', 'give', 'some', 'more',
            'this', 'that', 'with', 'from', 'about', 'your', 'please', 'tell',
            'me', 'my', 'i', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'recommend', 'recommand', 'recommemnd', 'suggest', 'available',
            'there', 'here', 'which', 'where', 'when', 'who', 'whom',
            'very', 'really', 'just', 'also', 'too', 'most', 'much',
        ]);

        const cleaned = query.toLowerCase().replace(/[?!.,;:'"()]/g, '').trim();
        const words = cleaned.split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));
        return words;
    }

    /**
     * Expand search terms with synonyms
     */
    _expandWithSynonyms(terms) {
        const synonyms = this._getSynonyms();
        const expanded = new Set(terms);

        for (const term of terms) {
            if (synonyms[term]) {
                synonyms[term].forEach(syn => expanded.add(syn));
            }
        }

        return [...expanded];
    }

    /**
     * Search products in MongoDB based on user query — SMART SEARCH
     */
    async _searchProducts(query) {
        try {
            const rawTerms = this._extractSearchTerms(query);
            if (rawTerms.length === 0) return [];

            const expandedTerms = this._expandWithSynonyms(rawTerms);
            const categoryMap = this._getCategoryMap();

            console.log('ChatbotService: Search terms:', rawTerms, '→ Expanded:', expandedTerms);

            let products = [];

            // ────── Strategy 1: Category-based search ──────
            // Check if any search term (raw or expanded) maps to a known category
            const matchedCategories = [];
            const allTermsForCategoryLookup = [...new Set([...rawTerms, ...expandedTerms])];
            for (const term of allTermsForCategoryLookup) {
                if (categoryMap[term]) {
                    matchedCategories.push(...categoryMap[term]);
                }
            }

            if (matchedCategories.length > 0) {
                // Find categories matching any of the mapped names (case-insensitive)
                const uniqueCatNames = [...new Set(matchedCategories)];
                const categories = await Category.find({
                    name: { $in: uniqueCatNames }
                });

                // If exact match didn't work, try case-insensitive regex
                if (categories.length === 0) {
                    const regexConditions = uniqueCatNames.map(c => ({
                        name: new RegExp(c.split('').map(ch => /\w/.test(ch) ? ch : '\\' + ch).join(''), 'i')
                    }));
                    const fallbackCategories = await Category.find({ $or: regexConditions });
                    if (fallbackCategories.length > 0) categories.push(...fallbackCategories);
                }

                console.log('ChatbotService: Matched category names:', uniqueCatNames, '→ Found DB categories:', categories.map(c => c.name));

                if (categories.length > 0) {
                    const categoryIds = categories.map(c => c._id);

                    // Build additional filter for specs like "64 gb"
                    const specFilters = {};
                    const numericMatch = query.match(/(\d+)\s*(gb|tb|mb|ram|rom|mp|mah|inch|"|cm|mm)/i);
                    if (numericMatch) {
                        const specValue = numericMatch[0];
                        specFilters.$or = [
                            { description: { $regex: specValue, $options: 'i' } },
                            { title: { $regex: specValue, $options: 'i' } },
                            { 'specifications.value': { $regex: specValue, $options: 'i' } },
                            { tags: { $regex: specValue, $options: 'i' } },
                        ];
                    }

                    const categoryFilter = {
                        category: { $in: categoryIds },
                        isActive: true,
                        ...specFilters,
                    };

                    products = await Product.find(categoryFilter)
                        .populate('category', 'name')
                        .populate('seller', 'storeName storeSlug rating')
                        .sort({ rating: -1, totalSold: -1 })
                        .limit(20)
                        .lean();

                    // If spec filter too restrictive, try without it
                    if (products.length === 0 && specFilters.$or) {
                        products = await Product.find({
                            category: { $in: categoryIds },
                            isActive: true,
                        })
                            .populate('category', 'name')
                            .populate('seller', 'storeName storeSlug rating')
                            .sort({ rating: -1, totalSold: -1 })
                            .limit(20)
                            .lean();
                    }

                    if (products.length > 0) {
                        // Re-rank by title relevance to user's actual search terms
                        const titleRelevanceTerms = rawTerms.filter(t => !['best', 'good', 'top', 'cheap', 'new', 'latest'].includes(t));
                        if (titleRelevanceTerms.length > 0) {
                            products = products.map(p => {
                                let relevanceScore = 0;
                                const titleLower = (p.title || '').toLowerCase();
                                const descLower = (p.description || '').toLowerCase();
                                const brandLower = (p.brand || '').toLowerCase();
                                const tagsStr = (p.tags || []).join(' ').toLowerCase();

                                for (const term of titleRelevanceTerms) {
                                    if (titleLower.includes(term)) relevanceScore += 10;
                                    if (brandLower.includes(term)) relevanceScore += 8;
                                    if (tagsStr.includes(term)) relevanceScore += 5;
                                    if (descLower.includes(term)) relevanceScore += 2;
                                }
                                // Also check synonym terms in title
                                const synonyms = this._getSynonyms();
                                for (const term of titleRelevanceTerms) {
                                    if (synonyms[term]) {
                                        for (const syn of synonyms[term]) {
                                            if (titleLower.includes(syn)) relevanceScore += 7;
                                        }
                                    }
                                }
                                // Boost by rating
                                relevanceScore += (p.rating || 0) * 0.5;
                                return { ...p, _relevanceScore: relevanceScore };
                            });
                            products.sort((a, b) => b._relevanceScore - a._relevanceScore);
                        }

                        console.log(`ChatbotService: Found ${products.length} products via category search.`);
                        return products.slice(0, 8);
                    }
                }
            }

            // ────── Strategy 2: MongoDB text search with expanded terms ──────
            try {
                products = await Product.find({
                    $text: { $search: expandedTerms.join(' ') },
                    isActive: true,
                })
                    .populate('category', 'name')
                    .populate('seller', 'storeName storeSlug rating')
                    .sort({ score: { $meta: 'textScore' } })
                    .limit(8)
                    .lean();

                if (products.length > 0) {
                    console.log(`ChatbotService: Found ${products.length} products via text search.`);
                    return products;
                }
            } catch (e) {
                // Text search may fail
            }

            // ────── Strategy 3: Regex search on title, brand, tags, description ──────
            const orConditions = [];
            for (const term of expandedTerms) {
                const regex = new RegExp(term, 'i');
                orConditions.push({ title: regex });
                orConditions.push({ brand: regex });
                orConditions.push({ tags: regex });
            }
            // Also search original raw terms in description
            for (const term of rawTerms) {
                orConditions.push({ description: new RegExp(term, 'i') });
            }

            if (orConditions.length > 0) {
                products = await Product.find({
                    isActive: true,
                    $or: orConditions,
                })
                    .populate('category', 'name')
                    .populate('seller', 'storeName storeSlug rating')
                    .sort({ rating: -1, totalSold: -1 })
                    .limit(8)
                    .lean();

                if (products.length > 0) {
                    console.log(`ChatbotService: Found ${products.length} products via regex search.`);
                    return products;
                }
            }

            console.log('ChatbotService: No products found for query:', query);
            return [];
        } catch (err) {
            console.error('ChatbotService: Product search error:', err.message);
            return [];
        }
    }

    /**
     * Get trending/popular products
     */
    async _getTrendingProducts(limit = 5) {
        try {
            return await Product.find({ isActive: true })
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .sort({ totalSold: -1 })
                .limit(limit)
                .lean();
        } catch {
            return [];
        }
    }

    /**
     * Get products by category name
     */
    async _getProductsByCategory(categoryName, limit = 5) {
        try {
            const category = await Category.findOne({
                name: { $regex: categoryName, $options: 'i' },
            });
            if (!category) return [];

            return await Product.find({ category: category._id, isActive: true })
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .sort({ rating: -1 })
                .limit(limit)
                .lean();
        } catch {
            return [];
        }
    }

    /**
     * Get deals / discounted products
     */
    async _getDeals(limit = 5) {
        try {
            return await Product.find({ isActive: true, discountPercent: { $gt: 0 } })
                .populate('category', 'name')
                .populate('seller', 'storeName')
                .sort({ discountPercent: -1 })
                .limit(limit)
                .lean();
        } catch {
            return [];
        }
    }

    /**
     * Format products into context string for AI
     */
    _formatProductContext(products) {
        if (!products || products.length === 0) return '';

        return products.map((p, i) => {
            const specs = (p.specifications || []).map(s => `${s.key}: ${s.value}`).join(', ');
            const variants = (p.variantOptions || []).map(v => `${v.name}: ${v.values.join(', ')}`).join(' | ');

            return `[Product ${i + 1}]
ID: ${p._id}
Title: ${p.title}
Price: $${p.price}${p.discountedPrice && p.discountedPrice < p.price ? ` (Discounted: $${p.discountedPrice}, ${p.discountPercent}% OFF)` : ''}
Category: ${p.category?.name || 'N/A'}
Brand: ${p.brand || 'N/A'}
Seller: ${p.seller?.storeName || 'N/A'}
Rating: ${p.rating}/5 (${p.totalReviews} reviews)
Stock: ${p.quantity > 0 ? `${p.quantity} available` : 'Out of stock'}
Description: ${(p.description || '').substring(0, 200)}
${specs ? `Specs: ${specs}` : ''}
${variants ? `Variants: ${variants}` : ''}
Link: /product/${p._id}`;
        }).join('\n\n');
    }

    /**
     * Detect user intent from the message
     */
    _detectIntent(message) {
        const msg = message.toLowerCase();

        if (/^(hello|hi|hey|salam|assalam|good morning|good evening|sup)\b/i.test(msg)) return 'greeting';
        if (/track|order.*status|where.*order|my.*order|order.*number/i.test(msg)) return 'order_tracking';
        if (/return|refund|exchange|replace|damaged|wrong.*product/i.test(msg)) return 'return_policy';
        if (/\b(shipping|delivery|deliver|how.*long|when.*arrive|dispatch)\b/i.test(msg) && !/product|show|find|buy/i.test(msg)) return 'shipping';
        if (/\b(payment|pay|cod|cash.*delivery|online.*pay)\b/i.test(msg) && !/product|show|find|buy/i.test(msg)) return 'payment';
        if (/sell|become.*seller|register.*seller|start.*selling/i.test(msg)) return 'become_seller';
        if (/compare|vs|versus|difference between/i.test(msg)) return 'compare';
        if (/\b(trending|popular|best.*sell|hot|top.*product)\b/i.test(msg) && !/recommend|suggest|mobile|phone|laptop|watch/i.test(msg)) return 'trending';
        if (/\b(deal|offer|sale|on sale)\b/i.test(msg) && !/product|show|find|recommend|mobile|phone/i.test(msg)) return 'deals';
        if (/\b(cart|add.*cart|checkout)\b/i.test(msg) && !/product|show|find/i.test(msg)) return 'cart_help';
        if (/\b(contact|support|email|whatsapp)\b/i.test(msg) && !/product|show|find/i.test(msg)) return 'contact';
        if (/^(thank|thanks|bye|goodbye)/i.test(msg)) return 'farewell';

        // If user mentions product keywords with recommend/suggest/best, it's a product search
        return 'product_search';
    }

    /**
     * Main chat method
     */
    async chat(sessionId, userMessage) {
        const intent = this._detectIntent(userMessage);

        // Gather product context based on intent
        let products = [];
        let extraContext = '';

        switch (intent) {
            case 'trending':
                products = await this._getTrendingProducts(5);
                extraContext = 'The user is asking about trending/popular products. Show them the top sellers.';
                break;
            case 'deals':
                products = await this._getDeals(5);
                extraContext = 'The user wants deals/discounts. Show the best discounted products.';
                break;
            case 'greeting':
            case 'farewell':
            case 'return_policy':
            case 'shipping':
            case 'payment':
            case 'become_seller':
            case 'contact':
            case 'order_tracking':
            case 'cart_help':
                // No product search needed for these
                break;
            default:
                // Search products for general queries (including recommend)
                products = await this._searchProducts(userMessage);
                if (products.length > 0) {
                    extraContext = `Found ${products.length} matching products in the database. Use ONLY this real data to answer. Recommend the best ones based on rating and reviews.`;
                } else {
                    extraContext = 'No matching products found in database. Let the user know and suggest browsing /shop or trying different keywords like a brand name or specific product type.';
                }
                break;
        }

        const productContext = this._formatProductContext(products);
        const systemPrompt = this._buildSystemPrompt(
            (extraContext ? extraContext + '\n\n' : '') + productContext
        );

        // Try AI response
        if (this.model) {
            try {
                // Get or create conversation history
                let history = this.conversations.get(sessionId) || [];

                // Keep history manageable (last 10 exchanges)
                if (history.length > 20) {
                    history = history.slice(-20);
                }

                const chat = this.model.startChat({
                    history: history.map(h => ({
                        role: h.role,
                        parts: [{ text: h.text }],
                    })),
                    systemInstruction: systemPrompt,
                });

                const result = await chat.sendMessage(userMessage);
                const aiResponse = result.response.text();

                // Save to history
                history.push({ role: 'user', text: userMessage });
                history.push({ role: 'model', text: aiResponse });
                this.conversations.set(sessionId, history);

                // Build product cards data for frontend
                const productCards = products.slice(0, 4).map(p => ({
                    _id: p._id,
                    title: p.title,
                    price: p.price,
                    discountedPrice: p.discountedPrice,
                    discountPercent: p.discountPercent,
                    image: p.images?.[0]?.url || null,
                    rating: p.rating,
                    seller: p.seller?.storeName || null,
                }));

                return {
                    message: aiResponse,
                    products: productCards.length > 0 ? productCards : undefined,
                    intent,
                };

            } catch (err) {
                console.error('ChatbotService: Gemini API error:', err.message);
                return this._fallbackResponse(userMessage, intent, products);
            }
        }

        // Fallback if no AI configured
        return this._fallbackResponse(userMessage, intent, products);
    }

    /**
     * Fallback responses when AI is unavailable
     */
    _fallbackResponse(message, intent, products = []) {
        const productCards = products.slice(0, 4).map(p => ({
            _id: p._id,
            title: p.title,
            price: p.price,
            discountedPrice: p.discountedPrice,
            discountPercent: p.discountPercent,
            image: p.images?.[0]?.url || null,
            rating: p.rating,
            seller: p.seller?.storeName || null,
        }));

        const responses = {
            greeting: {
                message: "Hello! Welcome to Markaz! 👋 I'm your shopping assistant. I can help you find products, compare items, track orders, and more. What are you looking for today?",
            },
            farewell: {
                message: "Thank you for shopping with Markaz! 🙏 If you need anything else, I'm always here. Happy shopping!",
            },
            order_tracking: {
                message: "To track your order, please visit the **Orders** page in your profile. You can see real-time status updates there. If you have your Order ID, you can use the **Track Order** feature in the menu.\n\nNeed more help? Contact us at hashraxa266@gmail.com or WhatsApp +92 311 5732241.",
            },
            return_policy: {
                message: "📦 **Markaz Return Policy:**\n\n• **7-day easy return** if the product is damaged or not as described.\n• Request a return through your **Orders** page.\n• Refunds are processed within 3-5 business days.\n• Items must be in original packaging.\n\nFor assistance, contact us at hashraxa266@gmail.com.",
            },
            shipping: {
                message: "🚚 **Shipping Information:**\n\n• Standard delivery: **3-7 business days** across Pakistan.\n• Delivery fee: **$15** (free on orders above $100).\n• Real-time tracking available on your Orders page.\n• We ship nationwide!",
            },
            payment: {
                message: "💳 **Payment Methods:**\n\n• **Cash on Delivery (COD)** — Pay when you receive your order.\n• **Online Payment** — Secure card payment at checkout.\n\nAll payments are 100% secure!",
            },
            become_seller: {
                message: "🏪 Want to sell on Markaz? Here's how:\n\n1. Click **\"Become a Seller\"** in the navigation.\n2. Fill in your store details.\n3. Once verified, start listing products!\n\nJoin hundreds of successful sellers on Pakistan's fastest-growing marketplace!",
            },
            contact: {
                message: "📞 **Contact Markaz:**\n\n• Email: hashraxa266@gmail.com\n• Phone: +92 311 5732241\n• WhatsApp: [Chat with us](https://wa.me/923115732241)\n• Working Hours: 9 AM – 9 PM PKT, Mon–Sat\n\nOr visit our [Contact Page](/contact)!",
            },
            cart_help: {
                message: "🛒 To add products to your cart:\n\n1. Browse products in [Shop](/shop).\n2. Click on any product to see details.\n3. Select size/color/variant options.\n4. Click **\"Add to Cart\"**.\n5. Head to [Cart](/cart) to checkout!\n\n🎁 **New here?** Get **20% OFF** your first order!",
            },
            trending: {
                message: products.length > 0
                    ? "🔥 Here are the trending products on Markaz right now:"
                    : "🔥 Check out our trending products at [Shop](/shop)! We have amazing deals across electronics, fashion, home & more.",
                products: productCards.length > 0 ? productCards : undefined,
            },
            deals: {
                message: products.length > 0
                    ? "💰 Check out these amazing deals:"
                    : "💰 Browse our latest deals at [Shop](/shop)! Don't forget — **20% OFF** your first order!",
                products: productCards.length > 0 ? productCards : undefined,
            },
            recommend: {
                message: products.length > 0
                    ? "Based on your interest, here are some great options:"
                    : "I'd love to help you find the perfect product! Could you tell me:\n• What category? (Electronics, Fashion, Home, etc.)\n• Your budget range?\n• Any preferred brand?",
                products: productCards.length > 0 ? productCards : undefined,
            },
            product_search: {
                message: products.length > 0
                    ? `I found ${products.length} product(s) matching your search:`
                    : "I couldn't find specific products matching your query. Try browsing our [Shop](/shop) or tell me more about what you're looking for — like category, brand, or price range!",
                products: productCards.length > 0 ? productCards : undefined,
            },
            compare: {
                message: "I can help you compare products! Please tell me the names or types of products you'd like to compare, and I'll pull up the details side by side.",
            },
        };

        return responses[intent] || responses.product_search;
    }

    /**
     * Clear conversation history for a session
     */
    clearHistory(sessionId) {
        this.conversations.delete(sessionId);
    }
}

module.exports = new ChatbotService();
