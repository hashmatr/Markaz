const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

/**
 * Get or create Redis client singleton.
 * Falls back gracefully if Redis is not configured.
 */
const getRedisClient = () => {
    if (redisClient) return redisClient;

    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD || undefined;
    const redisDb = parseInt(process.env.REDIS_DB || '0');

    const config = redisUrl
        ? { lazyConnect: true, maxRetriesPerRequest: 3, enableReadyCheck: false }
        : {
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            db: redisDb,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
            retryStrategy(times) {
                if (times > 3) return null; // Stop retrying after 3 attempts
                return Math.min(times * 200, 2000); // Exponential backoff
            },
        };

    redisClient = redisUrl
        ? new Redis(redisUrl, config)
        : new Redis(config);

    redisClient.on('connect', () => {
        isConnected = true;
        console.log('Redis: Connected successfully');
    });

    redisClient.on('ready', () => {
        isConnected = true;
    });

    redisClient.on('error', (err) => {
        isConnected = false;
        // Log once, don't crash
        if (err.code === 'ECONNREFUSED') {
            console.warn('Redis: Connection refused. Falling back to MongoDB for token storage.');
        } else {
            console.error('Redis error:', err.message);
        }
    });

    redisClient.on('close', () => {
        isConnected = false;
    });

    return redisClient;
};

/**
 * Connect to Redis. Called once at app startup.
 */
const connectRedis = async () => {
    const client = getRedisClient();
    try {
        await client.connect();
        console.log('Redis: Client initialized');
    } catch (err) {
        console.warn('Redis: Could not connect on startup. Tokens will fall back to MongoDB storage.');
    }
};

/**
 * Check if Redis is currently connected and ready.
 */
const isRedisReady = () => {
    return redisClient && isConnected && redisClient.status === 'ready';
};

module.exports = { getRedisClient, connectRedis, isRedisReady };
