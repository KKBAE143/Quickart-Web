# 🛒 BlinkIt Clone - Full Stack MERN E-commerce

A full-stack e-commerce application inspired by BlinkIt, built with the MERN stack (MongoDB, Express.js, React, Node.js).

## ✨ Features

- 🔐 User Authentication (Register, Login, JWT)
- 👤 User Profile Management
- 📧 Email Verification & Password Reset
- 🗂️ Category & Subcategory Management
- 📦 Product Management (CRUD)
- 🛍️ Shopping Cart
- 📍 Address Management
- 💳 Payment Integration (Stripe)
- 💵 Cash on Delivery Option
- 📱 Responsive Design
- 🎨 Modern UI with Tailwind CSS
- 🖼️ Image Upload (Cloudinary)
- 🔍 Product Search
- 📊 Admin Dashboard

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
git clone <repository-url>
cd BlinkIt-Clone-Full-Stack-Ecommerce
```

2. **Install dependencies**

All dependencies are already installed! ✅
- Client: 378 packages
- Server: 236 packages

If you need to reinstall:
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
node generate-secrets.js
```

Update environment files:
- `server/.env` - Server configuration
- `client/.env` - Client configuration

See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) for detailed configuration steps.

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

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick reference guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Step-by-step checklist
- **[.env.example](.env.example)** - Environment variables reference

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **Stripe.js** - Payment integration

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Image storage
- **Stripe** - Payment processing
- **Resend** - Email service
- **Multer** - File upload

## 📁 Project Structure

```
BlinkIt-Clone-Full-Stack-Ecommerce/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   ├── utils/          # Utility functions
│   │   ├── hooks/          # Custom hooks
│   │   └── layouts/        # Layout components
│   └── .env               # Client environment variables
│
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   └── .env              # Server environment variables
│
├── generate-secrets.js    # JWT secret generator
├── SETUP_GUIDE.md        # Detailed setup guide
├── QUICK_START.md        # Quick reference
└── SETUP_CHECKLIST.md    # Setup checklist
```

## 🔐 Environment Variables

### Server (.env in server folder)
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
```

### Client (.env in client folder)
```env
VITE_API_URL=http://localhost:8080
```

## 🔑 API Keys Setup

1. **MongoDB**: https://www.mongodb.com/cloud/atlas
2. **Cloudinary**: https://cloudinary.com/
3. **Stripe**: https://dashboard.stripe.com/
4. **Resend**: https://resend.com/

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions on obtaining these keys.

## 📝 Available Scripts

### Server
```bash
npm start       # Run in production
npm run dev     # Run with nodemon (development)
```

### Client
```bash
npm run dev     # Development server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

## 🎯 Features Breakdown

### User Features
- User registration and login
- Email verification
- Password reset via email
- Profile management
- Address management
- Shopping cart
- Order placement
- Order history
- Product search
- Category browsing

### Admin Features
- Category management
- Subcategory management
- Product management (Add, Edit, Delete)
- Image upload
- Order management

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- HTTP-only cookies for tokens
- CORS protection
- Helmet.js security headers
- Environment variables for sensitive data

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Verify `FRONTEND_URL` in `server/.env` matches your client URL
2. **Database Connection**: Check MongoDB URI and IP whitelist
3. **Image Upload Fails**: Verify Cloudinary credentials
4. **Payment Issues**: Ensure Stripe test keys are correct

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for more troubleshooting tips.

## 📦 Dependencies Status

- ✅ Client dependencies: 378 packages installed
- ✅ Server dependencies: 236 packages installed
- ✅ Environment files created

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the client: `cd client && npm run build`
2. Deploy the `dist` folder
3. Update `VITE_API_URL` to your backend URL

### Backend (Render/Railway/Heroku)
1. Set environment variables
2. Deploy the `server` folder
3. Update `FRONTEND_URL` to your frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built as a learning project for full-stack MERN development.

## 🙏 Acknowledgments

- Inspired by BlinkIt (Blinkit)
- Built with modern web technologies
- Thanks to all the open-source libraries used

## 📞 Support

For setup help or issues:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
3. Verify environment variables
4. Check console logs for errors

---

**Status**: ✅ Ready for configuration!

All dependencies are installed. Follow the [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) to configure your environment variables and start building! 🚀
