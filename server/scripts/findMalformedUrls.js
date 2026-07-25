/**
 * Find Malformed URLs Script
 * 
 * This script finds ALL malformed URLs in the database
 * including in reviews, products, and any other collections
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ReviewModel from '../models/review.model.js';
import ProductModel from '../models/product.model.js';

dotenv.config();

// Validate image URL
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url === 'null' || url === 'undefined' || url === '' || url.trim() === '') return false;
    
    // Check for control characters (0x00-0x1F, 0x7F)
    if (/[\x00-\x1F\x7F]/.test(url)) return false;
    
    // Must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    
    try {
        const decoded = decodeURI(url);
        const urlObj = new URL(decoded);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
};

const findMalformedUrls = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('🔍 Searching for "Fortune Chakki Fresh" product...\n');
        
        // Find the specific product
        const products = await ProductModel.find({
            name: { $regex: 'Fortune.*Chakki.*Fresh', $options: 'i' }
        });
        
        console.log(`Found ${products.length} matching product(s):\n`);
        
        for (const product of products) {
            console.log(`\n📦 Product: ${product.name}`);
            console.log(`   ID: ${product._id}`);
            console.log(`   Images: ${product.image?.length || 0}`);
            
            // Check product images
            if (product.image && product.image.length > 0) {
                console.log('\n   Product Images:');
                product.image.forEach((img, idx) => {
                    const valid = isValidImageUrl(img);
                    console.log(`   ${idx + 1}. ${valid ? '✅' : '❌'} ${img.substring(0, 100)}...`);
                });
            }
            
            // Find all reviews for this product (including deleted status)
            const reviews = await ReviewModel.find({ productId: product._id });
            console.log(`\n   Reviews found: ${reviews.length}`);
            
            for (const review of reviews) {
                console.log(`\n   Review ID: ${review._id}`);
                console.log(`   Status: ${review.status}`);
                console.log(`   Images: ${review.images?.length || 0}`);
                
                if (review.images && review.images.length > 0) {
                    console.log('   Review Images:');
                    review.images.forEach((img, idx) => {
                        const valid = isValidImageUrl(img);
                        console.log(`   ${idx + 1}. ${valid ? '✅' : '❌'} ${img.substring(0, 100)}...`);
                        
                        if (!valid) {
                            console.log(`      ⚠️  MALFORMED URL FOUND!`);
                            console.log(`      Full URL: ${img}`);
                            console.log(`      Length: ${img.length}`);
                            console.log(`      Hex: ${Buffer.from(img).toString('hex').substring(0, 100)}...`);
                        }
                    });
                }
            }
        }

        console.log('\n\n🔍 Checking ALL reviews in database...\n');
        const allReviews = await ReviewModel.find({});
        console.log(`Total reviews: ${allReviews.length}\n`);
        
        let malformedCount = 0;
        for (const review of allReviews) {
            if (review.images && review.images.length > 0) {
                const invalidImages = review.images.filter(img => !isValidImageUrl(img));
                if (invalidImages.length > 0) {
                    malformedCount++;
                    console.log(`❌ Review ${review._id} has ${invalidImages.length} malformed image(s):`);
                    console.log(`   Product ID: ${review.productId}`);
                    console.log(`   Status: ${review.status}`);
                    invalidImages.forEach((img, idx) => {
                        console.log(`   ${idx + 1}. ${img.substring(0, 100)}...`);
                    });
                    console.log('');
                }
            }
        }
        
        if (malformedCount === 0) {
            console.log('✅ No malformed URLs found in any reviews!\n');
        } else {
            console.log(`\n⚠️  Found ${malformedCount} reviews with malformed URLs\n`);
        }

        console.log('👋 Closing database connection...');
        await mongoose.connection.close();
        console.log('✅ Done!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

findMalformedUrls();

