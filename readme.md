# 🛒 Quickart - Full Stack Quick Commerce Platform

A full-stack quick commerce platform built with the MERN stack (MongoDB, Express.js, React, Node.js), designed for rapid grocery and essentials delivery with real-time order tracking, smart delivery management, and a seamless user experience.

## ✨ Key Features

### 🚀 User Experience
- 🔐 **Authentication System** — Register, Login, JWT-based auth with OTP verification
- 📍 **Smart Location Detection** — GPS progressive refinement, Google Places autocomplete, address management
- 🛍️ **Shopping Cart** — Real-time cart management with price calculations
- ❤️ **Wishlist** — Save favorites for quick reordering
- 🔍 **Product Discovery** — Advanced filters, 7 sort options, category browsing
- ⭐ **Reviews & Ratings** — User feedback system with image upload

### 🚚 Delivery & Order Management
- 🗺️ **Real-Time Order Tracking** — Live rider location on interactive maps (Socket.io)
- 📦 **Smart Order Assignment** — Zone-based delivery agent allocation with broadcast
- 👨‍💼 **Admin Dashboard** — Fleet management, multi-rider tracking, analytics
- 💳 **Payment Gateway** — Stripe & Razorpay integration with COD option
- 📧 **Email Notifications** — Order confirmation, dispatch, delivery, and more

### 🛡️ Advanced Features
- 🎯 **Product Recommendations** — AI-driven personalized suggestions
- 📊 **Admin Analytics** — Sales insights, agent performance metrics
- 🔒 **Rate Limiting** — Upstash Redis-based protection
- 💰 **Partial Prepayment** — COD fraud prevention (60-80% fake order reduction)
- 📱 **Responsive Design** — Fully optimized for mobile and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account
- Cloudinary account
- Stripe account
- Resend account (for emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/KKBAE143/Quickart-Web.git
cd Quickart-Web
```

2. **Install dependencies**

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Configure Environment Variables**

Generate JWT secrets:
```bash
cd ..
node generate-secrets.js
```

Update environment files:
- `server/.env` - Server configuration
- `client/.env` - Client configuration

4. **Run the application**

Start the server (Terminal 1):
```bash
cd server
npm run dev
```

Start the client (Terminal 2):
```bash
cd client
npm run dev
```

- Server: http://localhost:8080
- Client: http://localhost:5173

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React** | UI library |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Redux Toolkit** | State management |
| **React Router** | Routing |
| **Axios** | HTTP client |
| **Socket.io Client** | Real-time updates |
| **Lucide React** | Icons |
| **Google Maps API** | Location & maps |
| **Stripe.js / Razorpay** | Payment integration |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM |
| **JWT** | Authentication |
| **Socket.io** | Real-time communication |
| **Cloudinary** | Image storage |
| **Stripe / Razorpay** | Payment processing |
| **Resend** | Email service |
| **Upstash Redis** | Rate limiting & caching |

## 📁 Project Structure

```
Quickart/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store & slices
│   │   ├── utils/          # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Layout components
│   │   ├── provider/       # Context providers
│   │   ├── config/         # Socket & API config
│   │   └── route/          # Route definitions
│   └── public/             # Static assets & images
│
├── server/                 # Node.js backend
│   ├── config/            # DB, payment, email config
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── route/             # API route definitions
│   ├── middleware/        # Auth, admin, upload middleware
│   ├── utils/             # Helpers & email templates
│   ├── services/          # Business logic services
│   ├── jobs/              # Background jobs
│   └── scripts/           # Utility scripts
│
├── docs/                  # Comprehensive documentation
│   ├── setup/            # Installation & configuration
│   ├── features/         # Feature documentation
│   ├── ui-ux/            # Design & UI docs
│   ├── guides/           # Developer guides
│   └── troubleshooting/  # Error resolution guides
│
├── generate-secrets.js    # JWT secret generator
└── start-dev.bat          # Quick start script
```

## 🔐 Environment Variables

### Server (`server/.env`)
```env
PORT=8080
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_uri
SECRET_KEY_ACCESS_TOKEN=your_access_token_secret
SECRET_KEY_REFRESH_TOKEN=your_refresh_token_secret
RESEND_API=your_resend_api_key
CLODINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLODINARY_API_KEY=your_cloudinary_api_key
CLODINARY_API_SECRET_KEY=your_cloudinary_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## 📖 Documentation

Full documentation is available in the [`docs/`](./Quickart/docs/) folder:

- **[Setup Guide](./Quickart/docs/setup/SETUP_GUIDE.md)** — Detailed setup instructions
- **[Quick Start](./Quickart/docs/setup/QUICK_START.md)** — Quick reference guide
- **[Features](./Quickart/docs/features/)** — All feature documentation
- **[Troubleshooting](./Quickart/docs/troubleshooting/)** — Common issues & fixes
- **[UI/UX](./Quickart/docs/ui-ux/)** — Design & styling guide

## 🎯 Features Breakdown

### 🧑‍💼 User Features
- User registration & login with OTP
- Email verification & password reset
- Profile & address management
- Shopping cart with real-time updates
- Order placement & history
- Product search & category browsing
- Reviews & ratings
- Wishlist management

### 👨‍💼 Admin Features
- Category & subcategory management
- Product CRUD with image upload
- Order management & tracking
- Rider/fleet management
- Real-time multi-rider tracking
- Analytics dashboard
- Agent performance metrics
- Payout management

### 🚚 Delivery Features
- Zone-based order assignment
- Real-time location sharing
- Order acceptance workflow
- Delivery status updates
- Customer chat & call integration
- Wallet & earnings tracking

## 🔒 Security

- JWT-based authentication (access + refresh tokens)
- Password hashing with bcrypt
- HTTP-only cookies for token storage
- CORS protection
- Helmet.js security headers
- Rate limiting with Upstash Redis
- Environment variables for sensitive data
- Input validation & sanitization

## 📦 API Overview

The backend exposes RESTful API endpoints:

| Endpoint | Description |
|---|---|
| `/api/user` | Authentication & profile |
| `/api/category` | Category management |
| `/api/subcategory` | Subcategory management |
| `/api/product` | Product CRUD & search |
| `/api/cart` | Shopping cart operations |
| `/api/order` | Order placement & tracking |
| `/api/address` | Address management |
| `/api/review` | Reviews & ratings |
| `/api/wishlist` | Wishlist management |
| `/api/delivery` | Delivery assignment & tracking |
| `/api/recommendation` | Product recommendations |
| `/api/chat` | Real-time messaging |
| `/api/call` | Voice call integration |

## 📊 Performance

- ⚡ **90+ Lighthouse scores** — Optimized for speed
- 📱 **Fully responsive** — Mobile-first design
- 🖼️ **Lazy loading** — Images & components load on demand
- 🗃️ **Redis caching** — Rate limiting & data caching
- 🔄 **Socket.io** — Real-time updates without polling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**KKBAE143** — Quickart Development Team

## 🙏 Acknowledgments

- Built with modern web technologies
- Thanks to all the open-source libraries used
- MongoDB, Express, React, Node.js ecosystem

---

**Status**: ✅ Production-ready | **Version**: 1.0.0

For setup help or issues, check the [docs](./Quickart/docs/) folder or review the [troubleshooting guides](./Quickart/docs/troubleshooting/).
