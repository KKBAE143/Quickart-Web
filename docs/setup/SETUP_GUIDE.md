# BlinkIt Clone - Setup Guide

## ✅ Installation Complete!

All dependencies have been installed successfully for both client and server.

## 📋 What Was Done

1. ✅ Installed client dependencies (React + Vite)
2. ✅ Installed server dependencies (Node.js + Express)
3. ✅ Created `.env` files for both client and server
4. ✅ Created `.env.example` for reference

## 🔧 Environment Configuration

You need to configure the following services to run the application:

### 1. MongoDB Database

**Sign up:** https://www.mongodb.com/cloud/atlas

1. Create a free cluster
2. Create a database user
3. Whitelist your IP address (or allow access from anywhere for development)
4. Get your connection string
5. Update `MONGODB_URI` in `server/.env`

**Format:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/<database_name>
```

### 2. JWT Secret Keys

Generate secure random strings for JWT tokens:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this command twice to generate two different keys:
- One for `SECRET_KEY_ACCESS_TOKEN`
- One for `SECRET_KEY_REFRESH_TOKEN`

Update both values in `server/.env`

### 3. Resend Email Service

**Sign up:** https://resend.com/

1. Create an account
2. Verify your domain (or use the test domain for development)
3. Generate an API key
4. Update `RESEND_API` in `server/.env`

**Note:** The app sends emails from `noreply@amitprajapati.co.in` - you'll need to update this in `server/config/sendEmail.js` to match your verified domain.

### 4. Cloudinary Image Upload

**Sign up:** https://cloudinary.com/

1. Create a free account
2. Go to Dashboard
3. Find your credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Update these values in `server/.env`:
   - `CLODINARY_CLOUD_NAME`
   - `CLODINARY_API_KEY`
   - `CLODINARY_API_SECRET_KEY`

### 5. Stripe Payment Gateway

**Sign up:** https://dashboard.stripe.com/register

1. Create an account
2. Go to Developers > API Keys
3. Use **Test Mode** for development
4. Copy the **Secret Key** (starts with `sk_test_`)
5. Update `STRIPE_SECRET_KEY` in `server/.env`

**For Client-Side:**
You'll also need the **Publishable Key** (starts with `pk_test_`) in your client code when implementing payment.

## 🚀 Running the Application

### Start the Server

```bash
cd server
npm run dev
```

The server will run on http://localhost:8080

### Start the Client

Open a new terminal:

```bash
cd client
npm run dev
```

The client will run on http://localhost:5173

## 📁 Environment Files Created

### server/.env
Contains all server-side configuration:
- Database connection
- API keys for external services
- JWT secrets
- Server port

### client/.env
Contains client-side configuration:
- Backend API URL

### .env.example
Reference file showing all required environment variables

## ⚠️ Important Notes

1. **Never commit `.env` files** to version control (they're already in `.gitignore`)
2. **Use test/development keys** during development
3. **Update FRONTEND_URL** in server/.env if your client runs on a different port
4. **Update VITE_API_URL** in client/.env if your server runs on a different port
5. For production, use production keys and update URLs accordingly

## 🔐 Security Best Practices

1. Keep your `.env` files private
2. Use strong, random JWT secret keys
3. Rotate your API keys regularly
4. Use environment-specific keys (development vs production)
5. Never expose secret keys in client-side code

## 🐛 Troubleshooting

### CORS Issues
Make sure `FRONTEND_URL` in `server/.env` matches your client URL exactly.

### Database Connection Failed
- Check your MongoDB connection string
- Verify your IP is whitelisted in MongoDB Atlas
- Ensure database user has proper permissions

### Email Not Sending
- Verify your Resend API key
- Update the sender email in `server/config/sendEmail.js` to match your verified domain

### Image Upload Failed
- Check Cloudinary credentials
- Verify API keys are correct
- Check cloud name is spelled correctly

### Payment Issues
- Make sure you're using test keys for development
- Verify Stripe secret key is correct
- Check Stripe dashboard for any API errors

## 📦 Available Scripts

### Server
- `npm start` - Run server in production mode
- `npm run dev` - Run server with nodemon (auto-restart on changes)

### Client
- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Next Steps

1. Configure all environment variables in `server/.env`
2. Start the server: `cd server && npm run dev`
3. Start the client: `cd client && npm run dev`
4. Create your first admin user through the registration page
5. Upload categories and products
6. Test the e-commerce flow

## 📝 Additional Configuration

### Admin User Setup
The first registered user can be made admin by updating the database directly. You may want to create a separate admin registration route or manually update the user role in MongoDB.

### Email Templates
Email templates are located in `server/utils/`:
- `verifyEmailTemplate.js` - For email verification
- `forgotPasswordTemplate.js` - For password reset

### Upload Configuration
Images are uploaded to Cloudinary with folder name "binkeyit". You can change this in `server/utils/uploadImageClodinary.js`.

## 🤝 Support

If you encounter any issues during setup:
1. Check the error messages carefully
2. Verify all environment variables are set correctly
3. Ensure all required services are properly configured
4. Check the console logs for detailed error information

Happy coding! 🚀

