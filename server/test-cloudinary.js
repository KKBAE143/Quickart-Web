// Test Cloudinary Configuration
// Run this with: cd server && node test-cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function testCloudinary() {
    console.log('\n🔍 Testing Cloudinary Configuration...\n');
    
    // Check if credentials are set
    const cloudName = process.env.CLODINARY_CLOUD_NAME;
    const apiKey = process.env.CLODINARY_API_KEY;
    const apiSecret = process.env.CLODINARY_API_SECRET_KEY;

    console.log('📋 Checking credentials:');
    console.log('   Cloud Name:', cloudName ? '✅ Set' : '❌ Missing');
    console.log('   API Key:', apiKey ? '✅ Set' : '❌ Missing');
    console.log('   API Secret:', apiSecret ? '✅ Set' : '❌ Missing');
    console.log();

    if (!cloudName || !apiKey || !apiSecret) {
        console.error('❌ ERROR: Cloudinary credentials are missing!');
        console.log('\n📝 To fix this:');
        console.log('   1. Go to https://cloudinary.com/');
        console.log('   2. Sign up for a free account');
        console.log('   3. Go to Dashboard');
        console.log('   4. Copy your credentials:');
        console.log('      - Cloud Name');
        console.log('      - API Key');
        console.log('      - API Secret');
        console.log('   5. Add them to server/.env:');
        console.log('      CLODINARY_CLOUD_NAME=your_cloud_name');
        console.log('      CLODINARY_API_KEY=your_api_key');
        console.log('      CLODINARY_API_SECRET_KEY=your_api_secret');
        console.log('\n💡 Free tier includes:');
        console.log('   - 25 GB storage');
        console.log('   - 25 GB bandwidth/month');
        console.log('   - All features included\n');
        process.exit(1);
    }

    // Configure Cloudinary
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });

    try {
        console.log('🧪 Testing connection to Cloudinary...');
        
        // Test by getting account details
        const result = await cloudinary.api.ping();
        
        console.log('✅ Cloudinary connection successful!');
        console.log('\n📊 Account Information:');
        console.log('   Status:', result.status);
        console.log('   Cloud Name:', cloudName);
        
        // Try to list resources to verify permissions
        try {
            const resources = await cloudinary.api.resources({ 
                max_results: 1,
                type: 'upload'
            });
            console.log('   Total images:', resources.total_count || 0);
        } catch (e) {
            console.log('   Unable to fetch resources count');
        }

        console.log('\n✅ Cloudinary is configured correctly!');
        console.log('   You can now upload images to your Quickart app.\n');

        // Test upload folder
        console.log('📁 Upload folder: quickart');
        console.log('   Images will be organized in this folder\n');

    } catch (error) {
        console.error('\n❌ Cloudinary connection failed!');
        console.error('   Error:', error.message);
        
        if (error.http_code === 401) {
            console.log('\n💡 This usually means:');
            console.log('   - Your API Key or API Secret is incorrect');
            console.log('   - Double-check your credentials in .env file');
        } else if (error.http_code === 403) {
            console.log('\n💡 This usually means:');
            console.log('   - Your API key doesn\'t have the necessary permissions');
            console.log('   - Try generating a new API key in Cloudinary dashboard');
        }
        
        console.log('\n📝 Quick fix:');
        console.log('   1. Go to https://cloudinary.com/console');
        console.log('   2. Check your Dashboard for correct credentials');
        console.log('   3. Update server/.env with correct values');
        console.log('   4. Restart your server\n');
        
        process.exit(1);
    }
}

testCloudinary();

