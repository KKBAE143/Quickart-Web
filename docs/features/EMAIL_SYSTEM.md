# Quickart Email Notification System

## 📧 Overview

Comprehensive email notification system for Quickart quick commerce platform using **Resend**. Provides automated, branded email notifications for all order lifecycle events.

## ✨ Features

### Email Types Implemented

1. **📦 Order Confirmation** - Sent immediately after order placement
2. **🚚 Order Dispatched** - When order is packed and ready for delivery
3. **🚴 Out for Delivery** - When delivery partner picks up the order
4. **✅ Order Delivered** - Successful delivery confirmation
5. **❌ Order Cancelled** - When order is cancelled
6. **💰 Refund Initiated** - When refund process starts
7. **✅ Refund Completed** - When refund is processed
8. **⚠️ Payment Failed** - For failed payment transactions
9. **📧 Email Verification** - User registration verification (updated with new branding)
10. **🔐 Password Reset** - OTP for password reset (updated with new branding)

### Key Features

- ✅ **Professional Design** - Modern, responsive HTML email templates
- ✅ **Branded** - Quickart red theme (#DC2626) throughout
- ✅ **Mobile Responsive** - Perfect rendering on all devices
- ✅ **Quick Commerce Specific** - Fast delivery updates, ETA tracking
- ✅ **Automatic Triggers** - Emails sent automatically on order events
- ✅ **Error Handling** - Graceful failure handling (order succeeds even if email fails)
- ✅ **Rich Information** - Order details, tracking info, delivery partner details
- ✅ **Call-to-Actions** - Clear buttons for user actions

## 📁 Project Structure

```
server/
├── config/
│   └── sendEmail.js                    # Resend email configuration
├── services/
│   └── emailService.js                 # Email service with all methods
├── utils/
│   ├── emailTemplates/
│   │   ├── baseTemplate.js            # Base template with consistent branding
│   │   ├── orderConfirmation.js       # Order confirmation template
│   │   ├── orderDispatched.js         # Order dispatched template
│   │   ├── outForDelivery.js          # Out for delivery template
│   │   ├── orderDelivered.js          # Order delivered template
│   │   ├── orderCancelled.js          # Order cancelled template
│   │   ├── refundInitiated.js         # Refund initiated template
│   │   ├── refundCompleted.js         # Refund completed template
│   │   └── paymentFailed.js           # Payment failed template
│   ├── verifyEmailTemplate.js         # Email verification (updated)
│   └── forgotPasswordTemplate.js      # Password reset (updated)
├── models/
│   └── order.model.js                 # Enhanced with status tracking fields
├── controllers/
│   └── order.controller.js            # Updated with email notifications
└── route/
    └── order.route.js                 # Added update status route
```

## 🚀 Getting Started

### Prerequisites

- Resend API key (already configured in `.env`)
- Node.js and Express server
- MongoDB for order storage

### Environment Variables

Ensure these are set in your `.env` file:

```env
RESEND_API=your_resend_api_key_here
FRONTEND_URL=http://localhost:5173
```

### Installation

All dependencies are already installed. The system uses:
- `resend` - Email sending service
- Existing Express routes and controllers

## 📨 Email Service Usage

### Basic Usage

```javascript
import EmailService from '../services/emailService.js';

// Send order confirmation
await EmailService.sendOrderConfirmation({
    userEmail: 'customer@example.com',
    customerName: 'John Doe',
    orderId: 'ORD-12345',
    orderDate: 'November 2, 2025 at 7:30 PM',
    items: [
        { name: 'Fresh Milk', quantity: 2, price: 120 },
        { name: 'Brown Bread', quantity: 1, price: 45 }
    ],
    subtotal: 165,
    deliveryFee: 0,
    total: 165,
    deliveryAddress: '123 Main St, Bangalore, Karnataka, 560001',
    paymentMethod: 'Cash on Delivery',
    estimatedDelivery: '30-45 minutes'
});
```

### All Available Methods

#### 1. Order Confirmation
```javascript
EmailService.sendOrderConfirmation({
    userEmail, customerName, orderId, orderDate, items,
    subtotal, deliveryFee, total, deliveryAddress,
    paymentMethod, estimatedDelivery
})
```

#### 2. Order Dispatched
```javascript
EmailService.sendOrderDispatched({
    userEmail, customerName, orderId, items, total,
    deliveryAddress, estimatedDelivery
})
```

#### 3. Out for Delivery
```javascript
EmailService.sendOutForDelivery({
    userEmail, customerName, orderId,
    deliveryPartnerName, deliveryPartnerPhone, vehicleNumber,
    trackingLink, estimatedArrival, deliveryAddress
})
```

#### 4. Order Delivered
```javascript
EmailService.sendOrderDelivered({
    userEmail, customerName, orderId, deliveryDate,
    items, total, feedbackLink
})
```

#### 5. Order Cancelled
```javascript
EmailService.sendOrderCancelled({
    userEmail, customerName, orderId, cancellationDate,
    cancellationReason, items, refundAmount, refundMethod, refundEta
})
```

#### 6. Refund Initiated
```javascript
EmailService.sendRefundInitiated({
    userEmail, customerName, orderId, refundId,
    refundAmount, refundReason, refundMethod, refundEta, initiatedDate
})
```

#### 7. Refund Completed
```javascript
EmailService.sendRefundCompleted({
    userEmail, customerName, orderId, refundId,
    refundAmount, refundMethod, completedDate, transactionId
})
```

#### 8. Payment Failed
```javascript
EmailService.sendPaymentFailed({
    userEmail, customerName, orderId, attemptDate,
    failureReason, amount, items
})
```

### Helper Methods

```javascript
// Format date for emails
EmailService.formatDate(new Date())
// Output: "November 2, 2025 at 7:30 PM"

// Format address object
EmailService.formatAddress(addressObject)
// Output: "123 Main St, City, State, Pincode, Country"

// Format items array
EmailService.formatItems(cartItems, productDetails)
// Output: [{ name, quantity, price }, ...]
```

## 🔄 Order Status Flow & Email Triggers

```
┌─────────────┐
│   PENDING   │  (Order created, no email)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CONFIRMED  │  ✉️ Order Confirmation Email
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   PACKED    │  (No email, internal status)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ DISPATCHED  │  ✉️ Order Dispatched Email
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ OUT_FOR_DELIVERY │  ✉️ Out for Delivery Email
└────────┬─────────┘
         │
         ▼
┌─────────────┐
│  DELIVERED  │  ✉️ Order Delivered Email
└─────────────┘

Alternative Flows:

┌─────────────┐
│  CANCELLED  │  ✉️ Order Cancelled Email
└──────┬──────┘    (+ Refund Initiated if paid)
       │
       ▼
┌──────────────────┐
│ REFUND_INITIATED │  ✉️ Refund Initiated Email
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ REFUND_COMPLETED │  ✉️ Refund Completed Email
└──────────────────┘
```

## 🛠️ API Endpoints

### Update Order Status (Admin Only)

**Endpoint:** `PUT /api/order/update-status/:orderId`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
    "order_status": "OUT_FOR_DELIVERY",
    "delivery_partner": {
        "name": "Rajesh Kumar",
        "phone": "+919876543210",
        "vehicle_number": "KA-01-AB-1234"
    },
    "tracking_url": "https://track.quickart.com/ORD-12345",
    "estimated_delivery_time": "15-20 minutes"
}
```

**Response:**
```json
{
    "message": "Order status updated to OUT_FOR_DELIVERY",
    "error": false,
    "success": true,
    "data": { /* updated order object */ }
}
```

### Available Status Values

- `PENDING` - Order created
- `CONFIRMED` - Payment confirmed
- `PACKED` - Order packed
- `DISPATCHED` - Ready for delivery
- `OUT_FOR_DELIVERY` - With delivery partner
- `DELIVERED` - Successfully delivered
- `CANCELLED` - Order cancelled
- `REFUND_INITIATED` - Refund processing
- `REFUND_COMPLETED` - Refund completed

## 📊 Order Model Fields

New fields added to `order.model.js`:

```javascript
{
    // Status tracking
    order_status: String (enum),
    
    // Delivery tracking
    delivery_partner: {
        name: String,
        phone: String,
        vehicle_number: String
    },
    tracking_url: String,
    estimated_delivery_time: String,
    
    // Cancellation/Refund
    cancellation_reason: String,
    cancelled_at: Date,
    refund_id: String,
    refund_amount: Number,
    refund_status: String (enum),
    refund_initiated_at: Date,
    refund_completed_at: Date,
    
    // Timestamps
    delivered_at: Date,
    dispatched_at: Date,
    out_for_delivery_at: Date
}
```

## 🎨 Email Templates

All email templates follow the same structure:

1. **Header** - Quickart branding with red gradient
2. **Body** - Order/status specific content
3. **Footer** - Contact info, social links, copyright

### Design Features

- **Color Scheme:** Red (#DC2626, #EF4444) matching Quickart brand
- **Typography:** System fonts for best email client support
- **Responsive:** Mobile-first design with proper breakpoints
- **Accessibility:** Semantic HTML, proper contrast ratios
- **Call-to-Actions:** Clear buttons with gradients and shadows
- **Information Boxes:** Color-coded for different message types

### Testing Email Templates

Create a test file `server/test-email-service.js`:

```javascript
import EmailService from './services/emailService.js';

