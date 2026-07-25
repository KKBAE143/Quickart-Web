# 🖼️ Cloudinary Setup Guide

## ❌ Current Issue

You're getting this error when uploading images:
```
"Cannot read properties of undefined (reading 'url')"
```

**Reason**: Cloudinary credentials are not configured in your `.env` file.

## ✅ Solution: Set Up Cloudinary

### Step 1: Sign Up for Cloudinary (Free)

1. Go to: https://cloudinary.com/
2. Click "Sign Up for Free"
3. Fill in your details or sign up with Google
4. Verify your email

**Free Tier Includes:**
- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ Unlimited transformations
- ✅ All features included

### Step 2: Get Your Credentials

1. After signing in, you'll see the **Dashboard**
2. Look for the **Account Details** section
3. You'll see three important values:

```
Cloud Name: your_cloud_name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz
```

**Screenshot Example:**
```
┌─────────────────────────────────────────┐
│ Account Details                          │
├─────────────────────────────────────────┤
│ Cloud name    your_cloud_name           │
│ API Key       123456789012345           │
│ API Secret    ●●●●●●●●●●●●●●●●  [Show] │
└─────────────────────────────────────────┘
```

### Step 3: Update Your `.env` File

Open `server/.env` and update these three lines:

```env
# Replace these placeholders with your actual credentials
CLODINARY_CLOUD_NAME=your_cloud_name_here
CLODINARY_API_KEY=your_api_key_here
CLODINARY_API_SECRET_KEY=your_api_secret_here
```

**Example:**
```env
CLODINARY_CLOUD_NAME=dqr8x2abc
CLODINARY_API_KEY=123456789012345
CLODINARY_API_SECRET_KEY=abcdefGHIJKLmnopqrstUVWXYZ
```

⚠️ **Important Notes:**
- Don't add quotes around the values
- No spaces before or after the `=` sign
- Cloud name is usually lowercase
- API Secret is case-sensitive

### Step 4: Test Your Configuration

```bash
cd server
node test-cloudinary.js
```

**Expected Output:**
```
🔍 Testing Cloudinary Configuration...

📋 Checking credentials:
   Cloud Name: ✅ Set
   API Key: ✅ Set
   API Secret: ✅ Set

🧪 Testing connection to Cloudinary...
✅ Cloudinary connection successful!

📊 Account Information:
   Status: ok
   Cloud Name: your_cloud_name
   Total images: 0

✅ Cloudinary is configured correctly!
   You can now upload images to your Quickart app.
```

### Step 5: Restart Your Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 6: Test Image Upload in Postman

1. **Method**: PUT
2. **URL**: `http://localhost:8080/api/user/upload-avatar`
3. **Headers**: 
   - Add your authentication token (if required)
4. **Body**: 
   - Select `form-data`
   - Key: `avatar` (type: File)
   - Value: Choose an image file
5. **Send**

**Expected Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "success": true,
  "error": false,
  "data": {
    "_id": "user_id_here",
    "avatar": "https://res.cloudinary.com/your_cloud/image/upload/v1234567890/quickart/abc123.jpg"
  }
}
```

## 🔧 What Was Fixed

### Before (Broken):
```javascript
// No error handling - returns undefined on failure
const uploadImage = await new Promise((resolve,reject)=>{
    cloudinary.uploader.upload_stream({ folder : "quickart"},(error,uploadResult)=>{
        return resolve(uploadResult)  // Even if error!
    }).end(buffer)
})
```

### After (Fixed):
```javascript
// Proper error handling - rejects on failure
const uploadImage = await new Promise((resolve, reject)=>{
    cloudinary.uploader.upload_stream(
        { folder : "quickart" },
        (error, uploadResult)=>{
            if (error) {
                console.error('Cloudinary upload error:', error);
                return reject(error);  // Properly reject
            }
            if (!uploadResult) {
                return reject(new Error('Cloudinary returned no result'));
            }
            return resolve(uploadResult);
        }
    ).end(buffer)
})
```

## 📁 Image Organization

All uploaded images will be stored in the **`quickart`** folder on Cloudinary:

```
Your Cloudinary Account
└── quickart/
    ├── user-avatar-1.jpg
    ├── user-avatar-2.jpg
    ├── product-1.jpg
    ├── product-2.jpg
    └── ... more images
