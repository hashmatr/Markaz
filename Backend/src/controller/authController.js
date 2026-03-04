const authService = require('../Service/authService');
const asyncHandler = require('../middleware/asyncHandler');
const { refreshCookieOptions, clearRefreshCookieOptions } = require('../utils/cookieOptions');

class AuthController {
    /**
     * POST /api/auth/register
     */
    register = asyncHandler(async (req, res) => {
        const { user, tokens } = await authService.register(req.body);

        // Set refresh token in httpOnly cookie (cross-origin safe for Vercel ↔ K8s)
        res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions());

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user,
                accessToken: tokens.accessToken,
            },
        });
    });

    /**
     * POST /api/auth/login
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const { user, tokens } = await authService.login(email, password);

        res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions());

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                accessToken: tokens.accessToken,
            },
        });
    });

    /**
     * POST /api/auth/refresh-token
     */
    refreshToken = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        const { user, tokens } = await authService.refreshToken(refreshToken);

        res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions());

        return res.status(200).json({
            success: true,
            message: 'Token refreshed',
            data: {
                user,
                accessToken: tokens.accessToken,
            },
        });
    });

    /**
     * POST /api/auth/logout
     */
    logout = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        // Pass jti so the current access token is immediately blocklisted in Redis
        await authService.logout(refreshToken, req.user?._id, req.tokenJti);

        // Must pass matching sameSite/secure options or browser won't clear it
        res.clearCookie('refreshToken', clearRefreshCookieOptions());

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    });

    /**
     * GET /api/auth/profile
     */
    getProfile = asyncHandler(async (req, res) => {
        const user = await authService.getProfile(req.user._id);

        return res.status(200).json({
            success: true,
            data: { user },
        });
    });

    /**
     * PUT /api/auth/profile
     */
    updateProfile = asyncHandler(async (req, res) => {
        const user = await authService.updateProfile(req.user._id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user },
        });
    });

    /**
     * PUT /api/auth/change-password
     */
    changePassword = asyncHandler(async (req, res) => {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const { user, tokens } = await authService.changePassword(
            req.user._id,
            currentPassword,
            newPassword,
            confirmPassword
        );

        res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions());

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            data: {
                user,
                accessToken: tokens.accessToken,
            },
        });
    });
}

module.exports = new AuthController();
