# 🚀 Email System Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Step 1: Test the Email System

1. Open `server/test-email-service.js`
2. Update the test email address:
   ```javascript
   const TEST_EMAIL = 'your-email@example.com';
   ```
3. Run the test script:
   ```bash
   node server/test-email-service.js
   ```
4. Check your inbox! You should receive 8 test emails showcasing all templates.

### Step 2: Verify Resend Configuration

Make sure your `.env` file has:
```env
RESEND_API=your_resend_api_key_here
FRONTEND_URL=http://localhost:5173
```

### Step 3: How It Works Automatically

Emails are now **automatically sent** when:

1. **Order is Placed** (COD or Card Payment)
   - ✉️ Order Confirmation Email sent
   - Contains: Order details, items, delivery address, ETA

2. **Admin Updates Order Status**
   - Use the API endpoint: `PUT /api/order/update-status/:orderId`
   - Status changes trigger appropriate emails

## 📌 Common Use Cases

### Example 1: Mark Order as Dispatched

```bash
# API Request
PUT /api/order/update-status/ORD-12345
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "order_status": "DISPATCHED",
  "estimated_delivery_time": "20-30 minutes"
}
```

Result: Customer receives **"Order Dispatched"** email

### Example 2: Assign Delivery Partner

```bash
# API Request
PUT /api/order/update-status/ORD-12345

{
  "order_status": "OUT_FOR_DELIVERY",
  "delivery_partner": {
    "name": "Rajesh Kumar",
    "phone": "+91 98765 43210",
    "vehicle_number": "KA-01-AB-1234"
  },
  "tracking_url": "https://track.quickart.com/ORD-12345",
  "estimated_delivery_time": "15-20 minutes"
}
```

Result: Customer receives **"Out for Delivery"** email with driver details

### Example 3: Mark as Delivered

```bash
# API Request
PUT /api/order/update-status/ORD-12345

{
  "order_status": "DELIVERED"
}
```

Result: Customer receives **"Order Delivered"** email with feedback link

### Example 4: Cancel Order

```bash
# API Request
PUT /api/order/update-status/ORD-12345

{
  "order_status": "CANCELLED",
  "cancellation_reason": "Customer requested cancellation"
}
```

Result: Customer receives **"Order Cancelled"** email (+ refund email if paid online)

## 🎯 Testing Tips

### 1. Test Individual Email Types

```javascript
import EmailService from './server/services/emailService.js';

// Test order confirmation
await EmailService.sendOrderConfirmation({
    userEmail: 'test@example.com',
    customerName: 'Test User',
    orderId: 'ORD-TEST-001',
    // ... other required fields
});
```

### 2. Test with Real Orders

1. Place a test order (COD or Card)
2. Check email delivery
3. Update order status via admin panel
4. Verify status update emails

### 3. Monitor Email Delivery

- Visit [Resend Dashboard](https://resend.com/emails)
- View delivery status, opens, clicks
- Check for any errors or bounces

## 📱 Email Types & Triggers

| Email Type | Trigger | Status Required |
|------------|---------|-----------------|
| Order Confirmation | Order placed | CONFIRMED |
| Order Dispatched | Order ready | DISPATCHED |
| Out for Delivery | Assigned to driver | OUT_FOR_DELIVERY |
| Order Delivered | Delivery complete | DELIVERED |
| Order Cancelled | Cancellation | CANCELLED |
| Refund Initiated | Refund started | REFUND_INITIATED |
| Refund Completed | Refund done | REFUND_COMPLETED |
| Payment Failed | Payment error | N/A (manual) |

## 🔧 Customization

### Update Email Content

Edit files in `server/utils/emailTemplates/`:
- `orderConfirmation.js` - Order confirmation template
- `orderDispatched.js` - Dispatch notification
- `outForDelivery.js` - Delivery notification
- `orderDelivered.js` - Delivery confirmation
- etc.

### Update Branding

Edit `server/utils/emailTemplates/baseTemplate.js`:
- Change colors (currently red #DC2626)
- Update logo
- Modify footer links
- Change contact information

### Add New Email Types

1. Create template in `server/utils/emailTemplates/`
2. Add method to `server/services/emailService.js`
3. Call from controller when needed

## 🐛 Troubleshooting

### Emails Not Sending?

1. **Check Resend API Key**
   ```bash
   # In server directory
   node -e "console.log(process.env.RESEND_API)"
   ```

2. **Check Server Logs**
   ```bash
   # Look for email sending errors
   tail -f server/logs/app.log
   ```

3. **Test Resend Directly**
   ```bash
   node server/test-email.js
   ```

### Emails Going to Spam?

- Using `onboarding@resend.dev` sender (development)
- For production, verify your domain in Resend
- Update sender in `server/config/sendEmail.js`

### Order Created but No Email?

- Email failures don't break orders (by design)
- Check server logs for email errors
- Verify user has valid email address
- Check Resend dashboard for delivery status

## 📚 Full Documentation

For complete documentation, see:
- **[EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md)** - Full system documentation
- API endpoints, all methods, examples
- Order status flow diagrams
- Best practices and troubleshooting

## 🎉 What's Next?

1. ✅ Test all email templates
2. ✅ Place test orders
3. ✅ Update order statuses
4. ✅ Verify emails are delivered
5. 🚀 **Go live!**

### Production Checklist

- [ ] Verify custom domain in Resend
- [ ] Update sender email from `onboarding@resend.dev`
- [ ] Test with real customer emails
- [ ] Monitor delivery rates
- [ ] Set up email analytics
- [ ] Configure email preferences (future)

## 💬 Support

Need help? 
- Check **EMAIL_SYSTEM.md** for detailed docs
- Review `server/test-email-service.js` for examples
- Test individual email templates
- Contact: support@quickart.com

---

**🚀 Happy Emailing with Quickart!**

