/**
 * Clean Review Images Script
 * 
 * This script scans all reviews in the database and removes any malformed
 * or invalid image URLs that could cause "URI malformed" errors.
 * 
 * Run with: node server/scripts/cleanReviewImages.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ReviewModel from '../models/review.model.js';
import ProductModel from '../models/product.model.js';

dotenv.config();

// Validate image URL
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url === 'null' || url === 'undefined' || url === '') return false;
    
    // Check if URL contains only valid characters (no control characters)
    if (/[\x00-\x1F\x7F]/.test(url)) return false;
    
    try {
        // Try to decode the URL first
        const decoded = decodeURI(url);
        // Check if it's a valid URL format
        const urlObj = new URL(decoded);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        // If decoding fails, try with original URL
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
};

const cleanReviewImages = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔍 Scanning reviews for malformed image URLs...');
        
        const reviews = await ReviewModel.find({});
        let totalReviews = 0;
        let reviewsWithImages = 0;
        let reviewsCleaned = 0;
        let imagesRemoved = 0;

        for (const review of reviews) {
            totalReviews++;
            
            if (review.images && review.images.length > 0) {
                reviewsWithImages++;
                const originalImageCount = review.images.length;
                
                // Filter out invalid images
                const validImages = review.images.filter(isValidImageUrl);
                
                if (validImages.length !== originalImageCount) {
                    const removedCount = originalImageCount - validImages.length;
                    imagesRemoved += removedCount;
                    reviewsCleaned++;
                    
                    console.log(`\n📸 Review ${review._id}:`);
                    console.log(`   - Original images: ${originalImageCount}`);
                    console.log(`   - Valid images: ${validImages.length}`);
                    console.log(`   - Removed: ${removedCount} malformed URLs`);
                    
                    // Show removed URLs
                    const removedUrls = review.images.filter(url => !validImages.includes(url));
                    removedUrls.forEach(url => {
                        console.log(`   ❌ Removed: ${url.substring(0, 80)}...`);
                    });
                    
                    // Update review with cleaned images
                    review.images = validImages;
                    await review.save();
                }
            }
        }

        console.log('\n📊 Cleanup Summary:');
        console.log(`   Total reviews scanned: ${totalReviews}`);
        console.log(`   Reviews with images: ${reviewsWithImages}`);
        console.log(`   Reviews cleaned: ${reviewsCleaned}`);
        console.log(`   Malformed images removed: ${imagesRemoved}`);

        if (reviewsCleaned === 0) {
            console.log('\n✅ All review images are valid! No cleanup needed.');
        } else {
            console.log('\n✅ Cleanup complete! All malformed URLs removed.');
            console.log('\n⚠️  Note: Product review statistics were not affected.');
        }

        console.log('\n👋 Closing database connection...');
        await mongoose.connection.close();
        console.log('✅ Done!');
        
    } catch (error) {
        console.error('❌ Error cleaning review images:', error);
        process.exit(1);
    }
};

// Run the script
cleanReviewImages();

