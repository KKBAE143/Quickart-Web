# Product Seed Script

This document explains how to automatically populate your database with products from the extracted product images and data.

## Overview

The product seed script (`server/seed-products.js`) will:
1. ✅ Read all product folders from `client/public/Image/products_extracted/product/`
2. ✅ Parse product details from RTF files (unit, description, etc.)
3. ✅ Upload product images to Cloudinary (up to 5 images per product)
4. ✅ Match products to their categories and subcategories
5. ✅ Generate reasonable prices based on product units
6. ✅ Create product entries in MongoDB with all data

## Prerequisites

Before running the seed script, ensure:

1. **Categories and subcategories are already seeded** (run `npm run seed` first)
2. **MongoDB is running** and connected
3. **Cloudinary is configured** with valid credentials
4. **Product zip is extracted** to `client/public/Image/products_extracted/`

## Product Data

### Total Products: **639**

Products are organized by:
- **Category** (19 folders)
- **Subcategory** (within each category)
- **Product Name** (individual product folders)

Each product folder contains:
- **Images**: Multiple product images (JPG format)
- **product details.rtf**: Product information (unit, description, manufacturer, etc.)

### What Gets Seeded

For each product, the script creates:
- **Name**: Product folder name
- **Images**: Up to 5 product images (uploaded to Cloudinary)
- **Category**: Parent category ID
- **Subcategory**: Parent subcategory ID
- **Unit**: Extracted from RTF file (e.g., "5 kg", "1 l", "500 g")
- **Description**: Extracted from RTF file
- **Price**: Auto-generated based on unit (₹)
- **Discount**: Random 0-20% discount
- **Stock**: Random stock 50-150 units
- **Additional Details**: Shelf life, manufacturer info

### Price Generation Logic

The script intelligently generates prices based on units:
- **Per kg**: ₹80/kg (e.g., 5 kg = ₹400)
- **Per gram**: Converted to kg equivalent
- **Per liter**: ₹60/L (e.g., 2 l = ₹120)
- **Per ml**: Converted to liter equivalent
- **Per piece/unit**: ₹30/piece (e.g., 6 pieces = ₹180)
- **Default**: ₹50 + (quantity × 10)

**Note**: You can manually adjust prices later in the admin panel if needed.

## How to Run

### Option 1: Seed products only (Recommended if categories already exist)

```bash
cd server
npm run seed:products
```

### Option 2: Seed everything (categories + products)

```bash
cd server
npm run seed:all
```

This will run categories first, then products.

## What to Expect

The script will output detailed progress information:

```
🌱 Starting product seeding...

⚠️  WARNING: This will take a while (639 products with multiple images each!)
⏱️  Estimated time: 30-60 minutes depending on internet speed

✅ Connected to MongoDB

📦 Found 20 categories and 221 subcategories in database

📊 Current products in database: 0

📁 Processing category: Atta, Rice & Dal
  📂 Processing subcategory: Atta
    📦 [1] Processing: Aashirvaad Superior MP Whole Wheat Atta
       ✅ Created (5 images, ₹400, 15% off)
    📦 [2] Processing: Fortune Chakki Fresh Atta
       ✅ Created (4 images, ₹200, 8% off)
    ... (continues for all products)

🎉 Product seeding completed!
   Total products processed: 639
   Products created: 639
   Products skipped (already exist): 0
   Final database count: 639

✅ MongoDB connection closed

✨ All done!
```

## Time Estimate

**⏱️ Expected Duration: 30-60 minutes**

The seeding process takes time because:
- Each product has multiple images to upload
- Total: ~639 products × ~4 images = ~2,500 images to upload to Cloudinary
- Network speed affects upload time
- RTF parsing and database operations

**Tip**: Run this overnight or during a break. The script is safe to interrupt and resume (it skips existing products).

## Important Notes

### Duplicate Prevention
- The script checks for existing products by name before creating
- If a product already exists, it will be skipped
- Safe to run multiple times

