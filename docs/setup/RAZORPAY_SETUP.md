# 🚀 Razorpay Quick Setup Guide

## Quick Setup in 5 Minutes

### 1. Get Razorpay API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in
3. Switch to **Test Mode** (top left toggle)
4. Navigate to **Settings** → **API Keys** → **Generate Test Key**
5. Copy both keys:
   - Key ID (starts with `rzp_test_`)
   - Key Secret

### 2. Configure Server Environment

Add to `server/.env`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx  # Optional, for webhooks

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Configure Client Environment

Add to `client/.env`:

```env
# Razorpay Public Key
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# API Base URL
VITE_API_URL=http://localhost:8080
```

### 4. Start Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 5. Test Payment

1. Visit http://localhost:5173
2. Add items to cart
3. Go to checkout
4. Select/add delivery address
5. Click "Online Payment"
6. Use test card: **4111 1111 1111 1111**
7. CVV: **123**, Expiry: **12/25**, Name: **Test User**
8. Complete payment
9. ✅ Order should be created!

---

## Test Cards

| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | ✅ Success |
| 5555 5555 5555 4444 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Failed |

**All cards**: CVV: Any 3 digits, Expiry: Any future date

## Test UPI

- `success@razorpay` - Success
- `failure@razorpay` - Failure

---

## Troubleshooting

### Issue: "Invalid key_id"
**Solution**: 
- Check `RAZORPAY_KEY_ID` in both `.env` files
- Restart both servers after changing `.env`

### Issue: "Payment verification failed"
**Solution**:
- Verify `RAZORPAY_KEY_SECRET` is correct
- Check for extra spaces in `.env`

### Issue: "Razorpay is not defined"
**Solution**:
- Razorpay script loads automatically
- Check browser console for errors
- Clear cache and reload

---

## Going Live

### 1. Complete KYC
- Submit business documents in Razorpay Dashboard
- Wait for verification (1-2 days)

### 2. Generate Live Keys
- Switch to **Live Mode** in dashboard
- Generate new API keys
- Update both `.env` files with live keys

### 3. Configure Webhooks
- Go to **Settings** → **Webhooks**
- Add: `https://yourdomain.com/api/order/razorpay-webhook`
- Copy webhook secret to `.env`

### 4. Deploy
- Deploy backend with live keys
- Deploy frontend with live key
- Test with small real amount
- Monitor payments in dashboard

---

## Need Help?

📖 **Full Documentation**: See [`docs/features/RAZORPAY_INTEGRATION.md`](../features/RAZORPAY_INTEGRATION.md)

💬 **Support**: support@razorpay.com

🔗 **Dashboard**: https://dashboard.razorpay.com/

---

**Setup Time**: ~5 minutes  
**Last Updated**: November 2025

