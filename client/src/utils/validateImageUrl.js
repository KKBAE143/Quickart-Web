/**
 * Comprehensive Image URL Validation Utility
 * 
 * This utility validates and sanitizes image URLs to prevent
 * "URI malformed" errors in Vite dev server
 */

/**
 * Validate if a URL is safe to use as image source
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if URL is valid and safe
 */
export function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url === 'null' || url === 'undefined' || url === '' || url.trim() === '') return false;
    
    // Check for control characters (0x00-0x1F, 0x7F) that cause URI malformed errors
    if (/[\x00-\x1F\x7F]/.test(url)) {
        console.warn('[Image Validation] Control characters detected in URL:', url.substring(0, 50));
        return false;
    }
    
    // Must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.warn('[Image Validation] Invalid protocol in URL:', url.substring(0, 50));
        return false;
    }
    
    try {
        // Try to decode the URL first to check if it's properly encoded
        const decoded = decodeURI(url);
        // Validate URL structure
        const urlObj = new URL(decoded);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (err) {
        // If decoding fails, try with original URL
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (err2) {
            console.warn('[Image Validation] Failed to parse URL:', url.substring(0, 50), err2.message);
            return false;
        }
    }
}

/**
 * Safely encode a URL for use in image src
 * @param {string} url - The URL to encode
 * @returns {string} - Safely encoded URL or empty string if invalid
 */
export function safeEncodeImageUrl(url) {
    if (!isValidImageUrl(url)) return '';
    
    try {
        // Double encode/decode to ensure clean URL
        return encodeURI(decodeURI(url));
    } catch {
        // If encoding fails, return original if it's valid
        return url;
    }
}

/**
 * Clean an array of image URLs
 * @param {Array} images - Array of image URLs
 * @returns {Array} - Filtered array with only valid URLs
 */
export function cleanImageArray(images) {
    if (!images || !Array.isArray(images)) return [];
    
    const validImages = images.filter(isValidImageUrl);
    
    // Log if any images were filtered out
    if (images.length > validImages.length) {
        console.warn(`[Image Validation] Filtered out ${images.length - validImages.length} invalid image URL(s)`);
    }
    
    return validImages;
}

/**
 * Get a safe image URL or fallback
 * @param {string} url - The image URL
 * @param {string} fallback - Fallback URL if validation fails
 * @returns {string} - Valid URL or fallback
 */
export function getSafeImageUrl(url, fallback = '') {
    return isValidImageUrl(url) ? safeEncodeImageUrl(url) : fallback;
}

export default {
    isValidImageUrl,
    safeEncodeImageUrl,
    cleanImageArray,
    getSafeImageUrl
};

