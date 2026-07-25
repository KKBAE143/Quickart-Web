/**
 * Upstash Redis Configuration
 * 
 * This file configures the connection to Upstash Redis for rate limiting.
 * Upstash is a serverless Redis service that works across multiple instances
 * and persists rate limits across server restarts.
 * 
 * Setup:
 * 1. Create account at https://upstash.com/
 * 2. Create a Redis database
 * 3. Copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env
 * 
 * Free tier includes:
 * - 10,000 commands per day
 * - 256 MB storage
 * - Perfect for most small to medium applications
 */

import { Redis } from '@upstash/redis';

// Check if Upstash credentials are configured
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('⚠️  Upstash Redis not configured. Rate limiting will not work!');
  console.warn('   Please add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env');
}

// Create Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default redis;

