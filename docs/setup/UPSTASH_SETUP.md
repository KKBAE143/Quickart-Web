# 🚀 Upstash Redis Rate Limiting Setup Guide

This guide will walk you through setting up Upstash Redis for rate limiting in the Quickart platform.

---

## 📋 Table of Contents

1. [Why Upstash Redis?](#why-upstash-redis)
2. [Quick Setup (5 Minutes)](#quick-setup-5-minutes)
3. [Environment Variables](#environment-variables)
4. [Testing Rate Limiting](#testing-rate-limiting)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Why Upstash Redis?

Upstash Redis is a serverless Redis service specifically designed for modern applications:

### Benefits:
- ✅ **Serverless & Scalable** - No infrastructure management
- ✅ **Persistent** - Rate limits survive server restarts
- ✅ **Distributed** - Works across multiple server instances
- ✅ **Free Tier** - 10,000 commands/day (perfect for small to medium apps)
- ✅ **Low Latency** - Global edge locations
- ✅ **Auto-scaling** - Handles traffic spikes automatically

### Free Tier Includes:
- **10,000 commands per day** - Sufficient for most applications
- **256 MB storage** - More than enough for rate limiting data
- **Global replication** - Fast worldwide access
- **TLS encryption** - Secure by default

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Create Upstash Account

1. Go to [https://upstash.com/](https://upstash.com/)
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up using:
   - GitHub (recommended)
   - Google
   - Email

### Step 2: Create Redis Database

1. After login, click **"+ Create Database"** in the dashboard
2. Configure your database:

   **Database Name:** Enter a name (e.g., `quickart-ratelimit`)
   
   **Primary Region:** Select the region closest to your server:
   - India: `ap-south-1` (Mumbai)
   - US East: `us-east-1` (Virginia)
   - Europe: `eu-west-1` (Ireland)
   - Asia: `ap-southeast-1` (Singapore)
   
   **Type:** Select **"Regional"** (Free tier)
   
   **TLS:** Keep enabled (default)
   
3. Click **"Create"**

### Step 3: Get Database Credentials

Once created, you'll see your database dashboard with:

```
UPSTASH_REDIS_REST_URL: https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN: AXX0dXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 4: Add to Environment Variables

Add these credentials to your `server/.env` file:

```env
# Upstash Redis Configuration (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX0dXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

⚠️ **Important:** Keep these credentials **secret**! Never commit them to git.

### Step 5: Restart Server

```bash
# Stop server (Ctrl+C)
# Start server
cd server
npm run dev
```

You should see in console:
```
✅ Upstash Redis connected successfully!
```

---

## 🔧 Environment Variables

### Required Variables

Add to `server/.env`:

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Optional: Skip Rate Limiting in Development

If you want to skip rate limiting during local development (not recommended):

```env
# Skip rate limiting (not recommended)
SKIP_RATE_LIMITING=true
```

### Getting Credentials from Dashboard

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click on your database
3. Copy **REST API** credentials:
   - `UPSTASH_REDIS_REST_URL` - The endpoint URL
   - `UPSTASH_REDIS_REST_TOKEN` - The authentication token

---

## 🧪 Testing Rate Limiting

### Test Authentication Rate Limit (5 requests per 15 minutes)

```bash
# Try logging in 6 times rapidly
curl -X POST http://localhost:8080/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# After 5 attempts, you should get:
# {
#   "message": "Too many requests. Please try again in 15 minutes.",
#   "error": true,
#   "retryAfter": 900
# }
```

### Test Email Rate Limit (3 requests per 5 minutes)

```bash
# Try sending forgot password email 4 times
curl -X PUT http://localhost:8080/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# After 3 attempts:
# {
#   "message": "Too many requests. Please try again in 5 minutes.",
#   "error": true
# }
```

### Check Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2025-11-02T22:30:00.000Z
```

### Monitor in Upstash Dashboard

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click on your database
3. View **"Metrics"** tab to see:
   - Commands per second
   - Storage usage
   - Request latency

---

## 🔍 Troubleshooting

### Issue: Rate Limiting Not Working

**Symptoms:**
- Can make unlimited requests
- No rate limit headers in responses

**Solution:**
```bash
# Check if environment variables are set
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Should NOT be empty. If empty, add them to .env and restart server
```

### Issue: "Upstash Redis not configured" Warning

**Error Message:**
```
⚠️  Upstash Redis not configured. Rate limiting will not work!
```

**Solution:**
1. Check `server/.env` has both variables
2. Restart server: `npm run dev`
3. Verify variables are loaded:
   ```javascript
   console.log(process.env.UPSTASH_REDIS_REST_URL)
   ```

### Issue: "Too Many Requests" Error During Testing

**This is expected behavior!** Rate limiting is working correctly.

**Solutions:**
1. Wait for the time period to expire
2. Use a different IP address (VPN)
3. Clear rate limits in Upstash Dashboard:
   ```bash
   # Connect to Upstash CLI
   redis-cli -u $UPSTASH_REDIS_REST_URL -a $UPSTASH_REDIS_REST_TOKEN
   
   # Clear all rate limits
   FLUSHDB
   ```

### Issue: High Latency

**Symptoms:**
- Slow response times (>500ms)
- Timeout errors

**Solution:**
1. **Check Region:** Ensure Upstash region is close to your server
   ```
   India server → Mumbai region (ap-south-1)
   US server → Virginia region (us-east-1)
   ```

2. **Upgrade Plan:** Free tier has 256MB limit. Upgrade if needed:
   - **Pro:** $10/month - 10GB storage
   - **Enterprise:** Custom pricing

### Issue: Free Tier Limit Exceeded

**Error:** `Daily command limit exceeded`

**Solution:**
1. **Check Usage:** Go to Upstash Dashboard → Metrics
2. **Optimize:**
   - Increase rate limit windows (less Redis operations)
   - Use caching for non-critical checks
3. **Upgrade:** $0.20 per 100K requests after free tier

### Issue: Connection Errors

**Error:** `Failed to connect to Upstash Redis`

**Solution:**
1. **Check Credentials:** Verify URL and token are correct
2. **Check Network:** Ensure server can reach Upstash (not blocked by firewall)
3. **Check Status:** Visit [Upstash Status Page](https://status.upstash.com/)

---

## 📊 Rate Limit Configuration

### Current Limits

| Endpoint Type | Limit | Window | Use Case |
|---------------|-------|--------|----------|
| **Authentication** | 5 requests | 15 minutes | Login, Register |
| **Email/OTP** | 3 requests | 5 minutes | OTP, Password Reset |
| **Payment** | 10 requests | 1 hour | Checkout, Verify |
| **Search** | 30 requests | 1 minute | Product Search |
| **General API** | 100 requests | 15 minutes | All other endpoints |
| **Admin Operations** | 200 requests | 15 minutes | Admin panel |

### Customizing Limits

To adjust limits, edit `server/middleware/rateLimiter.js`:

```javascript
// Example: Increase auth limit from 5 to 10
const authLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'), // Changed from 5 to 10
  analytics: true,
  prefix: 'ratelimit:auth',
});
```

---

## 🎯 Next Steps

1. ✅ **Test rate limiting** on all endpoints
2. 📊 **Monitor usage** in Upstash Dashboard
3. 🔧 **Adjust limits** based on actual traffic
4. 📈 **Upgrade plan** if needed (Pro: $10/month)
5. 🚀 **Deploy to production** with confidence!

---

## 📚 Additional Resources

- **Upstash Documentation:** [https://upstash.com/docs/redis](https://upstash.com/docs/redis)
- **Upstash Console:** [https://console.upstash.com/](https://console.upstash.com/)
- **Rate Limiting Guide:** [https://upstash.com/docs/redis/features/ratelimiting](https://upstash.com/docs/redis/features/ratelimiting)
- **Pricing:** [https://upstash.com/pricing](https://upstash.com/pricing)

---

## ✨ Summary

You now have production-ready rate limiting with Upstash Redis! This protects your platform from:
- 🔒 Brute force attacks
- 📧 Email spam
- 💳 Payment fraud
- 🔍 Resource exhaustion
- 🚀 DDoS attacks

**Total Setup Time:** ~5 minutes
**Cost:** Free (up to 10,000 commands/day)
**Benefit:** Production-grade security ✨

