const User = require('../Modal/User');
const RefreshToken = require('../Modal/RefreshToken');
const Seller = require('../Modal/seller');
const generateTokens = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');
const redisTokenService = require('./redisTokenService');

// ── Helper: store refresh token (Redis primary, MongoDB fallback) ─────────────
async function storeRefresh(userId, token, metadata = {}) {
    if (redisTokenService.isAvailable()) {
        await redisTokenService.storeRefreshToken(userId, token, metadata);
    } else {
        await RefreshToken.create({
            user: userId,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
        });
    }
}

// ── Helper: lookup refresh token ─────────────────────────────────────────────
async function findRefresh(token) {
    if (redisTokenService.isAvailable()) {
        return await redisTokenService.getRefreshToken(token);
    }
    return await RefreshToken.findOne({ token });
}

// ── Helper: delete one refresh token ─────────────────────────────────────────
async function removeRefresh(userId, token) {
    if (redisTokenService.isAvailable()) {
        await redisTokenService.deleteRefreshToken(userId, token);
    } else {
        await RefreshToken.findOneAndDelete({ token });
    }
}

// ── Helper: delete all refresh tokens for a user ─────────────────────────────
async function removeAllRefreshForUser(userId) {
    if (redisTokenService.isAvailable()) {
        await redisTokenService.deleteAllRefreshTokensForUser(userId);
    } else {
        await RefreshToken.deleteMany({ user: userId });
    }
}

class AuthService {
    /**
     * Register a new user
     */
    async register(userData, metadata = {}) {
        const { fullName, email, password, role } = userData;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw Object.assign(new Error('User with this email already exists'), { status: 409 });
        }

        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
            role: role || 'CUSTOMER',
        });

        if (role === 'SELLER') {
            const storeName = `${fullName}'s Store`;
            await Seller.create({
                user: user._id,
                storeName,
                storeSlug: slugify(storeName, { lower: true, strict: true }) + '-' + Date.now(),
                businessEmail: email.toLowerCase(),
                businessPhone: 'Pending',
            });
        }

        const tokens = generateTokens(user);
        await storeRefresh(user._id, tokens.refreshToken, metadata);

        return { user, tokens };
    }

    /**
     * Login user
     */
    async login(email, password, metadata = {}) {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });
        if (!user.isActive) throw Object.assign(new Error('Your account has been deactivated'), { status: 403 });

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

        const tokens = generateTokens(user);
        await storeRefresh(user._id, tokens.refreshToken, metadata);

        return { user, tokens };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw Object.assign(new Error('Refresh token is required'), { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
        }

        // Verify token in store
        const stored = await findRefresh(refreshToken);
        if (!stored) {
            throw Object.assign(new Error('Refresh token not found. Please login again.'), { status: 401 });
        }

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            throw Object.assign(new Error('User not found or deactivated'), { status: 401 });
        }

        // Rotate: delete old, issue new
        await removeRefresh(user._id, refreshToken);
        const tokens = generateTokens(user);
        await storeRefresh(user._id, tokens.refreshToken, {});

        return { user, tokens };
    }

    /**
     * Logout — remove refresh token (and optionally blocklist access token)
     */
    async logout(refreshToken, userId, accessTokenJti = null) {
        if (refreshToken && userId) {
            await removeRefresh(userId, refreshToken);
        } else if (userId) {
            await removeAllRefreshForUser(userId);
        }

        // Blocklist the current access token so it can't be reused until it expires
        if (accessTokenJti && redisTokenService.isAvailable()) {
            await redisTokenService.blockAccessToken(accessTokenJti);
        }

        return true;
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = await User.findById(userId).populate('addresses');
        if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        const allowedUpdates = ['fullName', 'phone', 'avatar'];
        const updates = {};
        for (const k of allowedUpdates) {
            if (updateData[k] !== undefined) updates[k] = updateData[k];
        }

        const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
        if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
        return user;
    }

    /**
     * Change password — invalidates all sessions
     */
    async changePassword(userId, currentPassword, newPassword, confirmPassword) {
        if (newPassword !== confirmPassword) {
            throw Object.assign(new Error('Passwords do not match'), { status: 400 });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });

        user.password = newPassword;
        await user.save();

        // Revoke all sessions
        await removeAllRefreshForUser(userId);

        // Issue new tokens
        const tokens = generateTokens(user);
        await storeRefresh(user._id, tokens.refreshToken, {});

        return { user, tokens };
    }
}

module.exports = new AuthService();
