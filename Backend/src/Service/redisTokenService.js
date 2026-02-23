const crypto = require('crypto');
const { getRedisClient, isRedisReady } = require('../Config/redis');

// ─── Key Prefixes (namespacing all tokens) ───────────────────────────────────
const PREFIX = {
    OTP: 'otp',               // otp:{type}:{email}
    OTP_COOLDOWN: 'otp:cd',   // otp:cd:{type}:{email} — cooldown lock
    OTP_ATTEMPTS: 'otp:att',  // otp:att:{type}:{email} — attempt counter
    REFRESH: 'refresh',       // refresh:{token}
    REFRESH_USER: 'ref:usr',  // ref:usr:{userId} — set of tokens per user
    ACCESS_BLOCKLIST: 'blk',  // blk:{jti} — blocklisted access tokens
};

// ─── TTLs (seconds) ──────────────────────────────────────────────────────────
const TTL = {
    OTP: 10 * 60,             // 10 minutes
    OTP_COOLDOWN: 60,         // 60s between resend requests
    OTP_MAX_ATTEMPTS: 5,
    REFRESH: 7 * 24 * 60 * 60, // 7 days
    ACCESS_BLOCKLIST: 15 * 60, // 15 min (matches access token expiry)
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const key = (...parts) => parts.join(':');

// ─── Redis Token Service ──────────────────────────────────────────────────────

class RedisTokenService {
    /**
     * Check if Redis is available; used by callers to decide fallback.
     */
    isAvailable() {
        return isRedisReady();
    }

    // ════════════════════════════════════════════
    //  OTP — Store / Verify / Delete
    // ════════════════════════════════════════════

    /**
     * Store an OTP code (bcrypt-hashed) in Redis with TTL.
     */
    async storeOTP(email, otp, type, hashedOTP, ipAddress = null, userAgent = null) {
        const redis = getRedisClient();
        const otpKey = key(PREFIX.OTP, type, email.toLowerCase());

        const payload = JSON.stringify({
            hashedOTP,
            ipAddress,
            userAgent,
            createdAt: Date.now(),
        });

        await redis.set(otpKey, payload, 'EX', TTL.OTP);

        // Reset attempts counter on fresh OTP issue
        const attKey = key(PREFIX.OTP_ATTEMPTS, type, email.toLowerCase());
        await redis.del(attKey);

        // Set cooldown to prevent spamming
        const cdKey = key(PREFIX.OTP_COOLDOWN, type, email.toLowerCase());
        await redis.set(cdKey, '1', 'EX', TTL.OTP_COOLDOWN);

        return true;
    }

    /**
     * Get stored OTP data for verification.
     */
    async getOTPData(email, type) {
        const redis = getRedisClient();
        const otpKey = key(PREFIX.OTP, type, email.toLowerCase());
        const raw = await redis.get(otpKey);
        if (!raw) return null;

        const data = JSON.parse(raw);

        // Get remaining attempts
        const attKey = key(PREFIX.OTP_ATTEMPTS, type, email.toLowerCase());
        const attempts = parseInt(await redis.get(attKey) || '0');

        return { ...data, attempts };
    }

    /**
     * Increment failed attempt counter. Returns new attempt count.
     */
    async incrementOTPAttempts(email, type) {
        const redis = getRedisClient();
        const attKey = key(PREFIX.OTP_ATTEMPTS, type, email.toLowerCase());
        const count = await redis.incr(attKey);
        // Attempts TTL mirrors the OTP TTL
        await redis.expire(attKey, TTL.OTP);
        return count;
    }

    /**
     * Delete OTP after successful use or max attempts.
     */
    async deleteOTP(email, type) {
        const redis = getRedisClient();
        const pipeline = redis.pipeline();
        pipeline.del(key(PREFIX.OTP, type, email.toLowerCase()));
        pipeline.del(key(PREFIX.OTP_ATTEMPTS, type, email.toLowerCase()));
        await pipeline.exec();
    }

    /**
     * Delete all OTPs for an email across all types.
     */
    async deleteAllOTPsForEmail(email) {
        const redis = getRedisClient();
        const types = ['registration', 'password_reset', 'seller_verification', 'login_2fa'];
        const pipeline = redis.pipeline();
        for (const type of types) {
            pipeline.del(key(PREFIX.OTP, type, email.toLowerCase()));
            pipeline.del(key(PREFIX.OTP_ATTEMPTS, type, email.toLowerCase()));
            pipeline.del(key(PREFIX.OTP_COOLDOWN, type, email.toLowerCase()));
        }
        await pipeline.exec();
    }

    /**
     * Check if a cooldown is active (resend spam protection).
     * Returns seconds remaining, or 0 if no cooldown.
     */
    async getCooldownTTL(email, type) {
        const redis = getRedisClient();
        const cdKey = key(PREFIX.OTP_COOLDOWN, type, email.toLowerCase());
        const ttl = await redis.ttl(cdKey);
        return ttl > 0 ? ttl : 0;
    }

    /**
     * Get OTP status for debugging (dev only).
     */
    async getOTPStatus(email, type) {
        const redis = getRedisClient();
        const otpKey = key(PREFIX.OTP, type, email.toLowerCase());
        const [raw, attRaw, cdTTL] = await Promise.all([
            redis.get(otpKey),
            redis.get(key(PREFIX.OTP_ATTEMPTS, type, email.toLowerCase())),
            redis.ttl(otpKey),
        ]);

        if (!raw) return { exists: false, message: 'No valid OTP found' };

        return {
            exists: true,
            email: email.toLowerCase(),
            type,
            attempts: parseInt(attRaw || '0'),
            expiresInSeconds: cdTTL,
            isExpired: cdTTL <= 0,
        };
    }

    // ════════════════════════════════════════════
    //  Refresh Tokens
    // ════════════════════════════════════════════

    /**
     * Store a refresh token in Redis with TTL.
     * Also maintains a SET of tokens per user (for logout-all support).
     */
    async storeRefreshToken(userId, token, metadata = {}) {
        const redis = getRedisClient();
        const tokenKey = key(PREFIX.REFRESH, token);
        const userSetKey = key(PREFIX.REFRESH_USER, userId.toString());

        const payload = JSON.stringify({
            userId: userId.toString(),
            ipAddress: metadata.ipAddress || null,
            userAgent: metadata.userAgent || null,
            createdAt: Date.now(),
        });

        const pipeline = redis.pipeline();
        // Store token data
        pipeline.set(tokenKey, payload, 'EX', TTL.REFRESH);
        // Add to user's token set (for bulk-revoke)
        pipeline.sadd(userSetKey, token);
        pipeline.expire(userSetKey, TTL.REFRESH);
        await pipeline.exec();
    }

    /**
     * Lookup a refresh token. Returns payload or null if not found / expired.
     */
    async getRefreshToken(token) {
        const redis = getRedisClient();
        const raw = await redis.get(key(PREFIX.REFRESH, token));
        if (!raw) return null;
        return JSON.parse(raw);
    }

    /**
     * Delete a single refresh token (logout).
     */
    async deleteRefreshToken(userId, token) {
        const redis = getRedisClient();
        const pipeline = redis.pipeline();
        pipeline.del(key(PREFIX.REFRESH, token));
        pipeline.srem(key(PREFIX.REFRESH_USER, userId.toString()), token);
        await pipeline.exec();
    }

    /**
     * Delete all refresh tokens for a user (logout-all / password change).
     */
    async deleteAllRefreshTokensForUser(userId) {
        const redis = getRedisClient();
        const userSetKey = key(PREFIX.REFRESH_USER, userId.toString());

        const tokens = await redis.smembers(userSetKey);
        if (!tokens.length) return;

        const pipeline = redis.pipeline();
        for (const token of tokens) {
            pipeline.del(key(PREFIX.REFRESH, token));
        }
        pipeline.del(userSetKey);
        await pipeline.exec();
    }

    // ════════════════════════════════════════════
    //  Access Token Blocklist (logout)
    // ════════════════════════════════════════════

    /**
     * Blocklist an access token by its JTI (JWT ID).
     * TTL = remaining lifetime of the token.
     */
    async blockAccessToken(jti, ttlSeconds = TTL.ACCESS_BLOCKLIST) {
        const redis = getRedisClient();
        await redis.set(key(PREFIX.ACCESS_BLOCKLIST, jti), '1', 'EX', ttlSeconds);
    }

    /**
     * Check if an access token JTI is blocklisted.
     */
    async isAccessTokenBlocked(jti) {
        const redis = getRedisClient();
        const result = await redis.get(key(PREFIX.ACCESS_BLOCKLIST, jti));
        return result !== null;
    }

    // ════════════════════════════════════════════
    //  Generic Secure Token (password-reset links, email verify links)
    // ════════════════════════════════════════════

    /**
     * Generate & store a cryptographically secure random token.
     * @param {string} purpose - e.g. 'password_reset', 'email_verify'
     * @param {string} identifier - usually user email or userId
     * @param {number} ttlSeconds - how long the token lives
     * @returns {string} plaintext token (send this to user)
     */
    async createSecureToken(purpose, identifier, ttlSeconds = 30 * 60) {
        const redis = getRedisClient();
        // 32 bytes = 64 hex chars — cryptographically secure
        const token = crypto.randomBytes(32).toString('hex');
        const tokenKey = key('stk', purpose, token);

        const payload = JSON.stringify({
            identifier: identifier.toLowerCase(),
            purpose,
            createdAt: Date.now(),
        });

        await redis.set(tokenKey, payload, 'EX', ttlSeconds);

        // Also store reverse mapping so a user can't have > 1 open reset
        const userKey = key('stk:id', purpose, identifier.toLowerCase());
        // Delete any previous token for this user+purpose
        const oldToken = await redis.get(userKey);
        if (oldToken) {
            await redis.del(key('stk', purpose, oldToken));
        }
        await redis.set(userKey, token, 'EX', ttlSeconds);

        return token;
    }

    /**
     * Validate a secure token. Returns the matched identifier or null.
     */
    async validateSecureToken(purpose, token) {
        const redis = getRedisClient();
        const raw = await redis.get(key('stk', purpose, token));
        if (!raw) return null;
        return JSON.parse(raw);
    }

    /**
     * Consume (validate + delete) a secure token — one-time use.
     */
    async consumeSecureToken(purpose, token) {
        const redis = getRedisClient();
        const tokenKey = key('stk', purpose, token);
        const raw = await redis.get(tokenKey);
        if (!raw) return null;

        const data = JSON.parse(raw);

        // Delete both token and the reverse mapping
        const pipeline = redis.pipeline();
        pipeline.del(tokenKey);
        pipeline.del(key('stk:id', purpose, data.identifier));
        await pipeline.exec();

        return data;
    }
}

module.exports = new RedisTokenService();
