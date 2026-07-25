import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import CategoryModel from './models/category.model.js';
import SubCategoryModel from './models/subCategory.model.js';
import ProductModel from './models/product.model.js';

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

// Helper function to parse RTF content
function parseRTF(rtfContent) {
    try {
        // Remove RTF formatting tags
        let text = rtfContent
            .replace(/\{\\rtf.*?\\f0\\fs22\\lang9\s*/g, '')
            .replace(/\\par/g, '\n')
            .replace(/\\[a-z]+\d*/g, '')
            .replace(/[{}]/g, '')
            .trim();

        const data = {
            unit: '',
            description: '',
            shelfLife: '',
            manufacturer: ''
        };

        // Extract Unit
        const unitMatch = text.match(/Unit\s*\n\s*\n\s*(.+?)(?:\n|$)/i);
        if (unitMatch) {
            data.unit = unitMatch[1].trim();
        }

        // Extract Description
        const descMatch = text.match(/Description\s*\n\s*\n\s*(.+?)(?:Disclaimer|$)/is);
        if (descMatch) {
            data.description = descMatch[1].trim().replace(/\s+/g, ' ');
        }

        // If no description found, try to get Key Features as description
        if (!data.description) {
            const featuresMatch = text.match(/Key Features\s*\n\s*\n\s*(.+?)(?:Unit|$)/is);
            if (featuresMatch) {
                data.description = featuresMatch[1].trim().replace(/\s+/g, ' ');
            }
        }

        // Extract Shelf Life
        const shelfMatch = text.match(/Shelf Life\s*\n\s*\n\s*(.+?)(?:\n|$)/i);
        if (shelfMatch) {
            data.shelfLife = shelfMatch[1].trim();
        }

        // Extract Manufacturer
        const mfgMatch = text.match(/Manufacturer Details\s*\n\s*\n\s*(.+?)(?:\n|$)/i);
        if (mfgMatch) {
            data.manufacturer = mfgMatch[1].trim();
        }

        return data;
    } catch (error) {
        console.error('Error parsing RTF:', error);
        return {
            unit: '',
            description: '',
            shelfLife: '',
            manufacturer: ''
        };
    }
}

// Helper function to normalize category/subcategory names
function normalizeName(name) {
    const nameMapping = {
        'Breakast & Instant Food': 'Breakfast & Instant Food',
        'pan corner': 'paan corner',
        'Millet & other Flours': 'Millet & Other Flours'
    };
    
    return nameMapping[name] || name;
}

// Helper function to generate reasonable price based on unit
function generatePrice(unit) {
    const unitLower = unit.toLowerCase();
    
    // Extract numbers from unit
    const numberMatch = unit.match(/(\d+(?:\.\d+)?)/);
    const quantity = numberMatch ? parseFloat(numberMatch[1]) : 1;
    
    // Determine base price by unit type
    if (unitLower.includes('kg')) {
        return Math.round(quantity * 80); // ₹80 per kg
    } else if (unitLower.includes('g') && !unitLower.includes('kg')) {
        return Math.round((quantity / 1000) * 80); // Convert to kg equivalent
    } else if (unitLower.includes('l')) {
        return Math.round(quantity * 60); // ₹60 per liter
    } else if (unitLower.includes('ml')) {
        return Math.round((quantity / 1000) * 60); // Convert to liter equivalent
    } else if (unitLower.includes('piece') || unitLower.includes('pc') || unitLower.includes('unit')) {
        return Math.round(quantity * 30); // ₹30 per piece
    } else {
        // Default price
        return Math.round(50 + (quantity * 10));
    }
}

// Main seeding function
async function seedProducts() {
    try {
        console.log('🌱 Starting product seeding...\n');
        console.log('⚠️  WARNING: This will take a while (639 products with multiple images each!)');
        console.log('⏱️  Estimated time: 30-60 minutes depending on internet speed\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Path to products
        const productsPath = path.join(__dirname, '../client/public/Image/products_extracted/product');

        if (!fs.existsSync(productsPath)) {
            throw new Error(`Products path not found: ${productsPath}`);
        }

        // Load all categories and subcategories from database
        const categories = await CategoryModel.find();
        const subcategories = await SubCategoryModel.find().populate('category');

        console.log(`📦 Found ${categories.length} categories and ${subcategories.length} subcategories in database\n`);

        // Create lookup maps
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });

        const subcategoryMap = {};
        subcategories.forEach(sub => {
            if (!subcategoryMap[sub.name]) {
                subcategoryMap[sub.name] = [];
            }
            subcategoryMap[sub.name].push({
                id: sub._id,
                categoryIds: sub.category.map(c => c._id.toString())
            });
        });

        // Get existing products count
        const existingProductsCount = await ProductModel.countDocuments();
        console.log(`📊 Current products in database: ${existingProductsCount}\n`);

        let totalProducts = 0;
        let skippedProducts = 0;
        let createdProducts = 0;

        // Process each category folder
        const categoryFolders = fs.readdirSync(productsPath).filter(item => 
            fs.statSync(path.join(productsPath, item)).isDirectory()
        );

        for (const categoryFolder of categoryFolders) {
            const normalizedCategoryName = normalizeName(categoryFolder);
            const categoryId = categoryMap[normalizedCategoryName];

            if (!categoryId) {
                console.log(`⚠️  Warning: Category "${categoryFolder}" not found in database, skipping...`);
                continue;
            }

            console.log(`\n📁 Processing category: ${normalizedCategoryName}`);
            
            const categoryPath = path.join(productsPath, categoryFolder);
            const subcategoryFolders = fs.readdirSync(categoryPath).filter(item =>
                fs.statSync(path.join(categoryPath, item)).isDirectory()
            );

            for (const subcategoryFolder of subcategoryFolders) {
                const normalizedSubcategoryName = normalizeName(subcategoryFolder);
                const subcategoryData = subcategoryMap[normalizedSubcategoryName];

                if (!subcategoryData || subcategoryData.length === 0) {
                    console.log(`  ⚠️  Warning: Subcategory "${subcategoryFolder}" not found in database, skipping...`);
                    continue;
                }

                // Find the subcategory that belongs to this category
                const matchingSubcategory = subcategoryData.find(sub => 
                    sub.categoryIds.includes(categoryId.toString())
                );

                if (!matchingSubcategory) {
                    console.log(`  ⚠️  Warning: Subcategory "${subcategoryFolder}" doesn't belong to category "${categoryFolder}", skipping...`);
                    continue;
                }

                const subcategoryId = matchingSubcategory.id;

                console.log(`  📂 Processing subcategory: ${normalizedSubcategoryName}`);

                const subcategoryPath = path.join(categoryPath, subcategoryFolder);
                const productFolders = fs.readdirSync(subcategoryPath).filter(item =>
                    fs.statSync(path.join(subcategoryPath, item)).isDirectory()
                );

                for (const productFolder of productFolders) {
                    totalProducts++;
                    const productPath = path.join(subcategoryPath, productFolder);
                    
                    // Check if product already exists
                    const existingProduct = await ProductModel.findOne({ name: productFolder });
                    if (existingProduct) {
                        skippedProducts++;
                        console.log(`    ⏭️  [${totalProducts}] "${productFolder}" already exists, skipping...`);
                        continue;
                    }

                    console.log(`    📦 [${totalProducts}] Processing: ${productFolder}`);

                    // Read product details RTF file
                    const rtfPath = path.join(productPath, 'product details.rtf');
                    let productData = { unit: '', description: '' };

                    if (fs.existsSync(rtfPath)) {
                        const rtfContent = fs.readFileSync(rtfPath, 'utf8');
                        productData = parseRTF(rtfContent);
                    } else {
                        console.log(`       ⚠️  No product details file found, using defaults`);
                    }

                    // Get all image files
                    const imageFiles = fs.readdirSync(productPath)
                        .filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i))
                        .sort((a, b) => {
                            // Prioritize the image with product name
                            if (a.includes(productFolder)) return -1;
                            if (b.includes(productFolder)) return 1;
                            return 0;
                        });

                    if (imageFiles.length === 0) {
                        console.log(`       ⚠️  No images found, skipping product`);
                        continue;
                    }

                    // Upload images to Cloudinary (limit to 5 images to save time and space)
                    const imageUrls = [];
                    const maxImages = Math.min(imageFiles.length, 5);

                    for (let i = 0; i < maxImages; i++) {
                        const imagePath = path.join(productPath, imageFiles[i]);
                        try {
                            const uploadResult = await uploadToCloudinary(imagePath);
                            imageUrls.push(uploadResult.secure_url);
                        } catch (error) {
                            console.log(`       ⚠️  Failed to upload image ${imageFiles[i]}: ${error.message}`);
                        }
                    }

                    if (imageUrls.length === 0) {
                        console.log(`       ⚠️  No images uploaded successfully, skipping product`);
                        continue;
                    }

                    // Generate price based on unit
                    const price = generatePrice(productData.unit || '1 unit');
                    const discount = Math.floor(Math.random() * 20); // 0-20% discount

                    // Create product
                    const product = new ProductModel({
                        name: productFolder,
                        image: imageUrls,
                        category: [categoryId],
                        subCategory: [subcategoryId],
                        unit: productData.unit || '1 unit',
                        stock: Math.floor(Math.random() * 100) + 50, // Random stock 50-150
                        price: price,
                        discount: discount,
                        description: productData.description || `High quality ${productFolder}`,
                        more_details: {
                            shelfLife: productData.shelfLife,
                            manufacturer: productData.manufacturer
                        },
                        publish: true
                    });

                    await product.save();
                    createdProducts++;

                    console.log(`       ✅ Created (${imageUrls.length} images, ₹${price}, ${discount}% off)`);
                }
            }
        }

        const finalCount = await ProductModel.countDocuments();

        console.log(`\n\n🎉 Product seeding completed!`);
        console.log(`   Total products processed: ${totalProducts}`);
        console.log(`   Products created: ${createdProducts}`);
        console.log(`   Products skipped (already exist): ${skippedProducts}`);
        console.log(`   Final database count: ${finalCount}\n`);

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    }
}

// Run the seeding
seedProducts()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    });