### Image Limits
- **Up to 5 images per product** (to save time and Cloudinary storage)
- Priority given to the main product image (named after the product)
- Additional images are uploaded in order

### Category/Subcategory Matching
- Products are automatically matched to their categories and subcategories
- If a category or subcategory doesn't exist in the database, that product is skipped
- Always run category seeding first!

### Generated Data
Since the RTF files don't contain price/stock information:
- **Prices**: Auto-generated using smart logic based on units
- **Stock**: Random between 50-150 units
- **Discount**: Random between 0-20%

**You can manually adjust these in the admin panel after seeding!**

## Troubleshooting

### "Categories/subcategories not found in database"
- Run category seeding first: `npm run seed`
- Verify categories exist in admin panel

### "Products path not found"
- Make sure you extracted `product.zip`
- Path should be: `client/public/Image/products_extracted/product/`

### "Cloudinary upload failed"
- Check Cloudinary credentials in `server/.env`
- Verify Cloudinary account has enough storage
- Check internet connection

### Script is taking too long
- This is normal! 639 products with ~2,500 images takes time
- You can interrupt (Ctrl+C) and resume later (it skips existing products)
- Consider running overnight

### Images not appearing in admin panel
- Verify Cloudinary URLs in the database
- Check that images were uploaded successfully (look for ✅ in console)
- Clear browser cache

## After Seeding

Once seeding is complete:

1. **Verify in Admin Panel**:
   - Go to Product section
   - Check that products appear with images
   - Verify categories and subcategories are correct

2. **Adjust Prices (Optional)**:
   - Review auto-generated prices
   - Adjust as needed for your market
   - Set competitive discounts

3. **Update Stock (Optional)**:
   - Set realistic stock levels
   - Enable/disable stock tracking as needed

4. **Publish/Unpublish**:
   - All products are published by default
   - Unpublish products you don't want to sell yet

## Sample Products by Category

### Atta, Rice & Dal
- Aashirvaad Superior MP Whole Wheat Atta (5 kg)
- Fortune Chakki Fresh Atta
- Pro Nature Whole Wheat Organic Atta

### Bakery & Biscuits
- Various biscuits, cookies, bread, and baked goods

### Baby Care
- Baby food, diapers, wipes, care products

### ...and many more across all 19 categories!

## Database Schema

Each product contains:
```javascript
{
  name: "Product Name",
  image: ["url1", "url2", "url3"],  // Up to 5 images
  category: [ObjectId],              // Category reference
  subCategory: [ObjectId],           // Subcategory reference
  unit: "5 kg",                      // Product unit
  stock: 120,                        // Stock quantity
  price: 400,                        // Price in ₹
  discount: 15,                      // Discount percentage
  description: "Product description...",
  more_details: {
    shelfLife: "3 months",
    manufacturer: "Company Name"
  },
  publish: true                      // Published status
}
```

## Performance Tips

1. **Good Internet Connection**: Upload speed matters for image uploads
2. **Close Unnecessary Apps**: Free up bandwidth
3. **Run During Off-Hours**: Less network congestion
4. **Monitor Progress**: Watch console output for any errors
5. **Don't Interrupt Mid-Product**: Let each product complete

## Need Help?

If you encounter issues:
1. Check MongoDB connection: `node test-mongodb.js`
2. Check Cloudinary connection: `node test-cloudinary.js`
3. Verify categories exist: Run `npm run seed` first
4. Check console output for specific error messages
5. Ensure product zip is extracted correctly

## Manual Alternative

If you prefer not to use the seed script:
1. Go to admin panel → Upload Product
2. Fill in product details manually
3. Upload images manually
4. Assign categories and subcategories
5. Set price, stock, and discount

**Time estimate for manual entry**: ~10-15 minutes per product × 639 products = ~160 hours! 
**Seed script saves you days of work!** 🎉

---

**Ready to seed? Run:**
```bash
cd server
npm run seed:products
```

**Or seed everything at once:**
```bash
cd server
npm run seed:all
```

Let the script run and come back in 30-60 minutes to a fully stocked store! ☕

