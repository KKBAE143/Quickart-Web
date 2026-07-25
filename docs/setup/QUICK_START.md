# 🚀 Quick Start Guide - Quickart

## ✅ Setup Status

All dependencies have been installed successfully!

- ✅ Client: 378 packages installed
- ✅ Server: 236 packages installed
- ✅ Environment files created

## 📝 Configuration Required

Before running the application, you need to configure these services:

### 1️⃣ MongoDB (Required)
- Sign up at: https://www.mongodb.com/cloud/atlas
- Get connection string
- Update `MONGODB_URI` in `server/.env`

### 2️⃣ JWT Secrets (Required)
Generate two random keys:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Update in `server/.env`:
- `SECRET_KEY_ACCESS_TOKEN`
- `SECRET_KEY_REFRESH_TOKEN`

### 3️⃣ Resend Email (Required for email features)
- Sign up at: https://resend.com/
- Get API key
- Update `RESEND_API` in `server/.env`

### 4️⃣ Cloudinary (Required for image uploads)
- Sign up at: https://cloudinary.com/
- Get credentials from dashboard
- Update in `server/.env`:
  - `CLODINARY_CLOUD_NAME`
  - `CLODINARY_API_KEY`
  - `CLODINARY_API_SECRET_KEY`

### 5️⃣ Stripe (Required for payments)
- Sign up at: https://dashboard.stripe.com/
- Get test API keys
- Update `STRIPE_SECRET_KEY` in `server/.env`

## 🏃 Running the Application

### Terminal 1 - Start Server
```bash
cd server
npm run dev
```
Server runs at: http://localhost:8080

### Terminal 2 - Start Client
```bash
cd client
npm run dev
```
Client runs at: http://localhost:5173

## 📂 Files Created

```
Quickart/
├── client/
│   └── .env              ← Client environment variables
├── server/
│   └── .env              ← Server environment variables
├── .env.example          ← Reference for all env variables
├── SETUP_GUIDE.md        ← Detailed setup instructions
└── QUICK_START.md        ← This file
```

## 🔧 Environment Files

### client/.env
```env
VITE_API_URL=http://localhost:8080
```

### server/.env
Contains configuration for:
- MongoDB connection
- JWT secrets
- Resend API
- Cloudinary
- Stripe

**⚠️ You must update all "your_*_here" placeholders with actual values!**

## ⚡ Quick Commands

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Install dependencies (if needed again)
cd client && npm install
cd ../server && npm install

# Run development servers
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

## 📖 Need More Help?

See **SETUP_GUIDE.md** for detailed instructions on:
- How to get each API key
- Troubleshooting common issues
- Security best practices
- Additional configuration options

## ⚠️ Important Notes

1. **Never commit .env files** - They contain sensitive data
2. **Use test keys** for development (especially Stripe)
3. **MongoDB Atlas** - Whitelist your IP address
4. **Resend Email** - Verify your domain for production

## 🎯 Next Steps

1. ✅ Dependencies installed
2. ⏳ Configure environment variables in `server/.env`
3. ⏳ Start both server and client
4. ⏳ Create your first account
5. ⏳ Start building!

---

**Status:** Ready to configure! 🎉

Once you update the environment variables, you'll be ready to run the application.

