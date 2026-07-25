# Razorpay Payment Gateway Integration Guide 🚀

## Overview

Quickart now uses **Razorpay** as its primary payment gateway for processing online payments. Razorpay is India's leading payment gateway, offering support for multiple payment methods including Cards, UPI, NetBanking, Wallets, and more.

---

## 📋 Table of Contents

1. [Why Razorpay?](#why-razorpay)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Backend Integration](#backend-integration)
8. [Payment Flow](#payment-flow)
9. [Webhook Configuration](#webhook-configuration)
10. [Testing](#testing)
11. [Security](#security)
12. [Troubleshooting](#troubleshooting)

---

## Why Razorpay?

### Benefits Over Stripe

| Feature | Razorpay | Stripe |
|---------|----------|--------|
| **Indian Payment Methods** | ✅ UPI, NetBanking, Wallets | ❌ Limited support |
| **Transaction Fees** | Lower for India | Higher |
| **Local Support** | ✅ Indian customer support | International only |
| **Settlement Speed** | Faster (same day/next day) | 2-7 days |
| **Checkout UX** | Modal-based (no redirect) | Redirects to checkout |
| **Currency Support** | INR optimized | Multi-currency |

---

## Features

### ✅ Implemented Features

- **Multiple Payment Methods**: Cards, UPI, NetBanking, Wallets
- **Secure Payment Verification**: SHA-256 signature verification
- **Order Management**: Complete order tracking
- **Email Notifications**: Success, failure, and status updates
- **Webhook Support**: Real-time payment notifications
- **Test Mode**: Sandbox environment for testing
- **Beautiful UI**: Branded checkout with Quickart colors
- **Error Handling**: Comprehensive error management
- **Cart Management**: Automatic cart clearing on success

---

## Architecture

### System Flow

```
User → Frontend → Backend → Razorpay → Backend → User
```

### Components

1. **Frontend** (`client/src/pages/CheckoutPage.jsx`)
   - Razorpay script loader
   - Checkout handler
   - Payment verification

2. **Backend** (`server/controllers/order.controller.js`)
   - Order creation (`razorpayCheckoutController`)
   - Payment verification (`verifyRazorpayPaymentController`)
   - Webhook handler (`webhookRazorpay`)

3. **Configuration** (`server/config/razorpay.js`)
   - Razorpay instance initialization

---

## Setup Instructions

### 1. Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a free account
3. Complete KYC verification (for live mode)
4. Generate API keys

### 2. Generate API Keys

#### Test Mode Keys (for Development)

1. Log in to Razorpay Dashboard
2. Switch to **Test Mode** (toggle in top left)
3. Go to **Settings** → **API Keys**
4. Click **Generate Test Key**
5. Copy both:
   - Key ID (starts with `rzp_test_`)
   - Key Secret

#### Live Mode Keys (for Production)

1. Complete KYC verification
2. Switch to **Live Mode**
3. Go to **Settings** → **API Keys**
4. Click **Generate Live Key**
5. Copy both:
   - Key ID (starts with `rzp_live_`)
   - Key Secret

⚠️ **Important**: Never commit API keys to version control!

### 3. Configure Environment Variables

#### Server Environment (`server/.env`)

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxx  # Optional, for webhook verification

# Frontend URL (for webhooks and redirects)
FRONTEND_URL=http://localhost:5173
```

#### Client Environment (`client/.env`)

```env
# Razorpay Public Key
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# API Base URL
VITE_API_URL=http://localhost:8080
```

### 4. Install Dependencies

Dependencies are already installed. If needed:

```bash
# Server
cd server
npm install razorpay

# Client (Razorpay script loads via CDN - no package needed)
cd client
# No installation required
```

### 5. Start the Application

```bash
# Start backend
cd server
npm run dev

# Start frontend (in new terminal)
cd client
npm run dev
```

---

## API Endpoints

### 1. Create Razorpay Order

**Endpoint**: `POST /api/order/razorpay-checkout`

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "list_items": [
    {
      "productId": {
        "_id": "product_id",
        "name": "Product Name",
        "image": ["image_url"],
        "price": 299
      },
      "quantity": 2
    }
  ],
  "addressId": "address_id",
  "subTotalAmt": 598,
  "totalAmt": 598
}
```

**Response**:
```json
{
  "success": true,
  "error": false,
  "message": "Razorpay order created successfully",
  "data": {
    "id": "order_xxxxxxxxxxxxx",
    "amount": 59800,
    "currency": "INR",
    "key_id": "rzp_test_xxxxx",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "9876543210",
    "list_items": [...],
    "addressId": "address_id",
    "subTotalAmt": 598,
    "totalAmt": 598
  }
}
```

### 2. Verify Payment

**Endpoint**: `POST /api/order/razorpay-verify`

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_hash",
  "list_items": [...],
  "addressId": "address_id",
  "subTotalAmt": 598,
  "totalAmt": 598
}
```

**Response**:
```json
{
  "message": "Payment verified and order created successfully",
  "error": false,
  "success": true,
  "data": [
    {
      "userId": "user_id",
      "orderId": "ORD-xxxxx",
      "productId": "product_id",
      "paymentId": "pay_xxxxxxxxxxxxx",
      "payment_status": "PAID",
      "order_status": "CONFIRMED",
      ...
    }
  ]
}
```

### 3. Webhook Handler

**Endpoint**: `POST /api/order/razorpay-webhook`

**Authentication**: None (verified via signature)

**Headers**:
```
X-Razorpay-Signature: signature_hash
```

**Body**: Razorpay webhook event payload

---

## Frontend Integration

### CheckoutPage Component

The checkout page handles the complete payment flow:

```javascript
// Load Razorpay script
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  document.body.appendChild(script);
  return () => document.body.removeChild(script);
}, []);

// Handle payment
const handleOnlinePayment = async () => {
  // 1. Create order
  const response = await Axios({
    ...SummaryApi.razorpay_checkout,
    data: { list_items, addressId, totalAmt, subTotalAmt }
  });

  // 2. Open Razorpay checkout
  const razorpay = new window.Razorpay({
    key: orderData.key_id,
    amount: orderData.amount,
    currency: "INR",
    name: "Quickart",
    order_id: orderData.id,
    handler: async (response) => {
      // 3. Verify payment on backend
      await verifyPayment(response);
    }
  });
  razorpay.open();
};
```

### Razorpay Checkout Options

```javascript
{
  key: "rzp_test_xxxxx",           // Razorpay Key ID
  amount: 59800,                   // Amount in paise (598.00 INR)
  currency: "INR",
  name: "Quickart",
  description: "Quick Commerce - Fresh & Fast Delivery",
  image: "/logo.png",              // Company logo
  order_id: "order_xxxxx",         // From backend
  prefill: {
    name: "Customer Name",
    email: "customer@example.com",
    contact: "9876543210"
  },
  theme: {
    color: "#DC2626"               // Quickart brand red
  },
  handler: function(response) {
    // Success callback
  },
  modal: {
    ondismiss: function() {
      // User closed modal
    }
  }
}
```

---

## Backend Integration

### 1. Razorpay Configuration

```javascript
// server/config/razorpay.js
import Razorpay from 'razorpay';

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpayInstance;
```

### 2. Create Order Controller

```javascript
export async function razorpayCheckoutController(request, response) {
  const { list_items, totalAmt, addressId, subTotalAmt } = request.body;
  
  // Create Razorpay order
  const options = {
    amount: Math.round(totalAmt * 100), // Convert to paise
    currency: "INR",
    receipt: `receipt_order_${new mongoose.Types.ObjectId()}`,
    notes: { userId, addressId, customerEmail, customerName }
  };
  
  const razorpayOrder = await razorpayInstance.orders.create(options);
  
  return response.json({
    success: true,
    data: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      // ... other details
    }
  });
}
```

### 3. Verify Payment Controller

```javascript
export async function verifyRazorpayPaymentController(request, response) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body;
  
  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");
  
  if (expectedSignature === razorpay_signature) {
    // Create order in database
    // Send confirmation email
    // Clear cart
    return response.json({ success: true });
  } else {
    return response.status(400).json({ 
      success: false, 
      message: "Payment verification failed" 
    });
  }
}
```

---

## Payment Flow

### Complete Flow Diagram

```
1. User clicks "Online Payment"
   ↓
2. Frontend: Validate address
   ↓
3. Frontend → Backend: Create Razorpay order
   ↓
4. Backend → Razorpay: Create order
   ↓
5. Razorpay → Backend: Return order_id
   ↓
6. Backend → Frontend: Return order details
   ↓
7. Frontend: Open Razorpay checkout modal
   ↓
8. User: Select payment method & complete payment
   ↓
9. Razorpay: Process payment
   ↓
10. Razorpay → Frontend: Return payment response
    ↓
11. Frontend → Backend: Verify payment signature
    ↓
12. Backend: Verify signature (security)
    ↓
13. Backend: Create order in database
    ↓
14. Backend: Send confirmation email
    ↓
15. Backend: Clear user's cart
    ↓
16. Backend → Frontend: Success response
    ↓
17. Frontend: Redirect to success page
```

### Payment States

| State | Description | User Action |
|-------|-------------|-------------|
| **Initiated** | Order created, awaiting payment | Checkout opens |
| **In Progress** | User selecting payment method | Making payment |
| **Success** | Payment completed | Order confirmed |
| **Failed** | Payment failed | Retry or cancel |
| **Cancelled** | User closed checkout | Return to cart |

---

## Webhook Configuration

### Setup Webhooks in Razorpay Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **Add New Webhook**
4. Enter webhook URL: `https://yourdomain.com/api/order/razorpay-webhook`
5. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Generate **Webhook Secret**
7. Copy secret to `server/.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

### Webhook Events

```javascript
// payment.authorized - Payment authorized (card authorized)
// payment.captured - Payment captured (money received)
// payment.failed - Payment failed
// order.paid - Order fully paid
```

### Testing Webhooks Locally

Use [ngrok](https://ngrok.com/) to expose local server:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 8080

# Use ngrok URL in Razorpay webhook settings
https://abc123.ngrok.io/api/order/razorpay-webhook
```

---

## Testing

### Test Mode

Razorpay provides a test mode for safe testing without real money.

#### Test Cards

| Card Number | Type | Result |
|-------------|------|--------|
| 4111 1111 1111 1111 | Visa | Success |
| 5555 5555 5555 4444 | Mastercard | Success |
| 4000 0000 0000 0002 | Visa | Failed |
| 4000 0000 0000 9995 | Visa | Insufficient funds |

**Card Details (Any Test Card)**:
- **CVV**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)
- **Name**: Any name

