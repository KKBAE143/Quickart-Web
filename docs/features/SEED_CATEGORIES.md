# Category and Subcategory Seed Script

This document explains how to automatically populate your database with categories and subcategories from the images in `client/public/Image`.

## Overview

The seed script (`server/seed-categories.js`) will:
1. ✅ Read all category images from `client/public/Image/category/` (20 categories)
2. ✅ Upload them to Cloudinary
3. ✅ Create category entries in MongoDB
4. ✅ Read all subcategory images from `client/public/Image/sub category/` (221 subcategories)
5. ✅ Upload them to Cloudinary
6. ✅ Create subcategory entries with proper category relationships

## Prerequisites

Before running the seed script, ensure:

1. **MongoDB is running** and connected (check your `MONGODB_URI` in `server/.env`)
2. **Cloudinary is configured** with valid credentials in `server/.env`:
   - `CLODINARY_CLOUD_NAME`
   - `CLODINARY_API_KEY`
   - `CLODINARY_API_SECRET_KEY`
3. **Image folders exist** at:
   - `client/public/Image/category/` (20 PNG files)
   - `client/public/Image/sub category/` (organized in folders by category)

## How to Run

### Option 1: Using npm script (Recommended)

```bash
cd server
npm run seed
```

### Option 2: Direct execution

```bash
cd server
node seed-categories.js
```

## What to Expect

The script will output detailed progress information:

```
🌱 Starting category and subcategory seeding...

✅ Connected to MongoDB

📁 Processing Categories...

  Processing: Atta, Rice & Dal
  📤 Uploading image to Cloudinary...
  ✅ Created category: Atta, Rice & Dal
     Image URL: https://res.cloudinary.com/...
     ID: 507f1f77bcf86cd799439011

  ... (continues for all categories)

✅ Completed processing 20 categories

📂 Processing Subcategories...

  📁 Processing subcategories for: Atta, Rice & Dal
    - Atta
      ✅ Created with image: https://res.cloudinary.com/...
    - Rice
      ✅ Created with image: https://res.cloudinary.com/...
    ... (continues for all subcategories)

🎉 Seeding completed successfully!
   Categories: 20
   Subcategories: 221

📊 Final Database Counts:
   Total Categories: 20
   Total Subcategories: 221

✅ MongoDB connection closed

✨ All done!
```

## Important Notes

### Duplicate Prevention
- The script checks for existing categories and subcategories before creating new ones
- If a category or subcategory already exists, it will be skipped
- This allows you to run the script multiple times safely

### Data Preservation
- By default, the script **does NOT delete** existing categories/subcategories
- If you want to start fresh, you can either:
  - Delete entries manually from the admin panel
  - Uncomment the deletion code in the script (lines marked with comments)

### Category Name Mappings
The script handles naming differences between folders and category names:
- Folder: "Bakery  Biscuits" → Category: "Bakery & Biscuits"
- Folder: "Tea, Coffee & Health Drink" → Category: "Tea, Coffe & Health Drink"

## Categories and Subcategories Overview

### Categories (20 total)
1. Atta, Rice & Dal
2. Baby Care
3. Bakery & Biscuits
4. Breakfast & Instant Food
5. Chicken, Meat & Fish
6. Cleaning Essentials
7. Cold Drinks & Juices
8. Dairy, Bread & Eggs
9. Fruits & Vegetables
10. Home & Office
11. Masala, Oil & More
12. Organic & Healthy Living
13. paan corner
14. Personal Care
15. Pet Care
16. Pharma & Wellness
17. Sauces & Spreads
18. Snacks & Munchies
19. Sweet Tooth
20. Tea, Coffe & Health Drink

### Subcategories by Category

#### Atta, Rice & Dal (8 subcategories)
- Atta, Besan, Sooji & Maida, Millet & Other Flours, Moong & Masoor, Poha, Daliya & Other Grains, Rajma, Chhole & Others, Rice, Toor, Urad & Chana

#### Baby Care (13 subcategories)
- Baby Accessories & Apparel, Baby Food, Baby Gifting & Toys, Baby Wipes, Bathing Needs, Dispers & More, Feeding, Health & Safety, Hygiene, Mom Care Needs, Nursing, Oral & Nasal Care, Skin & Hair Care

#### Bakery & Biscuits (8 subcategories)
- Bread & Pav, Cakes & Rolls, Cookies, Cream Biscuits, Glucose & Marie, Healthy & Digestive, Rusks & Wafers, Sweet & Salty

#### Breakfast & Instant Food (8 subcategories)
- Dessert & Cake Mixes, Herbs & Seasoning, Imported Noodles & Pasta, Instant Mixes, Noodles, Pasta, Ready to Cook & Eat, Soup

... and many more!

## Troubleshooting

### "Cloudinary credentials not configured"
- Check your `server/.env` file
- Ensure all Cloudinary variables are set correctly
- Run `node test-cloudinary.js` to test your Cloudinary connection

### "MongoDB connection failed"
- Check your `MONGODB_URI` in `server/.env`
- Ensure MongoDB is running
- Run `node test-mongodb.js` to test your MongoDB connection

### "No matching category found for folder"
- This means a subcategory folder doesn't match any category name
- Check the console output for the specific folder name
- The script will skip that folder and continue

### Images not appearing in admin panel
- Verify the Cloudinary URLs in the database
- Check that images were uploaded successfully (look for ✅ in the console output)
- Clear your browser cache and refresh

## After Seeding

Once seeding is complete:

1. **Verify in Admin Panel**: Go to your admin panel and check that all categories and subcategories appear
2. **Check Images**: Make sure images are displaying correctly
3. **Add Products**: You can now start adding products and assigning them to these categories/subcategories

## Time Estimate

- The seeding process typically takes **5-10 minutes** depending on your internet connection
- Each image needs to be uploaded to Cloudinary, which can take a few seconds
- Total: ~20 categories + ~221 subcategories = ~241 uploads

## Need Help?

If you encounter any issues:
1. Check the console output for error messages
2. Verify your `.env` configuration
3. Test your connections using the test scripts
4. Check that image files exist in the correct folders

