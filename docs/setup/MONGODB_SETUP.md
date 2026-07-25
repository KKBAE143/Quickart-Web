# 🗄️ MongoDB Atlas Setup Guide

## ❌ Current Error

```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

**Reason**: Your current IP address is not whitelisted in MongoDB Atlas.

## ✅ Solution: Whitelist Your IP Address

### Quick Fix (Allow All IPs - Development Only)

1. **Go to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com/
   - Log in to your account

2. **Navigate to Network Access**
   - Click on "Network Access" in the left sidebar (under SECURITY)
   - Or go directly to: https://cloud.mongodb.com/v2#/security/network/accessList

3. **Add IP Address**
   - Click the "**+ ADD IP ADDRESS**" button
   - Select "**ALLOW ACCESS FROM ANYWHERE**"
   - This will add `0.0.0.0/0` (allows all IPs)
   - Click "**Confirm**"

4. **Wait for Changes to Apply**
   - Changes take ~1-2 minutes to propagate
   - You'll see a status indicator

5. **Restart Your Server**
   - The server will automatically reconnect

### Expected Output After Fix

```
Server is running 8080
connect DB ✅
```

---

## 🔒 Better Security (Recommended for Production)

### Option 1: Whitelist Your Current IP Only

1. Go to **Network Access**
2. Click "**+ ADD IP ADDRESS**"
3. Click "**ADD CURRENT IP ADDRESS**"
4. MongoDB will auto-detect your IP
5. Add a comment like "Home Network"
6. Click "**Confirm**"

**Note**: You'll need to update this if your IP changes (e.g., different WiFi network).

### Option 2: Whitelist Multiple Specific IPs

If you work from multiple locations:

1. Add each location's IP separately
2. Label them clearly:
   - "Home Network"
   - "Office Network"
   - "Coffee Shop WiFi"
3. Remove IPs you no longer use

---

## 🧪 Verify MongoDB Connection

### Step 1: Check Connection String Format

Your connection string in `server/.env` should look like:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

**Common Issues:**
- ❌ Missing `mongodb+srv://` prefix
- ❌ Wrong username or password
- ❌ Special characters in password not URL-encoded
- ❌ Wrong cluster URL

### Step 2: Test Connection

Create a test script to verify your connection:

```bash
cd server
node test-mongodb.js
```

---

## 📝 Complete MongoDB Atlas Setup

If you haven't set up MongoDB Atlas yet:

### 1. Create Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up (free - no credit card needed)
3. Verify your email

### 2. Create Cluster

1. After login, click "**Build a Database**"
2. Choose "**FREE**" tier (M0 Sandbox)
3. Select a cloud provider:
   - AWS (recommended)
   - Google Cloud
   - Azure
4. Choose a region close to you
5. Name your cluster (e.g., "Cluster0")
6. Click "**Create**"
7. Wait 3-5 minutes for cluster creation

### 3. Create Database User

1. Click "**Database Access**" (left sidebar, under SECURITY)
2. Click "**+ ADD NEW DATABASE USER**"
3. Authentication Method: **Password**
4. Username: Choose a username (e.g., `quickart_user`)
5. Password: 
   - Click "**Autogenerate Secure Password**" OR
   - Create your own (avoid special characters for simplicity)
   - **SAVE THIS PASSWORD!** You'll need it for the connection string
6. Database User Privileges: **Read and write to any database**
7. Click "**Add User**"

### 4. Whitelist IP Address

1. Click "**Network Access**" (left sidebar, under SECURITY)
2. Click "**+ ADD IP ADDRESS**"
3. For development: Click "**ALLOW ACCESS FROM ANYWHERE**"
4. Click "**Confirm**"
5. Wait 1-2 minutes for changes to apply

### 5. Get Connection String

1. Go back to "**Database**" (left sidebar)
2. Click "**Connect**" button on your cluster
3. Choose "**Connect your application**"
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace:
   - `<username>` with your database username
   - `<password>` with your database password
   - Add database name: `mongodb+srv://...mongodb.net/quickart?retryWrites...`

### 6. Update .env File

Open `server/.env` and update:

```env
MONGODB_URI=mongodb+srv://quickart_user:YourPassword123@cluster0.xxxxx.mongodb.net/quickart?retryWrites=true&w=majority
```

**Important:**
- Replace with YOUR actual connection string
- Add a database name (e.g., `quickart`) after `.net/`
- If password has special characters, URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

### 7. Restart Server

```bash
npm run dev
```

**Expected output:**
```
Server is running 8080
connect DB
```

---