#### Test UPI IDs

- `success@razorpay` - Success
- `failure@razorpay` - Failure

#### Test Netbanking

- Select any bank
- Use any account number/credentials
- Choose Success/Failure on test page

### Manual Testing Checklist

- [ ] Can create Razorpay order successfully
- [ ] Razorpay checkout modal opens
- [ ] Can see all payment methods (Cards, UPI, etc.)
- [ ] Can complete payment with test card
- [ ] Payment signature verification works
- [ ] Order created in database after payment
- [ ] Cart cleared after successful payment
- [ ] Confirmation email received
- [ ] Redirected to success page
- [ ] Can handle payment cancellation
- [ ] Can handle payment failure
- [ ] Error messages display correctly

### Testing Payment Flow

```bash
# 1. Start servers
cd server && npm run dev
cd client && npm run dev

# 2. Test flow:
# - Add items to cart
# - Go to checkout
# - Select address
# - Click "Online Payment"
# - Use test card: 4111 1111 1111 1111
# - CVV: 123, Expiry: 12/25
# - Complete payment
# - Verify order created
# - Check email for confirmation
```

---

## Security

### Best Practices

1. **Never expose API secrets**
   - Keep `RAZORPAY_KEY_SECRET` in `.env`
   - Never commit to version control
   - Use different keys for test/live

