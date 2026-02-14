const jwt = require('jsonwebtoken');

/**
 * Generate access and refresh token pair
 * @param {Object} user - User document
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.Secret_jwt_token, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
};

module.exports = generateTokens;
