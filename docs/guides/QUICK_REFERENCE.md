# Quickart Project - Quick Reference Guide

## 🚀 Quick Start Commands

### Start Development Servers
```bash
# Start both frontend and backend (from project root)
start-dev.bat

# Or start individually:
cd server && npm run dev    # Backend on port 8080
cd client && npm run dev     # Frontend on port 5173
```

### Seed Database with Categories
```bash
cd server
npm run seed
```

### Test Connections
```bash
cd server
node test-mongodb.js      # Test MongoDB connection
node test-cloudinary.js   # Test Cloudinary connection
node test-email.js         # Test email service
```

## 📁 Important Files

### Configuration
- `server/.env` - Backend environment variables (MongoDB, Cloudinary, Resend, Stripe)
- `client/.env` - Frontend environment variables (API URL)

### Documentation
- `QUICK_START.md` - Getting started guide
- `SETUP_GUIDE.md` - Detailed setup instructions
- `SEED_CATEGORIES.md` - How to seed categories and subcategories
- `SEED_SUMMARY.md` - Summary of what was seeded
- `CLOUDINARY_SETUP.md` - Cloudinary configuration
- `EMAIL_SETUP.md` - Email service configuration
- `MONGODB_SETUP.md` - MongoDB Atlas setup

### Scripts
- `server/seed-categories.js` - Seed all categories and subcategories
- `server/test-*.js` - Connection test scripts
- `start-dev.bat` - Start both servers

## 🗄️ Database Info

### Current Seeded Data
- **20 Categories** with images
- **221 Subcategories** with images and category relationships
- All images hosted on Cloudinary in "quickart" folder

### Collections
- `categories` - Product categories
- `subcategories` - Product subcategories
- `products` - Products (add via admin panel)
- `users` - User accounts
- `cartproducts` - Shopping cart items
- `orders` - Customer orders
- `addresses` - Delivery addresses

## 👤 Admin Access

### Create Admin User
1. Register a new user via the app
2. In MongoDB, update the user's `role` field to `"ADMIN"`
3. Log out and log back in

### Admin Features
- Category Management
- Subcategory Management
- Product Management
- Order Management
- User Management

## 🔧 Common Tasks

### Add New Category
**Option 1**: Use admin panel (manual)
**Option 2**: Add image to `client/public/Image/category/` and run `npm run seed`

### Add New Subcategory
**Option 1**: Use admin panel (manual)
**Option 2**: Add image to appropriate folder in `client/public/Image/sub category/` and run `npm run seed`

### Add Products
Use admin panel - no seed script (products are unique to your inventory)

### Update Environment Variables
1. Edit `server/.env` or `client/.env`
2. Restart the respective server

## 📦 Package Management

### Install Dependencies
```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### Update Dependencies
```bash
npm update
```

## 🌐 URLs

### Development
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **MongoDB**: (Atlas - check .env for connection string)
- **Cloudinary**: https://cloudinary.com/console

### API Endpoints
Base URL: `http://localhost:8080/api`
- `/user/*` - User authentication and management
- `/category/*` - Category operations
- `/subCategory/*` - Subcategory operations
- `/product/*` - Product operations
- `/cart/*` - Shopping cart operations
- `/order/*` - Order management
- `/address/*` - Address management
- `/upload` - Image upload

## 🔑 Environment Variables Reference

### Server (.env)
```
# MongoDB
MONGODB_URI=mongodb+srv://...

# Cloudinary
CLODINARY_CLOUD_NAME=your_cloud_name
CLODINARY_API_KEY=your_api_key
CLODINARY_API_SECRET_KEY=your_api_secret

# JWT Secrets
ACCESS_TOKEN_SECRET_KEY=generated_secret
REFRESH_TOKEN_SECRET_KEY=generated_secret

# Resend (Email)
RESEND_API=your_resend_api_key

# Stripe (Payment)
STRIPE_SECRET_KEY=your_stripe_secret
```

### Client (.env)
```
VITE_API_URL=http://localhost:8080
```

## 🛠️ Troubleshooting

### Server won't start
1. Check if MongoDB is accessible
2. Verify environment variables in `server/.env`
3. Check if port 8080 is available

### Client won't start
1. Check if backend is running
2. Verify `VITE_API_URL` in `client/.env`
3. Check if port 5173 is available

### Images not uploading
1. Run `node test-cloudinary.js` to verify connection
2. Check Cloudinary credentials in `server/.env`
3. Verify folder name is "quickart"

### Email not sending
1. Run `node test-email.js` to verify connection
2. Check Resend API key in `server/.env`
3. For development, use: "Quickart <onboarding@resend.dev>"

### Seed script issues
1. Ensure MongoDB is connected
2. Ensure Cloudinary is configured
3. Check image files exist in `client/public/Image/`
4. See `SEED_CATEGORIES.md` for detailed troubleshooting

## 📚 Learning Resources

### Project Structure
- `client/` - React frontend (Vite)
- `server/` - Express.js backend
- `client/public/Image/` - Category and subcategory images

### Key Technologies
- **Frontend**: React, Redux, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **File Upload**: Cloudinary, Multer
- **Authentication**: JWT, bcrypt
- **Email**: Resend
- **Payment**: Stripe

## 🎯 Next Steps After Setup

1. ✅ Categories and subcategories are seeded
2. 📦 Add products via admin panel
3. 🎨 Customize branding if needed
4. 🧪 Test the complete flow
5. 🚀 Deploy to production

## 💡 Pro Tips

- Run seed script multiple times safely (checks for existing data)
- Use test scripts to verify connections before troubleshooting
- Check the admin panel after seeding to verify data
- Images are automatically resized and optimized by Cloudinary
- Keep your `.env` files secure and never commit them to git

---

**Need detailed help?** Check the respective documentation files listed above.