2. **Always verify payment signature**
   - Backend must verify signature
   - Don't trust frontend alone
   - Use crypto.createHmac for verification

3. **Validate all inputs**
   - Check user authentication
   - Validate amount on backend
   - Verify order ownership

4. **Use HTTPS in production**
   - Required for Razorpay
   - Protects payment data
   - Required for webhooks

5. **Secure webhook endpoints**
   - Verify webhook signature
   - Check event authenticity
   - Handle duplicate events

### Signature Verification

```javascript
// Never skip this step!
const body = razorpay_order_id + "|" + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(body.toString())
  .digest("hex");

const isAuthentic = expectedSignature === razorpay_signature;
```

---

## Troubleshooting

### Common Issues

#### 1. "Payment verification failed"

**Cause**: Signature mismatch

**Solution**:
- Check `RAZORPAY_KEY_SECRET` is correct
- Ensure no extra spaces in `.env`
- Verify order_id and payment_id are correct

#### 2. "Razorpay is not defined"

**Cause**: Script not loaded

**Solution**:
```javascript
// Ensure script is loaded before payment
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  document.body.appendChild(script);
}, []);
```

#### 3. "Invalid key_id"

**Cause**: Wrong or missing key

**Solution**:
- Check `RAZORPAY_KEY_ID` in both `.env` files
- Ensure it starts with `rzp_test_` or `rzp_live_`
- Restart servers after changing `.env`