## 🚨 Troubleshooting

### Error: "Authentication failed"

**Cause**: Wrong username or password

**Fix**:
1. Go to **Database Access** in MongoDB Atlas
2. Click "Edit" on your user
3. Click "Edit Password"
4. Set a new password (avoid special characters)
5. Update `MONGODB_URI` in `.env`
6. Restart server

### Error: "IP not whitelisted"

**Cause**: Your IP address changed or not added

**Fix**:
1. Go to **Network Access** in MongoDB Atlas
2. Check if your current IP is listed
3. Add `0.0.0.0/0` to allow all IPs (development)
4. Wait 1-2 minutes
5. Restart server

### Error: "Connection timeout"

**Possible causes**:
1. Firewall blocking MongoDB port (27017)
2. Network restrictions
3. MongoDB Atlas maintenance

**Fix**:
1. Try different network (mobile hotspot)
2. Check MongoDB Atlas status: https://status.mongodb.com/
3. Temporarily disable firewall (testing only)
4. Contact network admin if on company network

### Error: "Cannot find database"

**Cause**: Database name missing from connection string

**Fix**:
```env
# ❌ Wrong - no database name
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true

# ✅ Correct - with database name
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quickart?retryWrites=true
```

### Connection String Special Characters

If your password has special characters, URL-encode them:

**Example:**
- Password: `MyP@ssw0rd#123`
- Encoded: `MyP%40ssw0rd%23123`

**Common encodings:**
```
! → %21    # → %23    $ → %24    % → %25
& → %26    ' → %27    ( → %28    ) → %29
* → %2A    + → %2B    , → %2C    / → %2F
: → %3A    ; → %3B    = → %3D    ? → %3F
@ → %40    [ → %5B    ] → %5D
```

---

## 📊 MongoDB Atlas Free Tier Limits

Your free M0 cluster includes:
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Shared CPU
- ✅ No credit card required
- ✅ Never expires
- ✅ Perfect for development

**When to upgrade:**
- Need more than 512 MB storage
- Need dedicated resources
- Production deployment
- Need backups

---

## 🧪 Test MongoDB Connection Script

Save this as `server/test-mongodb.js`:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    console.log('\n🔍 Testing MongoDB Connection...\n');
    
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in .env file');
        process.exit(1);
    }
    
    console.log('📝 Connection string format check:');
    const uri = process.env.MONGODB_URI;
    console.log('   Protocol:', uri.startsWith('mongodb+srv://') ? '✅' : '❌');
    console.log('   Has username:', uri.includes('@') ? '✅' : '❌');
    console.log('   Has cluster:', uri.includes('mongodb.net') ? '✅' : '❌');
    console.log();
    
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(uri);
        console.log('✅ Connected successfully!\n');
        
        console.log('📊 Connection details:');
        console.log('   Host:', mongoose.connection.host);
        console.log('   Database:', mongoose.connection.name);
        console.log('   Ready State:', mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Not connected ❌');
        console.log();
        
        await mongoose.disconnect();
        console.log('✅ Test completed successfully!\n');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error('Error:', error.message);
        console.log('\n💡 Common solutions:');
        console.log('   1. Check IP is whitelisted: https://cloud.mongodb.com/v2#/security/network/accessList');
        console.log('   2. Verify username and password are correct');
        console.log('   3. Check connection string format');
        console.log('   4. Wait 1-2 minutes after whitelisting IP\n');
        process.exit(1);
    }
}

testConnection();
```

Run it:
```bash
cd server
node test-mongodb.js
```

---

## ✅ Quick Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created (free M0 tier)
- [ ] Database user created with password
- [ ] IP address whitelisted (`0.0.0.0/0` for dev)
- [ ] Connection string copied
- [ ] Database name added to connection string
- [ ] Connection string added to `server/.env`
- [ ] Special characters in password URL-encoded (if any)
- [ ] Server restarted
- [ ] See "connect DB" message ✅

---

## 🎯 Quick Fix Summary

**Right now, to fix your error:**

1. Go to: https://cloud.mongodb.com/v2#/security/network/accessList
2. Click "**+ ADD IP ADDRESS**"
3. Select "**ALLOW ACCESS FROM ANYWHERE**"
4. Click "**Confirm**"
5. Wait 2 minutes
6. Restart your server: `npm run dev`
7. Should see: "connect DB" ✅

**That's it!** Your MongoDB connection should work now.

---

**Time to fix**: 2-3 minutes  
**Cost**: Free (forever for M0 tier)

Once IP is whitelisted, your database will be connected! 🎉

