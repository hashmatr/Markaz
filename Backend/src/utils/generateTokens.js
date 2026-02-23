const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate access and refresh token pair.
 * Access token includes a `jti` (JWT ID) for blocklist-based revocation.
 * @param {Object} user - User document
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = (user) => {
    const jti = crypto.randomBytes(16).toString('hex'); // unique token ID for blocklisting

    const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
        jti, // embedded in access token for Redis blocklist lookup on logout
    };

    const accessToken = jwt.sign(payload, process.env.Secret_jwt_token, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    // Refresh token doesn't include jti (managed separately in Redis/DB)
    const refreshToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

module.exports = generateTokens;
