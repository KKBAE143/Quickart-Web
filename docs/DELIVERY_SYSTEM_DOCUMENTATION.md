# Quickart Delivery Partner System - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [User Roles & Flows](#user-roles--flows)
4. [Backend API Reference](#backend-api-reference)
5. [Frontend Components](#frontend-components)
6. [Real-time Features](#real-time-features)
7. [Database Models](#database-models)
8. [Configuration](#configuration)
9. [Testing Guide](#testing-guide)

---

## Overview

The Quickart Delivery Partner System enables end-to-end delivery management for quick commerce operations. Inspired by industry leaders like Zepto, Blinkit, and Swiggy Instamart, this system provides:

- **Delivery Partner Mobile Dashboard**: Accept/decline orders, navigate to store and customer, manage earnings
- **Real-time Location Tracking**: Live GPS tracking visible to both admin and customers
- **OTP-based Delivery Verification**: Secure handoff requiring customer-provided OTP
- **Wallet & Earnings Management**: Per-order earnings tracking with end-of-day cash settlement
- **Admin Monitoring Dashboard**: Track all online riders on a map in real-time

### Key Features

| Feature | Description |
|---------|-------------|
| Rider Dashboard | Online/offline toggle, available orders, active order management |
| Google Maps Navigation | One-tap navigation to store pickup and customer delivery |
| Live Location Tracking | Real-time rider pin movement on map for customers/admins |
| OTP Verification | 4-digit OTP required to complete delivery |
| Wallet System | Earnings per order, daily cash collection at store |
| Order History | Complete delivery history with earnings breakdown |
| Admin Tracking | Real-time map showing all online riders |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Delivery Dashboard  │  Customer Tracking  │  Admin Dashboard   │
│  (DeliveryDashboard) │  (TrackOrderPage)   │  (AdminRiderTrack) │
└─────────────┬───────────────────┬─────────────────┬─────────────┘
              │                   │                 │
              └───────────────────┼─────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │           SOCKET.IO LAYER             │
              │  Real-time bidirectional communication │
              └───────────────────┬───────────────────┘
                                  │
┌─────────────────────────────────┴─────────────────────────────┐
│                         API LAYER                              │
│                  Express.js REST API + Socket.io               │
├────────────────────────────────────────────────────────────────┤
│  /api/delivery/*  │  /api/order/*  │  Socket Events            │
└───────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┴─────────────────────────────┐
│                       DATA LAYER                               │
│                        MongoDB                                 │
├────────────────────────────────────────────────────────────────┤
│ User │ Order │ RiderWallet │ WalletTransaction │ LocationHist │
└────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Flows

### Delivery Partner Flow

```
1. LOGIN
   └── Rider logs in with credentials
       └── Role: DELIVERY_AGENT

2. GO ONLINE
   └── Toggle online status
       └── Start sharing live location
       └── Appear in admin tracking map
       └── Start receiving order broadcasts

3. RECEIVE ORDER
   └── New order notification via WebSocket
       └── View order details (items, store, customer)
       └── Accept or Decline within 30 seconds

4. ACCEPT ORDER
   └── Order assigned to rider
       └── Generate unique Order ID
       └── Navigate to store location

5. AT STORE
   └── Press "Arrived at Store"
       └── Pick up order items
       └── Confirm "Order Picked Up"
       └── COD: Collect cash from customer later

6. EN ROUTE TO CUSTOMER
   └── Navigate to customer location
       └── Live location shared with customer/admin
       └── Customer sees moving pin on map

7. REACHED CUSTOMER
   └── Press "Reached Customer Location"
       └── Customer receives notification with OTP
       └── Request OTP from customer

8. DELIVERY VERIFICATION
   └── Enter 4-digit OTP
       └── OTP verified → Delivery complete
       └── Earning added to wallet

9. COMPLETE
   └── Order marked DELIVERED
       └── Rider returns to available state
       └── Repeat from step 3
```

### Customer Flow

```
1. PLACE ORDER
   └── Complete checkout
       └── Payment (COD/Online)

2. ORDER PROCESSING
   └── Admin assigns to delivery zone
       └── Order broadcast to nearby riders

3. RIDER ASSIGNED
   └── Notification: "Rider on the way"
       └── View rider details

4. TRACK LIVE LOCATION
   └── Open order tracking page
       └── See rider's live location on map
       └── Pin moves in real-time
       └── ETA countdown

5. RIDER ARRIVES
   └── Notification: "Rider has arrived"
       └── Share OTP with rider for verification

6. RECEIVE DELIVERY
   └── Confirm OTP handoff
       └── Order marked DELIVERED
```

### Admin Flow

```
1. MONITOR RIDERS
   └── View all online riders on map
       └── Green pins = Active order
       └── Blue pins = Available

2. VIEW RIDER DETAILS
   └── Click rider to see:
       └── Current order details
       └── Earnings today
       └── Delivery metrics

3. BROADCAST ORDERS
   └── Assign orders to delivery zones
       └── Broadcast to nearby riders

4. MANAGE PAYOUTS
   └── View earnings by rider
       └── Process cash settlements
```

---

## Backend API Reference

### Base URL
```
Development: http://localhost:8080/api/delivery
Production: https://your-domain.com/api/delivery
```

### Authentication
All endpoints require JWT authentication via cookies or Authorization header.

### Endpoints

#### Dashboard & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get rider dashboard data |
| POST | `/toggle-status` | Toggle online/offline status |

**GET /dashboard Response:**
```json
{
  "success": true,
  "data": {
    "rider": {
      "_id": "...",
      "name": "John Rider",
      "mobile": "9876543210",
      "agentProfile": {
        "isOnline": true,
        "activeOrderId": null,
        "vehicleType": "BIKE",
        "vehicleNumber": "MH01AB1234"
      }
    },
    "wallet": {
      "currentBalance": 1250,
      "todayEarnings": 450,
      "todayDeliveries": 8
    },
    "todayStats": {
      "completed": 8,
      "cancelled": 0,
      "totalEarnings": 450
    },
    "availableOrders": [...]
  }
}
```

#### Location Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/location` | Update rider's current location |
| GET | `/location-history/:orderId` | Get location history for an order |

**POST /location Request:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "accuracy": 10,
  "heading": 45,
  "speed": 25
}
```

#### Order Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/available-orders` | Get orders available for pickup |
| GET | `/active-order` | Get current active order |
| POST | `/accept/:orderId` | Accept an order |
| POST | `/decline/:orderId` | Decline an order |
| POST | `/arrived-store/:orderId` | Mark arrival at store |
| POST | `/picked-up/:orderId` | Confirm order pickup |
| POST | `/reached/:orderId` | Mark arrival at customer |
| POST | `/verify-otp/:orderId` | Verify delivery OTP |
| POST | `/resend-otp/:orderId` | Resend OTP to customer |
| POST | `/failed/:orderId` | Mark delivery as failed |
| GET | `/order-history` | Get delivery history |

**POST /verify-otp/:orderId Request:**
```json
{
  "otp": "1234"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Delivery completed successfully!",
  "data": {
    "order": {...},
    "earning": 45,
    "newBalance": 1295
  }
}
```

#### Wallet & Earnings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet` | Get wallet details |
| GET | `/earnings` | Get earnings summary |

**GET /wallet Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "currentBalance": 1250,
      "lifetimeEarnings": 45000,
      "cashCollected": 2500,
      "pendingSettlement": 2500,
      "todayEarnings": 450,
      "todayDeliveries": 8,
      "weekEarnings": 2100,
      "weekDeliveries": 45
    },
    "recentTransactions": [
      {
        "type": "EARNING",
        "amount": 45,
        "description": "Delivery earning for order #QK123456",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### Admin Functions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/online-riders` | Get all online riders |
| GET | `/admin/rider/:riderId` | Get specific rider details |
| POST | `/admin/broadcast/:orderId` | Broadcast order to riders |

---

## Frontend Components

### Delivery Partner Pages

| Component | Path | Description |
|-----------|------|-------------|
| `DeliveryDashboard.jsx` | `/delivery` | Main rider dashboard |
| `ActiveOrderPage.jsx` | `/delivery/active-order` | Active order management |
| `RiderWalletPage.jsx` | `/delivery/wallet` | Wallet and earnings |
| `RiderOrdersPage.jsx` | `/delivery/orders` | Order history |

### Customer Components

| Component | Path | Description |
|-----------|------|-------------|
| `TrackOrderPage.jsx` | `/track-order/:orderId` | Order tracking with live map |
| `LiveMap.jsx` | (component) | Real-time rider location map |
| `DeliveryMap.jsx` | (component) | Static delivery location map |

### Admin Components

| Component | Path | Description |
|-----------|------|-------------|
| `AdminRiderTracking.jsx` | `/admin/rider-tracking` | Live rider tracking map |

### Shared Components

| Component | Description |
|-----------|-------------|
| `SocketService` | Centralized socket.io management |
| `OrderProgressStepper` | Order status visualization |

---

## Real-time Features

### Socket Events

#### Rider Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `rider:online` | Client → Server | Rider goes online |
| `rider:offline` | Client → Server | Rider goes offline |
| `rider:location` | Client → Server | Location update |
| `rider:location-update` | Server → Client | Broadcast to room |

**rider:location Payload:**
```javascript
{
  riderId: "rider_id",
  orderId: "order_id",
  location: {
    lat: 28.6139,
    lng: 77.2090
  },
  heading: 45,
  speed: 25,
  timestamp: "2024-01-15T10:30:00Z"
}
```

#### Customer Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `customer:track-order` | Client → Server | Start tracking order |
| `customer:untrack-order` | Client → Server | Stop tracking order |
| `order:status-update` | Server → Client | Order status changed |
| `order:location-update` | Server → Client | Rider location update |

#### Admin Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `admin:join-tracking` | Client → Server | Join admin tracking room |
| `admin:leave-tracking` | Client → Server | Leave admin tracking room |
| `rider-online` | Server → Client | Rider came online |
| `rider-offline` | Server → Client | Rider went offline |
| `rider-location-update` | Server → Client | Any rider location update |

### Socket Rooms

| Room | Subscribers | Purpose |
|------|-------------|---------|
| `order-{orderId}` | Customer, Rider | Order-specific updates |
| `admin-tracking` | Admins | All rider location updates |
| `rider-{riderId}` | Specific rider | Direct messages to rider |

---

## Database Models

### RiderWallet Schema

```javascript
{
  riderId: ObjectId,           // Reference to User
  currentBalance: Number,       // Available balance
  lifetimeEarnings: Number,     // Total earnings ever
  cashCollected: Number,        // COD cash held
  pendingSettlement: Number,    // Awaiting settlement
  todayEarnings: Number,        // Today's earnings
  todayDeliveries: Number,      // Today's delivery count
  weekEarnings: Number,         // This week's earnings
  weekDeliveries: Number,       // This week's deliveries
  lastSettlementDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### WalletTransaction Schema

```javascript
{
  walletId: ObjectId,           // Reference to RiderWallet
  riderId: ObjectId,            // Reference to User
  type: String,                 // EARNING, SETTLEMENT, BONUS, PENALTY
  amount: Number,
  description: String,
  orderId: ObjectId,            // Optional order reference
  status: String,               // PENDING, COMPLETED, FAILED
  metadata: {
    orderAmount: Number,
    deliveryFee: Number,
    tip: Number,
    incentive: Number
  },
  createdAt: Date
}
```

### RiderLocationHistory Schema

```javascript
{
  riderId: ObjectId,
  orderId: ObjectId,            // Optional
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  accuracy: Number,
  heading: Number,
  speed: Number,
  timestamp: Date,
  createdAt: Date               // TTL: 7 days
}
```

### StoreLocation Schema

```javascript
{
  name: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String
  },
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  isActive: Boolean,
  operatingHours: {
    open: String,
    close: String
  },
  contactPhone: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Configuration

### Environment Variables

```env
# Server
PORT=8080
MONGODB_URI=mongodb://localhost:27017/quickart
JWT_SECRET=your_jwt_secret

# Socket.io
SOCKET_ORIGIN=http://localhost:5173

# Google Maps (optional - for server-side geocoding)
GOOGLE_MAPS_API_KEY=your_api_key
```

### Frontend Configuration

```javascript
// client/src/config/socket.js
const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:8080'
  : import.meta.env.VITE_API_URL;
```

### Vite Proxy (Development)

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true
      }
    }
  }
});
```

---

## Testing Guide

### Manual Testing Checklist

#### Rider Flow
- [ ] Login as DELIVERY_AGENT role user
- [ ] Toggle online/offline status
- [ ] Verify location sharing when online
- [ ] See available orders list
- [ ] Accept an order
- [ ] View store location on map
- [ ] Navigate to store (opens Google Maps)
- [ ] Mark "Arrived at Store"
- [ ] Mark "Order Picked Up"
- [ ] Navigate to customer location
- [ ] Mark "Reached Customer"
- [ ] Enter OTP and verify
- [ ] Confirm delivery complete
- [ ] Check earning added to wallet
- [ ] View order in history

#### Customer Flow
- [ ] Place an order
- [ ] Open track order page
- [ ] See order progress stepper
- [ ] When rider assigned, see rider details
- [ ] See live map with rider location
- [ ] Verify pin moves as rider moves
- [ ] Receive OTP when rider arrives
- [ ] Share OTP with rider
- [ ] See delivery confirmed

#### Admin Flow
- [ ] Login as ADMIN
- [ ] Open rider tracking page
- [ ] See all online riders on map
- [ ] Click rider to see details
- [ ] Verify real-time location updates
- [ ] See rider status (active/available)

### API Testing with cURL

```bash
# Get dashboard
curl -X GET http://localhost:8080/api/delivery/dashboard \
  -H "Cookie: accessToken=YOUR_TOKEN"

# Toggle online status
curl -X POST http://localhost:8080/api/delivery/toggle-status \
  -H "Cookie: accessToken=YOUR_TOKEN"

# Update location
curl -X POST http://localhost:8080/api/delivery/location \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"latitude": 28.6139, "longitude": 77.2090}'

# Accept order
curl -X POST http://localhost:8080/api/delivery/accept/ORDER_ID \
  -H "Cookie: accessToken=YOUR_TOKEN"

# Verify OTP
curl -X POST http://localhost:8080/api/delivery/verify-otp/ORDER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"otp": "1234"}'
```

---

## File Structure

```
Quickart/
├── server/
│   ├── controllers/
│   │   └── delivery.controller.js     # All delivery logic
│   ├── models/
│   │   ├── riderWallet.model.js       # Wallet schema
│   │   ├── walletTransaction.model.js # Transaction schema
│   │   ├── riderLocationHistory.model.js
│   │   └── storeLocation.model.js
│   ├── route/
│   │   └── delivery.route.js          # API routes
│   └── index.js                       # Socket event handlers
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DeliveryDashboard.jsx
│   │   │   ├── ActiveOrderPage.jsx
│   │   │   ├── RiderWalletPage.jsx
│   │   │   ├── RiderOrdersPage.jsx
│   │   │   ├── AdminRiderTracking.jsx
│   │   │   └── TrackOrderPage.jsx
│   │   ├── components/
│   │   │   ├── LiveMap.jsx            # Real-time tracking
│   │   │   ├── DeliveryMap.jsx        # Static map
│   │   │   └── UserMenu.jsx           # Updated with links
│   │   ├── config/
│   │   │   └── socket.js              # Socket service
│   │   ├── common/
│   │   │   └── SummaryApi.js          # API endpoints
│   │   └── route/
│   │       └── index.jsx              # Route definitions
│   │
│   └── docs/
│       └── DELIVERY_SYSTEM_DOCUMENTATION.md
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Socket not connecting | Check CORS settings, verify socket URL |
| Location not updating | Ensure HTTPS in production, check permissions |
| Map not loading | Verify Leaflet CSS imported, check network |
| OTP not received | Check SMS gateway config, verify phone number |
| Wallet not updating | Check transaction creation, verify MongoDB connection |

### Debug Mode

Enable debug logging:
```javascript
// Frontend
localStorage.setItem('debug', 'socket.io-client:*');

// Backend
DEBUG=socket.io:* node server/index.js
```

---

## Security Considerations

1. **Authentication**: All API endpoints protected by JWT middleware
2. **Authorization**: Role-based access (DELIVERY_AGENT, ADMIN)
3. **OTP Security**: 4-digit OTP, 3 attempts max, 10-minute expiry
4. **Location Privacy**: Location history auto-deleted after 7 days
5. **Socket Authentication**: Validate user on socket connection

---

## Future Enhancements

- [ ] Push notifications for order updates
- [ ] In-app voice calls between rider and customer
- [ ] Automated route optimization
- [ ] Surge pricing during peak hours
- [ ] Rider performance analytics
- [ ] Multi-language support
- [ ] Offline mode with sync

---

*Documentation Version: 1.0*
*Last Updated: January 2024*
*Quickart Quick Commerce Platform*
