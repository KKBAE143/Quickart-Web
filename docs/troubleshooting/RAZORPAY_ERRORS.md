# Razorpay Payment Integration Troubleshooting Guide

## Common Errors and Solutions

### 1. ❌ Error: "serviceworker" must be a dictionary in your web app manifest

**Status:** ✅ FIXED

**What it was:**
The browser was looking for a web app manifest file because of the `theme-color` meta tag, but the file didn't exist.

**Solution Applied:**
- Created `client/public/manifest.json` with proper PWA configuration
- Added manifest link to `client/index.html`
- Added Apple touch icon for iOS devices

**Result:**
This error should no longer appear after the fix.

---

### 2. ❌ Error: POST https://api.razorpay.com/.../validate/account 400 (Bad Request)

**What it means:**
This error indicates that Razorpay is rejecting your payment request. This usually happens due to:

1. **Invalid or Missing API Keys** ⚠️
2. **Test Account Not Activated**
3. **Account Configuration Issues**
4. **Invalid Request Parameters**

**Solutions:**

#### A. Verify Your Razorpay API Keys

1. **Check if keys are set in environment files:**

   ```bash
   # Server .env file (server/.env)
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
   
   # Client .env file (client/.env)
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   ```

2. **Get your API keys from Razorpay Dashboard:**
   - Go to https://dashboard.razorpay.com/
   - Navigate to **Settings** → **API Keys**
   - For testing: Use **Test Mode** keys (starts with `rzp_test_`)
   - For production: Use **Live Mode** keys (starts with `rzp_live_`)

3. **Regenerate keys if needed:**
   - If keys are compromised, regenerate them from the dashboard
   - Update both server and client `.env` files

#### B. Activate Your Razorpay Test Account

1. **Sign up at Razorpay:**
   - Visit https://dashboard.razorpay.com/signup
   - Complete registration

2. **Activate Test Mode:**
   - Toggle to **Test Mode** in the dashboard
   - Test mode doesn't require KYC
   - You can use test cards immediately

3. **Test Cards for Testing:**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: Any 3 digits (e.g., 123)
   Expiry: Any future date (e.g., 12/25)
   Name: Any name
   ```

#### C. Check Request Parameters

1. **Open browser console** (F12) when making payment
2. **Check the request payload:**
   - Ensure `amount` is in **paise** (multiply by 100)
   - Verify `currency` is set to "INR"
   - Check if `list_items` array is not empty
   - Ensure `addressId` is valid

3. **Common issues:**
   - Amount is 0 or negative
   - Missing address selection
   - Empty cart
   - Invalid customer details

#### D. Verify Backend Configuration

1. **Check server logs:**
   ```bash
   cd server
   npm run dev
   ```

2. **Look for errors when creating Razorpay order:**
   - API key errors
   - Network connectivity issues
   - Database connection problems

3. **Test the backend endpoint directly:**
   ```bash
   # Use Postman or curl to test
   curl -X POST http://localhost:8080/api/order/razorpay-checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "list_items": [...],
       "addressId": "...",
       "subTotalAmt": 1000,
       "totalAmt": 1000
     }'
   ```

---

### 3. ⚠️ Error: `<svg> attribute height/width: Expected length, "auto"`

**What it means:**
These are internal warnings from Razorpay's checkout UI. They appear in the browser console but **do not affect payment functionality**.

**Impact:**
- ✅ Payments still work normally
- ⚠️ Console gets cluttered with warnings
- 🔒 Cannot be fixed on your end (Razorpay's internal code)

**What to do:**
- **Ignore these warnings** - they're cosmetic
- **Focus on actual payment errors** (like the 400 error above)
- **Report to Razorpay** if you want (they might fix it in future updates)

---

## Complete Setup Checklist

Use this checklist to ensure everything is configured correctly:

### ✅ Environment Variables

**Server (.env):**
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx  # Optional
```

**Client (.env):**
```bash
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### ✅ Dependencies Installed

**Server:**
```bash
cd server
npm install razorpay
```

**Client:**
- Razorpay script loads from CDN (no npm package needed)
- Check `CheckoutPage.jsx` line 67-75

### ✅ Razorpay Account

- [ ] Account created at https://dashboard.razorpay.com/
- [ ] Test mode enabled
- [ ] API keys generated and copied
- [ ] Test payment made successfully

### ✅ Code Configuration

**Files to check:**
- `server/config/razorpay.js` - Razorpay instance
- `server/controllers/order.controller.js` - Payment controllers
- `client/src/pages/CheckoutPage.jsx` - Frontend integration
- `client/src/common/SummaryApi.js` - API endpoints

---

## Testing Your Integration

### 1. Test with Console Open

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Click "Online Payment"
4. Watch for errors in console

### 2. Check Network Tab

1. Open **Network** tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Look for `/razorpay-checkout` request
4. Check response status and data

### 3. Test Complete Flow

```
1. ✅ Add items to cart
2. ✅ Go to checkout
3. ✅ Select delivery address
4. ✅ Click "Online Payment"
5. ✅ Razorpay modal opens
6. ✅ Enter test card details
7. ✅ Payment succeeds
8. ✅ Order confirmation email received
9. ✅ Redirected to success page
10. ✅ Cart is cleared
```

---

## Still Having Issues?

### Check Server Logs

```bash
cd server
npm run dev

# Watch for errors when making payment
```

### Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Provide token" | Not logged in | Login first |
| "Please select a delivery address" | No address selected | Add/select address |
| "Failed to create order" | Backend error | Check server logs |
| "Payment verification failed" | Signature mismatch | Check API keys |
| "BAD_REQUEST_ERROR" | Invalid parameters | Check request payload |

### Get Help

1. **Check Documentation:**
   - `docs/features/RAZORPAY_INTEGRATION.md` - Complete guide
   - `docs/setup/RAZORPAY_SETUP.md` - Quick setup

2. **Razorpay Support:**
   - Dashboard: https://dashboard.razorpay.com/
   - Docs: https://razorpay.com/docs/
   - Support: support@razorpay.com

3. **Debug Steps:**
   ```bash
   # 1. Check environment variables
   cat server/.env | grep RAZORPAY
   cat client/.env | grep RAZORPAY
   
   # 2. Check if Razorpay package is installed
   cd server && npm list razorpay
   
   # 3. Test backend endpoint
   # Use Postman to test /api/order/razorpay-checkout
   
   # 4. Check browser console for detailed errors
   ```

---

## Quick Fixes Summary

1. ✅ **Manifest Error** → Fixed by creating `manifest.json`
2. ⚠️ **400 Bad Request** → Check Razorpay API keys in `.env` files
3. ⚠️ **SVG Errors** → Ignore (Razorpay internal, doesn't affect payments)

---

## Need More Help?

- Check the complete integration guide: `docs/features/RAZORPAY_INTEGRATION.md`
- Follow the quick setup: `docs/setup/RAZORPAY_SETUP.md`
- Review payment flow diagrams in documentation
- Test with provided test cards first
- Enable test mode in Razorpay dashboard

**Remember:** Always test in **Test Mode** before going live! 🧪

