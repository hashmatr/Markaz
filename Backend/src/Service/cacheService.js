/**
 * Redis Cache Service
 * Caches frequently-accessed data (trending products, category trees)
 * for sub-200ms homepage loads.
 */

const { getRedisClient, isRedisReady } = require('../Config/redis');

const CACHE_KEYS = {
    TRENDING_PRODUCTS: 'cache:trending_products',
    CATEGORY_TREE: 'cache:category_tree',
    NEW_ARRIVALS: 'cache:new_arrivals',
    FLASH_SALES: 'cache:flash_sales',
    HOME_PAGE: 'cache:home_page',
};

// TTL values in seconds
const TTL = {
    TRENDING_PRODUCTS: 300, // 5 minutes
    CATEGORY_TREE: 600,     // 10 minutes
    NEW_ARRIVALS: 180,      // 3 minutes
    FLASH_SALES: 60,        // 1 minute (needs to be fresh)
    HOME_PAGE: 120,         // 2 minutes
};

/**
 * Get cached data by key
 * @param {string} key - Cache key
 * @returns {any|null} Parsed data or null
 */
async function getCache(key) {
    if (!isRedisReady()) return null;

    try {
        const client = getRedisClient();
        const data = await client.get(key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    } catch (err) {
        console.warn('Redis getCache error:', err.message);
        return null;
    }
}

/**
 * Set cached data with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be JSON serialized)
 * @param {number} ttl - Time to live in seconds
 */
async function setCache(key, data, ttl) {
    if (!isRedisReady()) return;

    try {
        const client = getRedisClient();
        await client.setex(key, ttl, JSON.stringify(data));
    } catch (err) {
        console.warn('Redis setCache error:', err.message);
    }
}

/**
 * Invalidate a specific cache key
 * @param {string} key - Cache key to delete
 */
async function invalidateCache(key) {
    if (!isRedisReady()) return;

    try {
        const client = getRedisClient();
        await client.del(key);
    } catch (err) {
        console.warn('Redis invalidateCache error:', err.message);
    }
}

/**
 * Invalidate all product-related caches
 * Call this when products are created, updated, or deleted
 */
async function invalidateProductCaches() {
    await Promise.all([
        invalidateCache(CACHE_KEYS.TRENDING_PRODUCTS),
        invalidateCache(CACHE_KEYS.NEW_ARRIVALS),
        invalidateCache(CACHE_KEYS.HOME_PAGE),
        invalidateCache(CACHE_KEYS.FLASH_SALES),
    ]);
}

/**
 * Invalidate category cache
 * Call this when categories are created, updated, or deleted
 */
async function invalidateCategoryCaches() {
    await Promise.all([
        invalidateCache(CACHE_KEYS.CATEGORY_TREE),
        invalidateCache(CACHE_KEYS.HOME_PAGE),
    ]);
}

module.exports = {
    CACHE_KEYS,
    TTL,
    getCache,
    setCache,
    invalidateCache,
    invalidateProductCaches,
    invalidateCategoryCaches,
};
