const jwt = require('jsonwebtoken');
const User = require('../Modal/User');
const asyncHandler = require('./asyncHandler');
const redisTokenService = require('../Service/redisTokenService');

/**
 * Auth middleware - Verifies JWT access token
 * Also checks the Redis blocklist for revoked tokens (logout support)
 * Attaches user to req.user
 */
const authenticate = asyncHandler(async (req, res, next) => {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies
    else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. No token provided.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.Secret_jwt_token);

        // ── Blocklist check (Redis only, skip if Redis unavailable) ──────────
        if (decoded.jti && redisTokenService.isAvailable()) {
            const isBlocked = await redisTokenService.isAccessTokenBlocked(decoded.jti);
            if (isBlocked) {
                return res.status(401).json({
                    success: false,
                    message: 'Token has been revoked. Please login again.',
                });
            }
        }

        const user = await User.findById(decoded.userId || decoded._id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token is invalid.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated.',
            });
        }

        // Attach jti for logout use
        req.user = user;
        req.tokenJti = decoded.jti || null;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please refresh your token.',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Invalid token.',
        });
    }
});

module.exports = authenticate;
