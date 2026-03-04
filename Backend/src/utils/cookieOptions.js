/**
 * cookieOptions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised cookie configuration for refresh-token cookies.
 *
 * WHY sameSite: 'none' in production?
 * ─────────────────────────────────────
 * The frontend is deployed on Vercel (e.g. markaz.vercel.app) and the backend
 * runs on Kubernetes at a different domain (e.g. api.markaz.pk).
 * Cross-origin cookie sharing requires:
 *   • sameSite: 'none'  — allows the cookie to be sent in cross-site requests
 *   • secure: true      — mandatory whenever sameSite is 'none' (HTTPS only)
 *
 * In local development both services run on localhost so sameSite: 'lax'
 * is correct and secure: false avoids the HTTPS requirement on plain http.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Options for setting the refresh-token cookie.
 * @param {number} [maxAgeMs=7days]  - Cookie lifetime in milliseconds
 */
const refreshCookieOptions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => ({
    httpOnly: true,                            // Never readable by JS
    secure: IS_PRODUCTION,                     // HTTPS only in production
    sameSite: IS_PRODUCTION ? 'none' : 'lax', // 'none' required for cross-origin
    path: '/',
    maxAge: maxAgeMs,
});

/**
 * Options for clearing the refresh-token cookie.
 * MUST match the Set-Cookie attributes used when the cookie was set,
 * otherwise the browser won't remove it.
 */
const clearRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    path: '/',
});

module.exports = { refreshCookieOptions, clearRefreshCookieOptions };
