# 📋 Setup Checklist

## ✅ Completed

- [x] Install Node.js and npm
- [x] Clone repository
- [x] Install client dependencies (378 packages)
- [x] Install server dependencies (236 packages)
- [x] Create environment files

## 🔧 Configuration Steps

### Step 1: Generate JWT Secrets
- [ ] Run: `node generate-secrets.js`
- [ ] Copy the generated keys to `server/.env`
  - [ ] `SECRET_KEY_ACCESS_TOKEN`
  - [ ] `SECRET_KEY_REFRESH_TOKEN`

### Step 2: Setup MongoDB
- [ ] Create account at https://www.mongodb.com/cloud/atlas
- [ ] Create a new cluster (free tier is fine)
- [ ] Create database user
- [ ] Whitelist IP address (0.0.0.0/0 for development)
- [ ] Get connection string
- [ ] Update `MONGODB_URI` in `server/.env`

### Step 3: Setup Resend (Email Service)
- [ ] Create account at https://resend.com/
- [ ] Verify email
- [ ] Generate API key
- [ ] Update `RESEND_API` in `server/.env`
- [ ] (Optional) Update sender email in `server/config/sendEmail.js`

### Step 4: Setup Cloudinary (Image Upload)
- [ ] Create account at https://cloudinary.com/
- [ ] Go to Dashboard
- [ ] Copy credentials:
  - [ ] Cloud Name → `CLODINARY_CLOUD_NAME`
  - [ ] API Key → `CLODINARY_API_KEY`
  - [ ] API Secret → `CLODINARY_API_SECRET_KEY`
- [ ] Update all three in `server/.env`

### Step 5: Setup Stripe (Payment Gateway)
- [ ] Create account at https://dashboard.stripe.com/
- [ ] Switch to Test Mode
- [ ] Go to Developers → API Keys
- [ ] Copy Secret Key (sk_test_...)
- [ ] Update `STRIPE_SECRET_KEY` in `server/.env`

### Step 6: Verify Configuration
- [ ] Open `server/.env`
- [ ] Confirm all variables are filled (no "your_*_here" placeholders)
- [ ] Open `client/.env`
- [ ] Confirm `VITE_API_URL=http://localhost:8080`

### Step 7: Test the Setup
- [ ] Open Terminal 1: `cd server && npm run dev`
- [ ] Verify server starts without errors
- [ ] Check: "Server is running 8080"
- [ ] Check: "connect DB"
- [ ] Open Terminal 2: `cd client && npm run dev`
- [ ] Verify client starts without errors
- [ ] Open browser: http://localhost:5173

### Step 8: Test Basic Functionality
- [ ] Register a new user account
- [ ] Check email for verification (if Resend is configured)
- [ ] Login with credentials
- [ ] Test image upload (profile picture)
- [ ] Create a test category (admin feature)
- [ ] Upload a test product (admin feature)

## 🎯 Quick Links

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Resend Email**: https://resend.com/
- **Cloudinary**: https://cloudinary.com/
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Stripe Test Cards**: https://stripe.com/docs/testing

## 📝 Environment Variables Summary

### Required for Server to Start
- ✅ `MONGODB_URI` - Database connection
- ✅ `SECRET_KEY_ACCESS_TOKEN` - JWT authentication
- ✅ `SECRET_KEY_REFRESH_TOKEN` - JWT authentication

### Required for Full Functionality
- `RESEND_API` - Email sending
- `CLODINARY_CLOUD_NAME` - Image uploads
- `CLODINARY_API_KEY` - Image uploads
- `CLODINARY_API_SECRET_KEY` - Image uploads
- `STRIPE_SECRET_KEY` - Payment processing

### Optional/Pre-configured
- `PORT` - Server port (default: 8080)
- `FRONTEND_URL` - CORS configuration (default: http://localhost:5173)

## 🚨 Troubleshooting

### Server won't start
- Check MongoDB connection string format
- Verify all required environment variables are set
- Check if port 8080 is already in use

### Client won't start
- Check if port 5173 is already in use
- Verify `VITE_API_URL` in `client/.env`

### Database connection failed
- Whitelist your IP in MongoDB Atlas
- Check username/password in connection string
- Verify network connectivity

### Images not uploading
- Verify all three Cloudinary credentials
- Check cloud name spelling
- Ensure API secret is complete

### Payments not working
- Verify you're using test mode keys
- Check Stripe dashboard for errors
- Use test card numbers from Stripe docs

## 🔒 Security Reminders

- [ ] Never commit `.env` files
- [ ] Use test keys for development
- [ ] Rotate keys regularly in production
- [ ] Keep MongoDB credentials secure
- [ ] Use strong passwords

## 📞 Need Help?

Refer to these files:
- `QUICK_START.md` - Quick reference
- `SETUP_GUIDE.md` - Detailed instructions
- `generate-secrets.js` - JWT key generator

---

**Current Status**: Dependencies installed, ready for configuration! 🎉

Once all checkboxes above are completed, your application will be fully operational.

