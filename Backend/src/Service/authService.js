const User = require('../Modal/User');
const RefreshToken = require('../Modal/RefreshToken');
const Seller = require('../Modal/seller');
const generateTokens = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');

class AuthService {
    /**
     * Register a new user
     */
    async register(userData) {
        const { fullName, email, password, role } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw Object.assign(new Error('User with this email already exists'), { status: 409 });
        }

        // Create user
        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
            role: role || 'CUSTOMER',
        });

        // If registering as a seller, create a skeleton seller profile
        if (role === 'SELLER') {
            const storeName = `${fullName}'s Store`;
            await Seller.create({
                user: user._id,
                storeName: storeName,
                storeSlug: slugify(storeName, { lower: true, strict: true }) + '-' + Date.now(),
                businessEmail: email.toLowerCase(),
                businessPhone: 'Pending', // Placeholder
            });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Save refresh token
        await RefreshToken.create({
            user: user._id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        return { user, tokens };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Find user with password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            throw Object.assign(new Error('Invalid email or password'), { status: 401 });
        }

        if (!user.isActive) {
            throw Object.assign(new Error('Your account has been deactivated'), { status: 403 });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw Object.assign(new Error('Invalid email or password'), { status: 401 });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Save refresh token
        await RefreshToken.create({
            user: user._id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return { user, tokens };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw Object.assign(new Error('Refresh token is required'), { status: 400 });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
        }

        // Check if refresh token exists in DB
        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken) {
            throw Object.assign(new Error('Refresh token not found. Please login again.'), { status: 401 });
        }

        // Get user
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            throw Object.assign(new Error('User not found or deactivated'), { status: 401 });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Replace old refresh token
        await RefreshToken.findByIdAndDelete(storedToken._id);
        await RefreshToken.create({
            user: user._id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return { user, tokens };
    }

    /**
     * Logout - remove refresh token
     */
    async logout(refreshToken, userId) {
        if (refreshToken) {
            await RefreshToken.findOneAndDelete({ token: refreshToken });
        } else if (userId) {
            // Logout from all devices
            await RefreshToken.deleteMany({ user: userId });
        }
        return true;
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = await User.findById(userId).populate('addresses');
        if (!user) {
            throw Object.assign(new Error('User not found'), { status: 404 });
        }
        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        const allowedUpdates = ['fullName', 'phone', 'avatar'];
        const updates = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                updates[key] = updateData[key];
            }
        }

        const user = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            throw Object.assign(new Error('User not found'), { status: 404 });
        }

        return user;
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword, confirmPassword) {
        if (newPassword !== confirmPassword) {
            throw Object.assign(new Error('Passwords do not match'), { status: 400 });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            throw Object.assign(new Error('User not found'), { status: 404 });
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw Object.assign(new Error('Current password is incorrect'), { status: 400 });
        }

        user.password = newPassword;
        await user.save();

        // Invalidate all refresh tokens
        await RefreshToken.deleteMany({ user: userId });

        // Generate new tokens
        const tokens = generateTokens(user);
        await RefreshToken.create({
            user: user._id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return { user, tokens };
    }
}

module.exports = new AuthService();
