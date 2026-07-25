// Test MongoDB Connection
// Run this with: cd server && node test-mongodb.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    console.log('\n🔍 Testing MongoDB Connection...\n');
    
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in .env file');
        console.log('   Add your MongoDB connection string to server/.env');
        process.exit(1);
    }
    
    console.log('📝 Connection string format check:');
    const uri = process.env.MONGODB_URI;
    const masked = uri.replace(/:(.*?)@/, ':****@'); // Mask password
    console.log('   URI:', masked);
    console.log('   Protocol:', uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://') ? '✅' : '❌');
    console.log('   Has credentials:', uri.includes('@') ? '✅' : '❌');
    console.log('   Has cluster:', uri.includes('mongodb.net') ? '✅' : '❌');
    console.log();
    
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        console.log('   (This may take 10-30 seconds)\n');
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000 // 10 second timeout
        });
        
        console.log('✅ Connected successfully!\n');
        
        console.log('📊 Connection details:');
        console.log('   Host:', mongoose.connection.host);
        console.log('   Database:', mongoose.connection.name || '(default)');
        console.log('   Ready State:', mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Not connected ❌');
        console.log();
        
        // Try to list collections
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('📦 Collections:', collections.length ? collections.map(c => c.name).join(', ') : '(none yet)');
        } catch (e) {
            console.log('📦 Collections: Unable to list');
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Test completed successfully!');
        console.log('   Your MongoDB connection is working properly.\n');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error('   Error:', error.message);
        
        if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.log('\n💡 IP WHITELIST ISSUE:');
            console.log('   Your IP address is not whitelisted in MongoDB Atlas.');
            console.log('\n   Quick Fix:');
            console.log('   1. Go to: https://cloud.mongodb.com/v2#/security/network/accessList');
            console.log('   2. Click "+ ADD IP ADDRESS"');
            console.log('   3. Select "ALLOW ACCESS FROM ANYWHERE"');
            console.log('   4. Click "Confirm"');
            console.log('   5. Wait 1-2 minutes');
            console.log('   6. Run this test again\n');
        } else if (error.message.includes('authentication') || error.message.includes('auth')) {
            console.log('\n💡 AUTHENTICATION ISSUE:');
            console.log('   Your username or password is incorrect.');
            console.log('\n   Fix:');
            console.log('   1. Go to: https://cloud.mongodb.com/v2#/security/database/users');
            console.log('   2. Click "Edit" on your user');
            console.log('   3. Click "Edit Password"');
            console.log('   4. Set a new password (no special characters)');
            console.log('   5. Update MONGODB_URI in server/.env');
            console.log('   6. Run this test again\n');
        } else {
            console.log('\n💡 Common solutions:');
            console.log('   1. Check IP is whitelisted (allow 0.0.0.0/0 for dev)');
            console.log('   2. Verify username and password are correct');
            console.log('   3. Check connection string format');
            console.log('   4. Make sure database name is in the URI');
            console.log('   5. URL-encode special characters in password\n');
        }
        
        console.log('📚 For detailed help, see: MONGODB_SETUP.md\n');
        process.exit(1);
    }
}

testConnection();

