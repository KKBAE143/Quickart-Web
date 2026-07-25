/**
 * Rate Limiting Middleware using Upstash Redis
 * 
 * This middleware protects the API from abuse, brute force attacks, and resource exhaustion.
 * It uses Upstash Redis for distributed rate limiting that works across multiple server instances.
 * 
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - IP-based and user-based identification
 * - Multiple strategies for different endpoints
 * - Detailed rate limit headers in responses
 * - Production-ready error handling
 * 
 * Rate Limit Strategies (ECOMMERCE OPTIMIZED):
 * 1. authLimiter - Strict limit for login/register (5 attempts per 15 minutes)
 * 2. emailLimiter - Strict limit for OTP/email (3 requests per 5 minutes)
 * 3. paymentLimiter - Moderate limit for payments (10 requests per hour)
 * 4. productBrowsingLimiter - VERY GENEROUS for product viewing (1000 per 15 min)
 * 5. searchLimiter - Generous limit for search (100 requests per minute)
 * 6. cartLimiter - Moderate limit for cart operations (200 per 15 minutes)
 * 7. apiLimiter - General protection (100 requests per 15 minutes)
 * 8. adminLimiter - Higher limit for admin operations (200 requests per 15 minutes)
 */

import { Ratelimit } from '@upstash/ratelimit';
import redis from '../config/upstash.js';

// Create different rate limiters for different use cases

/**
 * Authentication Rate Limiter
 * 
 * Protects login, register, and authentication endpoints from brute force attacks.
 * 
 * Limit: 5 requests per 15 minutes per IP
 * Window: Sliding window (accurate counting)
 */
const authLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

/**
 * Email/OTP Rate Limiter
 * 
 * Protects email verification and OTP endpoints from spam.
 * Prevents users from requesting too many verification emails/OTPs.
 * 
 * Limit: 3 requests per 5 minutes per IP
 * Window: Sliding window
 */
const emailLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'),
  analytics: true,
  prefix: 'ratelimit:email',
});

/**
 * Payment Rate Limiter
 * 
 * Protects payment endpoints from fraud and abuse.
 * Limits how many payment attempts a user can make.
 * 
 * Limit: 10 requests per hour per IP
 * Window: Sliding window
 */
const paymentLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  analytics: true,
  prefix: 'ratelimit:payment',
});

/**
 * Product Browsing Rate Limiter (ECOMMERCE OPTIMIZED)
 * 
 * Very generous limits for product viewing/browsing.
 * Quick commerce platforms need users to browse many products rapidly.
 * Allows displaying multiple categories, infinite scroll, rapid browsing.
 * 
 * Limit: 1000 requests per 15 minutes per IP (~67 per minute)
 * Window: Sliding window
 * 
 * This covers:
 * - Product listings by category/subcategory
 * - Product detail pages
 * - Related products
 * - Featured products
 * - Recently viewed
 */
const productBrowsingLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1000, '15 m'),
  analytics: true,
  prefix: 'ratelimit:product-browsing',
});

/**
 * Search Rate Limiter (ECOMMERCE OPTIMIZED)
 * 
 * Generous limits for product search.
 * Users type fast and search frequently in quick commerce.
 * 
 * Limit: 100 requests per minute per IP
 * Window: Sliding window
 */
const searchLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:search',
});

/**
 * Cart Operations Rate Limiter (ECOMMERCE OPTIMIZED)
 * 
 * Moderate limits for cart operations.
 * Users add/remove items frequently while shopping.
 * 
 * Limit: 200 requests per 15 minutes per IP (~13 per minute)
 * Window: Sliding window
 */
const cartLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(200, '15 m'),
  analytics: true,
  prefix: 'ratelimit:cart',
});

/**
 * General API Rate Limiter
 * 
 * Default protection for all API endpoints.
 * Prevents general abuse and resource exhaustion.
 * 
 * Limit: 100 requests per 15 minutes per IP
 * Window: Sliding window
 */
const apiLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Admin Operations Rate Limiter
 * 
 * Higher limits for authenticated admin users.
 * Allows admins to perform more operations.
 * 
 * Limit: 200 requests per 15 minutes per user
 * Window: Sliding window
 */
const adminLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(200, '15 m'),
  analytics: true,
  prefix: 'ratelimit:admin',
});

/**
 * Helper function to get identifier for rate limiting
 * 
 * Uses user ID if authenticated, otherwise falls back to IP address.
 * This provides better user experience for logged-in users while
 * still protecting against unauthenticated abuse.
 * 
 * @param {Object} req - Express request object
 * @returns {string} - Identifier (user ID or IP address)
 */
function getIdentifier(req) {
  // Use user ID if authenticated (from auth middleware)
  if (req.userId) {
    return `user:${req.userId}`;
  }
  
  // Otherwise use IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || req.connection.remoteAddress;
  return `ip:${ip}`;
}

/**
 * Create rate limiter middleware
 * 
 * Returns Express middleware that applies the given rate limiter.
 * Includes detailed headers and error messages.
 * 
 * @param {Ratelimit} limiter - The rate limiter to use
 * @param {string} name - Name of the limiter (for error messages)
 * @returns {Function} - Express middleware function
 */
function createRateLimiterMiddleware(limiter, name) {
  return async (req, res, next) => {
    try {
      // Skip rate limiting if Upstash is not configured (development mode)
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return next();
      }

      const identifier = getIdentifier(req);
      const { success, limit, reset, remaining } = await limiter.limit(identifier);

      // Add rate limit headers to response
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());

      if (!success) {
        const resetTime = Math.ceil((reset - Date.now()) / 1000);
        const minutes = Math.ceil(resetTime / 60);

        return res.status(429).json({
          message: `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          error: true,
          retryAfter: resetTime,
          limit,
          reset: new Date(reset).toISOString(),
        });
      }

      next();
    } catch (error) {
      // Log error but don't block request if rate limiting fails
      console.error(`Rate limiter error (${name}):`, error.message);
      // Allow request to proceed if rate limiting fails (graceful degradation)
      next();
    }
  };
}

// Export middleware functions
export const rateLimitAuth = createRateLimiterMiddleware(authLimiter, 'auth');
export const rateLimitEmail = createRateLimiterMiddleware(emailLimiter, 'email');
export const rateLimitPayment = createRateLimiterMiddleware(paymentLimiter, 'payment');
export const rateLimitProductBrowsing = createRateLimiterMiddleware(productBrowsingLimiter, 'product-browsing');
export const rateLimitSearch = createRateLimiterMiddleware(searchLimiter, 'search');
export const rateLimitCart = createRateLimiterMiddleware(cartLimiter, 'cart');
export const rateLimitApi = createRateLimiterMiddleware(apiLimiter, 'api');
export const rateLimitAdmin = createRateLimiterMiddleware(adminLimiter, 'admin');

// Export the limiters themselves (for testing)
export {
  authLimiter,
  emailLimiter,
  paymentLimiter,
  productBrowsingLimiter,
  searchLimiter,
  cartLimiter,
  apiLimiter,
  adminLimiter,
};

