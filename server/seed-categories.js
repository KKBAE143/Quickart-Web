import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import CategoryModel from './models/category.model.js';
import SubCategoryModel from './models/subCategory.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLODINARY_CLOUD_NAME,
    api_key: process.env.CLODINARY_API_KEY,
    api_secret: process.env.CLODINARY_API_SECRET_KEY
});

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: "quickart" },
                (error, uploadResult) => {
                    if (error) {
                        console.error('❌ Cloudinary upload error:', error);
                        return reject(error);
                    }
                    if (!uploadResult) {
                        return reject(new Error('Cloudinary returned no result'));
                    }
                    return resolve(uploadResult);
                }
            ).end(imageBuffer);
        });
    } catch (error) {
        console.error('❌ Error reading or uploading image:', error);
        throw error;
    }
}

// Helper function to normalize category name from folder name
function normalizeCategoryName(folderName) {
    // Map folder names to actual category names
    // This is needed because some folder names don't exactly match the category image names
    const nameMapping = {
        'Bakery  Biscuits': 'Bakery & Biscuits', // Folder has 2 spaces, category has & symbol
        'Tea, Coffee & Health Drink': 'Tea, Coffe & Health Drink' // Folder has correct spelling, category has typo "Coffe"
    };
    
    return nameMapping[folderName] || folderName;
}

// Main seeding function
async function seedCategories() {
    try {
        console.log('🌱 Starting category and subcategory seeding...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Paths
        const categoryPath = path.join(__dirname, '../client/public/Image/category');
        const subCategoryPath = path.join(__dirname, '../client/public/Image/sub category');

        // Check if paths exist
        if (!fs.existsSync(categoryPath)) {
            throw new Error(`Category path not found: ${categoryPath}`);
        }
        if (!fs.existsSync(subCategoryPath)) {
            throw new Error(`Subcategory path not found: ${subCategoryPath}`);
        }

        // Clear existing data (optional - comment out if you want to keep existing data)
        const existingCategories = await CategoryModel.countDocuments();
        const existingSubCategories = await SubCategoryModel.countDocuments();
        
        if (existingCategories > 0 || existingSubCategories > 0) {
            console.log(`⚠️  Found ${existingCategories} categories and ${existingSubCategories} subcategories in database.`);
            console.log('   Skipping deletion to preserve existing data.\n');
            console.log('   If you want to start fresh, delete them manually from the admin panel or uncomment the delete code in the script.\n');
            // await CategoryModel.deleteMany({});
            // await SubCategoryModel.deleteMany({});
            // console.log('✅ Cleared existing categories and subcategories\n');
        }

        // Step 1: Process Categories
        console.log('📁 Processing Categories...\n');
        const categoryFiles = fs.readdirSync(categoryPath)
            .filter(file => file.endsWith('.png'));

        const categoryMap = {}; // To store category name to ID mapping

        for (const file of categoryFiles) {
            const categoryName = file.replace('.png', '');
            const imagePath = path.join(categoryPath, file);

            console.log(`  Processing: ${categoryName}`);

            // Check if category already exists
            let existingCategory = await CategoryModel.findOne({ name: categoryName });
            
            if (existingCategory) {
                console.log(`  ⏭️  Category "${categoryName}" already exists, skipping...`);
                categoryMap[categoryName] = existingCategory._id;
                continue;
            }

            // Upload to Cloudinary
            console.log(`  📤 Uploading image to Cloudinary...`);
            const uploadResult = await uploadToCloudinary(imagePath);

            // Create category in database
            const category = new CategoryModel({
                name: categoryName,
                image: uploadResult.secure_url
            });

            const savedCategory = await category.save();
            categoryMap[categoryName] = savedCategory._id;

            console.log(`  ✅ Created category: ${categoryName}`);
            console.log(`     Image URL: ${uploadResult.secure_url}`);
            console.log(`     ID: ${savedCategory._id}\n`);
        }

        console.log(`✅ Completed processing ${Object.keys(categoryMap).length} categories\n`);

        // Step 2: Process Subcategories
        console.log('📂 Processing Subcategories...\n');
        const subCategoryFolders = fs.readdirSync(subCategoryPath)
            .filter(item => fs.statSync(path.join(subCategoryPath, item)).isDirectory());

        let totalSubCategories = 0;

        for (const folder of subCategoryFolders) {
            const normalizedFolderName = normalizeCategoryName(folder);
            const categoryId = categoryMap[normalizedFolderName];

            if (!categoryId) {
                console.log(`  ⚠️  Warning: No matching category found for folder "${folder}"`);
                console.log(`     Normalized name: "${normalizedFolderName}"`);
                console.log(`     Available categories: ${Object.keys(categoryMap).join(', ')}`);
                console.log(`     Skipping this folder...\n`);
                continue;
            }

            console.log(`  📁 Processing subcategories for: ${normalizedFolderName}`);
            
            const subCategoryFolder = path.join(subCategoryPath, folder);
            const subCategoryFiles = fs.readdirSync(subCategoryFolder)
                .filter(file => file.match(/\.(png|jpg|webp)$/i));

            for (const file of subCategoryFiles) {
                const subCategoryName = file.replace(/\.(png|jpg|webp)$/i, '');
                const imagePath = path.join(subCategoryFolder, file);

                console.log(`    - ${subCategoryName}`);

                // Check if subcategory already exists
                const existingSubCategory = await SubCategoryModel.findOne({ 
                    name: subCategoryName,
                    category: categoryId
                });

                if (existingSubCategory) {
                    console.log(`      ⏭️  Already exists, skipping...`);
                    continue;
                }

                // Upload to Cloudinary
                const uploadResult = await uploadToCloudinary(imagePath);

                // Create subcategory in database
                const subCategory = new SubCategoryModel({
                    name: subCategoryName,
                    image: uploadResult.secure_url,
                    category: [categoryId]
                });

                await subCategory.save();
                totalSubCategories++;

                console.log(`      ✅ Created with image: ${uploadResult.secure_url.substring(0, 50)}...`);
            }

            console.log('');
        }

        console.log(`\n🎉 Seeding completed successfully!`);
        console.log(`   Categories: ${Object.keys(categoryMap).length}`);
        console.log(`   Subcategories: ${totalSubCategories}\n`);

        // Show summary
        const finalCategoryCount = await CategoryModel.countDocuments();
        const finalSubCategoryCount = await SubCategoryModel.countDocuments();
        
        console.log(`📊 Final Database Counts:`);
        console.log(`   Total Categories: ${finalCategoryCount}`);
        console.log(`   Total Subcategories: ${finalSubCategoryCount}`);

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ MongoDB connection closed');
    }
}

// Run the seeding
seedCategories()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    });

