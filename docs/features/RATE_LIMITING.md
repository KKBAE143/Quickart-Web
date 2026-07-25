# 🔒 Rate Limiting System - Complete Guide

Comprehensive guide to the Upstash Redis-based rate limiting system protecting the Quickart ecommerce platform.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Rate Limiting Strategies](#rate-limiting-strategies)
4. [Protected Endpoints](#protected-endpoints)
5. [Implementation Details](#implementation-details)
6. [Response Format](#response-format)
7. [Testing](#testing)
8. [Monitoring](#monitoring)
9. [Best Practices](#best-practices)

---

## 🎯 Overview

### What is Rate Limiting?

Rate limiting controls how many requests a user or IP address can make to your API within a specific time window. It's essential for:

- 🔒 **Security** - Prevent brute force attacks
- 💰 **Cost Control** - Limit resource consumption
- 📊 **Fair Usage** - Ensure equal access for all users
- 🚀 **Performance** - Prevent server overload
- 🛡️ **DDoS Protection** - Mitigate denial of service attacks

### Why Upstash Redis?

Traditional in-memory rate limiting only works on a single server. Upstash Redis provides:

- ✅ **Distributed** - Works across multiple servers/containers
- ✅ **Persistent** - Survives server restarts
- ✅ **Serverless** - No infrastructure to manage
- ✅ **Low Latency** - Global edge network
- ✅ **Cost-Effective** - Free tier for most applications

---

## 🏗️ Architecture

### System Components

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ Request
       ▼
┌─────────────────────────┐
│   Express Server        │
│  ┌──────────────────┐   │
│  │ Rate Limiter     │   │
│  │ Middleware       │   │
│  └────────┬─────────┘   │
│           │             │
│           ▼             │
│  ┌──────────────────┐   │
│  │ Route Handler    │   │
│  └──────────────────┘   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Upstash Redis         │
│   (Distributed Cache)   │
│                         │
│  Rate Limit Counters:   │
│  - auth:ip:123.45.67.89 │
│  - email:user:abc123    │
│  - payment:ip:...       │
└─────────────────────────┘
```

### Data Flow

1. **Request arrives** at Express server
2. **Rate limiter middleware** intercepts request
3. **Identifier extracted** (User ID or IP address)
4. **Check Upstash Redis** for current count
5. **If under limit** → Allow request, increment counter
6. **If over limit** → Block request, return 429 error
7. **Add headers** to response (limit, remaining, reset)

---

## 🎛️ Rate Limiting Strategies

### 1. Authentication Limiter (`rateLimitAuth`)

**Purpose:** Protect login and registration from brute force attacks

**Configuration:**
```javascript
Limit: 5 requests per 15 minutes
Algorithm: Sliding Window
Prefix: 'ratelimit:auth'
```

**Protected Endpoints:**
- `POST /api/user/login` - User login
- `POST /api/user/register` - User registration
- `PUT /api/user/reset-password` - Password reset

**Why 5 requests?**
- Normal users rarely fail login more than 5 times
- Attackers need thousands of attempts for brute force
- 15-minute cooldown provides good balance

**Example Attack Prevention:**
```
Attacker tries to brute force login:
Request 1: ✅ Allowed (4 remaining)
Request 2: ✅ Allowed (3 remaining)
Request 3: ✅ Allowed (2 remaining)
Request 4: ✅ Allowed (1 remaining)
Request 5: ✅ Allowed (0 remaining)
Request 6: ❌ BLOCKED - "Too many requests. Try again in 15 minutes"
```

### 2. Email/OTP Limiter (`rateLimitEmail`)

**Purpose:** Prevent email spam and OTP abuse

**Configuration:**
```javascript
Limit: 3 requests per 5 minutes
Algorithm: Sliding Window
Prefix: 'ratelimit:email'
```

**Protected Endpoints:**
- `POST /api/user/verify-email` - Email verification
- `PUT /api/user/forgot-password` - Request password reset
- `PUT /api/user/verify-forgot-password-otp` - Verify OTP

**Why 3 requests?**
- Legitimate users rarely need more than 3 OTPs
- Prevents email bombing attacks
- 5-minute window allows retry if email delayed

**Use Case:**
```
User requests password reset:
Request 1: ✅ Email sent (2 remaining)
Request 2: ✅ Email sent (didn't receive first) (1 remaining)
Request 3: ✅ Email sent (last attempt) (0 remaining)
Request 4: ❌ BLOCKED - Wait 5 minutes
```

### 3. Payment Limiter (`rateLimitPayment`)

**Purpose:** Prevent payment fraud and abuse

**Configuration:**
```javascript
Limit: 10 requests per 1 hour
Algorithm: Sliding Window
Prefix: 'ratelimit:payment'
```

**Protected Endpoints:**
- `POST /api/order/cash-on-delivery` - COD orders
- `POST /api/order/razorpay-checkout` - Razorpay order creation
- `POST /api/order/razorpay-verify` - Payment verification
- `POST /api/order/checkout` - Stripe checkout (legacy)

**Why 10 requests per hour?**
- Normal users place 1-3 orders per session
- Allows retries for failed payments
- Prevents rapid-fire fraudulent attempts

**Fraud Prevention:**
```
Fraudster tries stolen cards:
Attempt 1-10: ✅ Processed (card declined by Razorpay)
Attempt 11: ❌ BLOCKED - "Too many payment attempts"

Legitimate user:
Order 1: ✅ Success
Order 2: ✅ Success (another item)
Order 3: ✅ Success (still 7 attempts left)
```

### 4. Search Limiter (`rateLimitSearch`)

**Purpose:** Prevent resource exhaustion from excessive searches

**Configuration:**
```javascript
Limit: 30 requests per 1 minute
Algorithm: Sliding Window
Prefix: 'ratelimit:search'
```

**Protected Endpoints:**
- `POST /api/product/search-product` - Product search

**Why 30 requests per minute?**
- Allows fast typing in search bar (every 2 seconds)
- Prevents automated scraping
- Protects database from heavy queries

**User Experience:**
```
User types "smartphone" character by character:
s        → ✅ Search (29 remaining)
sm       → ✅ Search (28 remaining)
sma      → ✅ Search (27 remaining)
smart    → ✅ Search (26 remaining)
smartp   → ✅ Search (25 remaining)
...
(30 rapid searches) → ✅ Still allowed
(31st search) → ❌ BLOCKED - "Slow down your searches"
```

### 5. General API Limiter (`rateLimitApi`)

**Purpose:** Default protection for all other endpoints

**Configuration:**
```javascript
Limit: 100 requests per 15 minutes
Algorithm: Sliding Window
Prefix: 'ratelimit:api'
```

**Protected Endpoints:**
- Profile updates
- Product browsing
- Cart operations
- Order viewing
- All other non-critical endpoints

**Why 100 requests?**
- Generous limit for normal browsing
- Prevents automated abuse
- Allows smooth user experience

### 6. Admin Limiter (`rateLimitAdmin`)

**Purpose:** Higher limits for authenticated admin users

**Configuration:**
```javascript
Limit: 200 requests per 15 minutes
Algorithm: Sliding Window
Prefix: 'ratelimit:admin'
```

**Protected Endpoints:**
- `POST /api/product/create` - Create products
- `PUT /api/product/update-product-details` - Update products
- `DELETE /api/product/delete-product` - Delete products
- `PUT /api/order/update-status/:orderId` - Update order status

**Why 200 requests?**
- Admins need to perform bulk operations
- Still prevents abuse of admin privileges
- Protects against compromised admin accounts

---

## 🛡️ Protected Endpoints

### Complete Endpoint List

#### Authentication Endpoints (5 per 15 min)
```
POST   /api/user/register               → Register new user
POST   /api/user/login                  → User login
PUT    /api/user/reset-password         → Reset password
```

#### Email/OTP Endpoints (3 per 5 min)
```
POST   /api/user/verify-email           → Verify email address
PUT    /api/user/forgot-password        → Request password reset
PUT    /api/user/verify-forgot-password-otp → Verify OTP
```

#### Payment Endpoints (10 per hour)
```
POST   /api/order/cash-on-delivery      → Place COD order
POST   /api/order/razorpay-checkout     → Create Razorpay order
POST   /api/order/razorpay-verify       → Verify payment
POST   /api/order/checkout              → Stripe checkout (legacy)
```

#### Search Endpoints (30 per min)
```
POST   /api/product/search-product      → Search products
```

#### General API Endpoints (100 per 15 min)
```
PUT    /api/user/upload-avatar          → Upload avatar
PUT    /api/user/update-user            → Update profile
POST   /api/user/refresh-token          → Refresh JWT token
GET    /api/user/user-details           → Get user details
GET    /api/order/order-list            → Get user orders
POST   /api/product/get                 → Get products
POST   /api/product/get-product-by-category → Get by category
POST   /api/product/get-product-details → Get product details
```

#### Admin Endpoints (200 per 15 min)
```
POST   /api/product/create              → Create product
PUT    /api/product/update-product-details → Update product
DELETE /api/product/delete-product      → Delete product
PUT    /api/order/update-status/:orderId → Update order status
```

### Endpoints WITHOUT Rate Limiting

```
POST   /api/order/webhook               → Stripe webhook (Stripe rate limits)
POST   /api/order/razorpay-webhook      → Razorpay webhook (Razorpay rate limits)
GET    /api/user/logout                 → Logout (harmless)
```

**Why no rate limiting on webhooks?**
- Payment providers (Stripe, Razorpay) have their own rate limiting
- Webhooks are authenticated with signatures
- Blocking webhooks could break payment processing

---

## 💻 Implementation Details

### Identifier Strategy

The rate limiter uses two types of identifiers:

#### 1. User-Based (Authenticated Requests)
```javascript
identifier = `user:${userId}`
// Example: user:6729abc123def456789
```

**Benefits:**
- More accurate tracking per user
- Works across different devices/IPs
- Better for mobile users (changing IPs)

#### 2. IP-Based (Unauthenticated Requests)
```javascript
identifier = `ip:${ipAddress}`
// Example: ip:192.168.1.100
```

**Benefits:**
- Works for public endpoints
- Protects before authentication
- Prevents IP-based attacks

### Sliding Window Algorithm

Unlike fixed windows, sliding windows provide accurate rate limiting:

**Fixed Window Problem:**
```
Window 1: [00:00 - 00:15]
User makes 5 requests at 00:14
Window 2: [00:15 - 00:30]
User makes 5 requests at 00:15
Result: 10 requests in 1 minute! ❌
```

**Sliding Window Solution:**
```
At any point, only last 15 minutes count
00:14: 5 requests
00:15: Blocked (still 5 from last 15 min)
00:29: Blocked (still 5 from 00:14)
00:30: Allowed (00:14 requests expired) ✅
```

### Code Structure

**Configuration:** `server/config/upstash.js`
```javascript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

**Middleware:** `server/middleware/rateLimiter.js`
```javascript
import { Ratelimit } from '@upstash/ratelimit';
import redis from '../config/upstash.js';

const authLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

export const rateLimitAuth = createRateLimiterMiddleware(authLimiter, 'auth');
```

**Route Application:** `server/route/user.route.js`
```javascript
import { rateLimitAuth } from '../middleware/rateLimiter.js';

userRouter.post('/login', rateLimitAuth, loginController);
```

---

## 📬 Response Format

### Success Response (Under Limit)

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2025-11-02T22:30:00.000Z
Content-Type: application/json

{
  "message": "Login successful",
  "data": { ... },
  "error": false
}
```

**Headers Explained:**
- `X-RateLimit-Limit` → Maximum requests allowed in window
- `X-RateLimit-Remaining` → Requests left in current window
- `X-RateLimit-Reset` → When the limit resets (ISO 8601 timestamp)

### Error Response (Over Limit)

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-11-02T22:30:00.000Z
Content-Type: application/json

{
  "message": "Too many requests. Please try again in 15 minutes.",
  "error": true,
  "retryAfter": 900,
  "limit": 5,
  "reset": "2025-11-02T22:30:00.000Z"
}
```

**Fields Explained:**
- `message` → Human-readable error message
- `error` → Always `true` for errors
- `retryAfter` → Seconds until reset
- `limit` → Maximum allowed requests
- `reset` → ISO timestamp when limit resets

---

## 🧪 Testing

### Manual Testing with cURL

#### Test Auth Rate Limit
```bash
# Send 6 rapid login attempts
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:8080/api/user/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i
  echo "\n---\n"
done

# Expected: First 5 succeed (401), 6th blocked (429)
```

#### Test Email Rate Limit
```bash
# Send 4 forgot password requests
for i in {1..4}; do
  echo "Attempt $i:"
  curl -X PUT http://localhost:8080/api/user/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}' \
    -i
  echo "\n---\n"
done

# Expected: First 3 succeed, 4th blocked (429)
```

#### Test Payment Rate Limit
```bash
# Test with authentication token
TOKEN="your-jwt-token"

for i in {1..11}; do
  echo "Payment Attempt $i:"
  curl -X POST http://localhost:8080/api/order/razorpay-checkout \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"addressId":"abc123","cartItems":[]}' \
    -i
  echo "\n---\n"
done

# Expected: First 10 succeed, 11th blocked (429)
```

### Testing with Postman

1. **Create Collection** - "Rate Limit Tests"
2. **Add Requests:**
   - Login (5 times)
   - Forgot Password (3 times)
   - Search (30 times)
3. **Run Collection** - Collection Runner
4. **Check Results** - Should see 429 errors after limits

### Automated Testing Script

Create `server/test-rate-limiting.js`:

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

async function testAuthRateLimit() {
  console.log('Testing Auth Rate Limit (5 per 15 min)...\n');
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/user/login`, {
        email: 'test@test.com',
        password: 'wrongpassword'
      });
      
      console.log(`✅ Attempt ${i}: ${response.status}`);
      console.log(`   Remaining: ${response.headers['x-ratelimit-remaining']}`);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`❌ Attempt ${i}: RATE LIMITED (429)`);
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log(`⚠️  Attempt ${i}: ${error.response?.status || error.message}`);
      }
    }
  }
}

testAuthRateLimit();
```

Run: `node server/test-rate-limiting.js`

---

## 📊 Monitoring

### Upstash Dashboard

1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Click on your database
3. View **Metrics** tab:

**Key Metrics:**
- **Commands/Second** → Request rate to Redis
- **Database Size** → Storage used (rate limit counters)
- **Latency** → Response time (should be <100ms)
- **Hit Rate** → Cache efficiency

### Application Logging

Add logging to `server/middleware/rateLimiter.js`:

```javascript
function createRateLimiterMiddleware(limiter, name) {
  return async (req, res, next) => {
    const identifier = getIdentifier(req);
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    // Log rate limit events
    console.log(`[RateLimit:${name}] ${identifier} - ${remaining}/${limit} remaining`);

    if (!success) {
      console.warn(`[RateLimit:${name}] BLOCKED: ${identifier} - Try again at ${new Date(reset)}`);
    }

    // ... rest of middleware
  };
}
```

### Monitoring Dashboard (Optional)

Create `server/routes/admin/rate-limit-stats.js`:

```javascript
import redis from '../config/upstash.js';

export async function getRateLimitStats(req, res) {
  try {
    // Get all rate limit keys
    const keys = await redis.keys('ratelimit:*');
    
    const stats = {};
    for (const key of keys) {
      const value = await redis.get(key);
      stats[key] = value;
    }

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## ✅ Best Practices

### 1. Graceful Degradation

If Upstash Redis fails, allow requests (don't block traffic):

```javascript
try {
  const { success } = await limiter.limit(identifier);
  if (!success) return res.status(429).json(...);
} catch (error) {
  console.error('Rate limiter error:', error);
  // Allow request to proceed
  next();
}
```

### 2. Informative Error Messages

```javascript
// ❌ Bad
return res.status(429).json({ error: 'Too many requests' });

// ✅ Good
return res.status(429).json({
  message: 'Too many login attempts. Please try again in 15 minutes.',
  error: true,
  retryAfter: 900,
  reset: '2025-11-02T22:30:00.000Z'
});
```

### 3. Skip Rate Limiting for Health Checks

```javascript
if (req.path === '/health' || req.path === '/ping') {
  return next(); // Don't rate limit health checks
}
```

### 4. Use Different Limits for Different User Types

```javascript
// Premium users get higher limits
const limit = user.isPremium ? 200 : 100;

const userLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(limit, '15 m'),
});
```

### 5. Monitor and Adjust

- Track 429 error rates
- Adjust limits based on real usage
- A/B test different limits

### 6. Document Rate Limits

In API documentation:
```markdown
## Rate Limits

- Authentication: 5 requests per 15 minutes
- Email/OTP: 3 requests per 5 minutes
- Payment: 10 requests per hour
- Search: 30 requests per minute
- General API: 100 requests per 15 minutes
```

### 7. Provide Rate Limit Headers

Always include these headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

Clients can use these to show warnings:
```javascript
const remaining = parseInt(response.headers['x-ratelimit-remaining']);
if (remaining < 5) {
  alert(`Warning: Only ${remaining} requests remaining!`);
}
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Upstash Redis configured with production credentials
- [ ] Environment variables set correctly
- [ ] Rate limits tested manually
- [ ] Monitoring dashboard set up
- [ ] Error logging configured
- [ ] API documentation updated with rate limits
- [ ] Frontend handles 429 errors gracefully
- [ ] Load testing performed
- [ ] Backup plan if Upstash is down (graceful degradation)
- [ ] Team trained on adjusting rate limits

---

## 📚 Additional Resources

- **Upstash Docs:** [https://upstash.com/docs/redis/features/ratelimiting](https://upstash.com/docs/redis/features/ratelimiting)
- **Setup Guide:** `docs/setup/UPSTASH_SETUP.md`
- **RFC 6585 (429 Status):** [https://tools.ietf.org/html/rfc6585#section-4](https://tools.ietf.org/html/rfc6585#section-4)

---

## ✨ Summary

You now have a production-ready rate limiting system that:

- ✅ Protects against brute force attacks
- ✅ Prevents email spam
- ✅ Stops payment fraud
- ✅ Prevents resource exhaustion
- ✅ Works across multiple servers
- ✅ Provides detailed monitoring
- ✅ Degrades gracefully on failures

**Cost:** Free (up to 10,000 commands/day)
**Setup Time:** ~5 minutes
**Security Improvement:** Massive ✨

