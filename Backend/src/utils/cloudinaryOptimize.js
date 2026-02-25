/**
 * Cloudinary Image Optimization Utility
 * Transforms raw image URLs to use Cloudinary's f_auto, q_auto
 * for automatic format and quality optimization.
 */

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

/**
 * Convert a raw Cloudinary URL to an optimized version.
 * Applies f_auto (auto-format) and q_auto (auto-quality)
 * for the smallest possible high-quality image.
 *
 * @param {string} url - The original image URL
 * @param {object} options - Additional transform options
 * @param {number} [options.width] - Resize width
 * @param {number} [options.height] - Resize height
 * @param {string} [options.crop] - Crop mode (fill, fit, limit, etc.)
 * @param {string} [options.gravity] - Gravity for crop (auto, face, center)
 * @returns {string} Optimized URL
 */
function optimizeCloudinaryUrl(url, options = {}) {
    if (!url) return url;

    // Already has optimization transforms
    if (url.includes('f_auto') && url.includes('q_auto')) return url;

    // Only transform Cloudinary URLs
    if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
        return url;
    }

    // Build transformation string
    const transforms = ['f_auto', 'q_auto'];

    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.crop) transforms.push(`c_${options.crop}`);
    if (options.gravity) transforms.push(`g_${options.gravity}`);

    const transformStr = transforms.join(',');

    // Insert transform after /upload/
    const optimized = url.replace(
        /\/upload\//,
        `/upload/${transformStr}/`
    );

    return optimized;
}

/**
 * Optimize an array of product images
 * @param {Array} images - Array of { public_id, url } objects
 * @param {object} options - Transform options
 * @returns {Array} Optimized images
 */
function optimizeProductImages(images, options = {}) {
    if (!images || !Array.isArray(images)) return images;

    return images.map(img => ({
        ...img,
        url: optimizeCloudinaryUrl(img.url, options),
        // Keep original URL for fallback
        originalUrl: img.url,
    }));
}

/**
 * Generate responsive image srcset for Cloudinary images
 * @param {string} url - Base image URL
 * @param {number[]} widths - Array of widths for srcset
 * @returns {string} srcset string
 */
function generateSrcSet(url, widths = [320, 640, 960, 1280]) {
    if (!url || !url.includes('cloudinary.com')) return '';

    return widths.map(w => {
        const optimized = optimizeCloudinaryUrl(url, { width: w, crop: 'limit' });
        return `${optimized} ${w}w`;
    }).join(', ');
}

module.exports = {
    optimizeCloudinaryUrl,
    optimizeProductImages,
    generateSrcSet,
};