```

You can change the folder name in `server/utils/uploadImageClodinary.js`:
```javascript
{ folder : "quickart" }  // Change this to any name you want
```

## 🔍 Troubleshooting

### Error: "Cloudinary credentials not configured"

**Cause**: Environment variables are not loaded or missing.

**Solution**:
1. Check `server/.env` file exists
2. Verify all three credentials are set
3. Restart your server
4. Run `node test-cloudinary.js` to verify

### Error: 401 Unauthorized

**Cause**: Invalid API Key or API Secret

**Solution**:
1. Go to https://cloudinary.com/console
2. Copy credentials again (click "Show" for API Secret)
3. Update `server/.env`
4. Make sure there are no extra spaces or quotes

### Error: 403 Forbidden

**Cause**: API key doesn't have upload permissions

**Solution**:
1. Go to https://cloudinary.com/console/settings/security
2. Check "Enable unsigned uploading" OR
3. Generate a new API key with full permissions

### Images Not Showing in Dashboard

**Cause**: Images uploaded to different folder or account

**Solution**:
1. Go to https://cloudinary.com/console/media_library
2. Check the "quickart" folder
3. If not there, check "All" uploads
4. Search by date

### Upload Slow or Timing Out

**Cause**: Large image file or slow connection

**Solution**:
1. Test with smaller images first (< 1 MB)
2. Check your internet connection
3. Try from a different network
4. Check Cloudinary status: https://status.cloudinary.com/

## 🎨 Features You Can Use

Once Cloudinary is configured, you can:

### Image Transformations
```javascript
// Resize images
avatar_url + '?w=200&h=200&c=fill'

// Apply effects
avatar_url + '?e_grayscale'

// Optimize quality
avatar_url + '?q_auto,f_auto'
```

### Automatic Optimization
- Images are automatically optimized
- Format conversion (WebP for supported browsers)
- CDN delivery for fast loading
- Responsive images

### Additional Configuration (Optional)
```javascript
cloudinary.uploader.upload_stream({
    folder: "quickart",
    transformation: [
        { width: 500, height: 500, crop: "fill" },
        { quality: "auto" },
        { fetch_format: "auto" }
    ]
})
```

## 📊 Monitoring Usage

Check your usage at: https://cloudinary.com/console/usage

Monitor:
- Storage used
- Bandwidth used
- Transformations
- API calls

## 🔒 Security Best Practices

1. **Don't Commit Credentials**
   - ✅ `.env` is in `.gitignore`
   - ❌ Never commit API secrets

2. **Rotate Keys Regularly**
   - Generate new API keys every few months
   - Revoke old keys

3. **Use Different Keys for Dev/Prod**
   - Development: test account
   - Production: production account

4. **Enable Upload Restrictions**
   - Set max file size
   - Restrict file types
   - Enable moderation

## 📝 Summary

✅ **What You Need to Do:**

1. Sign up at https://cloudinary.com/
2. Get your three credentials from Dashboard
3. Add them to `server/.env`:
   ```env
   CLODINARY_CLOUD_NAME=your_cloud_name
   CLODINARY_API_KEY=your_api_key
   CLODINARY_API_SECRET_KEY=your_api_secret
   ```
4. Test with: `cd server && node test-cloudinary.js`
5. Restart server: `npm run dev`
6. Try upload again in Postman

**Time needed**: 5 minutes

**Cost**: Free (forever for basic usage)

---

Once configured, your image uploads will work perfectly! 🎉