// Test order confirmation
await EmailService.sendOrderConfirmation({
    userEmail: 'test@example.com',
    customerName: 'Test User',
    orderId: 'ORD-TEST-001',
    orderDate: EmailService.formatDate(new Date()),
    items: [
        { name: 'Test Product', quantity: 1, price: 100 }
    ],
    subtotal: 100,
    deliveryFee: 0,
    total: 100,
    deliveryAddress: '123 Test St, Test City',
    paymentMethod: 'Cash on Delivery',
    estimatedDelivery: '30 minutes'
});

console.log('Test email sent!');
```

Run: `node server/test-email-service.js`

## 🔐 Security Considerations

1. **Email Failures Don't Affect Orders** - Orders are created/updated successfully even if emails fail
2. **Error Logging** - All email errors are logged for monitoring
3. **Sensitive Data** - No sensitive payment details in emails
4. **Rate Limiting** - Resend handles rate limiting automatically
5. **Spam Prevention** - Professional design reduces spam classification

## 📈 Best Practices for Quick Commerce

### 1. Fast Notifications
- Emails sent immediately on status change
- Real-time updates for customers
- Clear ETA information

### 2. Mobile Optimization
- Most customers check emails on mobile
- Responsive design ensures readability
- Clear CTAs for mobile users

### 3. Tracking Information
- Include delivery partner details
- Add tracking links when available
- Show estimated arrival time

### 4. Customer Support
- Clear contact information in footer
- Support links in all emails
- Help text for common issues

## 🚨 Error Handling

All email methods include try-catch blocks:

```javascript
try {
    await EmailService.sendOrderConfirmation({...});
} catch (emailError) {
    console.error('Failed to send email:', emailError);
    // Order still succeeds
}
```

This ensures:
- Orders are never lost due to email failures
- Errors are logged for debugging
- System continues functioning

## 📱 Email Previews

### Order Confirmation
- Order details with item list
- Payment method and total
- Delivery address
- Estimated delivery time
- Track order button

### Out for Delivery
- Delivery partner name and contact
- Vehicle number
- Live tracking link
- Estimated arrival time
- Delivery instructions

### Order Delivered
- Delivery confirmation
- Order summary
- Rate experience button
- Order again CTA

## 🔄 Future Enhancements

Potential additions:

1. **SMS Notifications** - Add Twilio integration
2. **Push Notifications** - Mobile app notifications
3. **WhatsApp Updates** - WhatsApp Business API
4. **Email Preferences** - User-controlled notification settings
5. **Order Rating** - Post-delivery feedback collection
6. **Promotional Emails** - Marketing campaigns
7. **Order Reminders** - Cart abandonment emails
8. **Loyalty Rewards** - Points and rewards notifications

## 🤝 Support

For issues or questions:
- Check logs in `server/` directory
- Review Resend dashboard for delivery status
- Test with `server/test-email.js`
- Contact: support@quickart.com

## 📄 License

Part of the Quickart platform. All rights reserved.

---

**Built with ❤️ for Quickart - Fresh & Fast Delivery! 🚀**