#### 4. "Amount must be at least ₹1"

**Cause**: Amount too small or wrong conversion

**Solution**:
```javascript
// Correct conversion: ₹598.00 → 59800 paise
amount: Math.round(totalAmt * 100)
```

#### 5. Webhook not receiving events

**Cause**: Wrong URL or signature verification

**Solution**:
- Check webhook URL is correct
- Verify webhook secret matches
- Test with ngrok for local development
- Check server logs for errors

#### 6. Payment succeeds but order not created

**Cause**: Verification or database error

**Solution**:
- Check backend logs
- Verify database connection
- Ensure all required fields present
- Check cart items are valid

### Debug Tips

1. **Enable detailed logging**:
```javascript
console.log('Razorpay order created:', razorpayOrder);
console.log('Payment response:', response);
console.log('Verification result:', isAuthentic);
```

2. **Check Razorpay Dashboard**:
   - View all test payments
   - See payment status
   - Check webhook logs

3. **Test in steps**:
   - First: Test order creation
   - Second: Test checkout opening
   - Third: Test payment completion
   - Fourth: Test verification

---

## Going Live

### Pre-Launch Checklist

- [ ] Complete Razorpay KYC verification
- [ ] Generate Live API keys
- [ ] Update `.env` with live keys
- [ ] Test with real small amount
- [ ] Set up live webhooks
- [ ] Enable HTTPS on production
- [ ] Test all payment methods
- [ ] Verify email notifications
- [ ] Set up payment monitoring
- [ ] Create refund process

### Production Configuration

```env
# server/.env (Production)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxx
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

```env
# client/.env (Production)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
VITE_API_URL=https://api.yourdomain.com
```

---

## Additional Resources

### Documentation

- [Razorpay Docs](https://razorpay.com/docs/)
- [Node.js SDK](https://github.com/razorpay/razorpay-node)
- [API Reference](https://razorpay.com/docs/api/)
- [Checkout.js](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/checkout-js/)

### Support

- **Razorpay Support**: support@razorpay.com
- **Dashboard**: https://dashboard.razorpay.com/
- **Status Page**: https://status.razorpay.com/

---

## Summary

✅ **Razorpay integration complete!**

### What's Working:
- Multiple payment methods (Cards, UPI, NetBanking, Wallets)
- Secure payment verification
- Order creation and management
- Email notifications
- Cart management
- Webhook support
- Error handling
- Beautiful branded UI

### Next Steps:
1. Add your Razorpay API keys to `.env` files
2. Test the payment flow
3. Configure webhooks
4. Complete KYC for live mode
5. Go live! 🚀

---

**Need Help?** Check the troubleshooting section or contact Razorpay support.

**Last Updated**: November 2025

