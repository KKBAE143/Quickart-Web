/**
 * Migration Script: Update Address Schema for Geospatial Support
 *
 * This script:
 * 1. Creates the 2dsphere index for geospatial queries
 * 2. Updates existing addresses to have proper GeoJSON location format
 *
 * Run this script once after deploying the new address model:
 * node server/migrations/migrate-addresses-geospatial.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Address schema (simplified for migration)
const addressSchema = new mongoose.Schema({
    address_line: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    mobile: Number,
    address_type: String,
    status: Boolean,
    userId: mongoose.Schema.ObjectId,

    // New location fields
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    latitude: Number,
    longitude: Number,
    plusCode: String,
    locationAccuracy: Number,
    locationMethod: String,
    locationConfidence: String,
    confidenceScore: Number,
    userVerified: Boolean,
    landmark: String,
    flatNo: String,
    floor: String,
    deliveryInstructions: String,
    gateCode: String,
    lastValidated: Date,
    successfulDeliveries: Number
}, { timestamps: true });

// Run migration
const runMigration = async () => {
    await connectDB();

    const Address = mongoose.model('address', addressSchema);

    console.log('\n📊 Starting address migration for geospatial support...\n');

    try {
        // Step 1: Get current indexes
        console.log('📋 Checking existing indexes...');
        const indexes = await Address.collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name).join(', '));

        // Step 2: Create 2dsphere index if it doesn't exist
        const hasGeoIndex = indexes.some(i => i.name === 'location_2dsphere');
        if (!hasGeoIndex) {
            console.log('\n🔧 Creating 2dsphere geospatial index...');
            await Address.collection.createIndex({ location: '2dsphere' });
            console.log('✅ Geospatial index created successfully');
        } else {
            console.log('✅ Geospatial index already exists');
        }

        // Step 3: Create other indexes
        console.log('\n🔧 Creating additional indexes...');

        const hasUserIndex = indexes.some(i => i.name === 'userId_1_status_1');
        if (!hasUserIndex) {
            await Address.collection.createIndex({ userId: 1, status: 1 });
            console.log('✅ userId_status index created');
        }

        const hasPlusCodeIndex = indexes.some(i => i.name === 'plusCode_1');
        if (!hasPlusCodeIndex) {
            await Address.collection.createIndex({ plusCode: 1 });
            console.log('✅ plusCode index created');
        }

        // Step 4: Count addresses that need migration
        const totalAddresses = await Address.countDocuments();
        const addressesWithoutLocation = await Address.countDocuments({
            $or: [
                { location: { $exists: false } },
                { 'location.coordinates': [0, 0] },
                { 'location.coordinates.0': 0, 'location.coordinates.1': 0 }
            ]
        });

        console.log(`\n📊 Address Statistics:`);
        console.log(`   Total addresses: ${totalAddresses}`);
        console.log(`   Without location: ${addressesWithoutLocation}`);
        console.log(`   With location: ${totalAddresses - addressesWithoutLocation}`);

        // Step 5: Add default fields to addresses missing new fields
        console.log('\n🔧 Updating addresses with default values for new fields...');

        const updateResult = await Address.updateMany(
            {
                $or: [
                    { locationMethod: { $exists: false } },
                    { locationConfidence: { $exists: false } },
                    { userVerified: { $exists: false } }
                ]
            },
            {
                $set: {
                    locationMethod: null,
                    locationConfidence: null,
                    confidenceScore: null,
                    userVerified: false,
                    landmark: '',
                    flatNo: '',
                    floor: '',
                    deliveryInstructions: '',
                    gateCode: '',
                    lastValidated: null,
                    successfulDeliveries: 0
                }
            }
        );

        console.log(`✅ Updated ${updateResult.modifiedCount} addresses with default values`);

        // Step 6: Sync location field with lat/lng where available
        console.log('\n🔧 Syncing location GeoJSON with lat/lng fields...');

        const addressesWithLatLng = await Address.find({
            latitude: { $exists: true, $ne: null },
            longitude: { $exists: true, $ne: null },
            $or: [
                { location: { $exists: false } },
                { 'location.coordinates': [0, 0] }
            ]
        });

        let syncedCount = 0;
        for (const addr of addressesWithLatLng) {
            await Address.updateOne(
                { _id: addr._id },
                {
                    $set: {
                        location: {
                            type: 'Point',
                            coordinates: [addr.longitude, addr.latitude]
                        }
                    }
                }
            );
            syncedCount++;
        }

        console.log(`✅ Synced ${syncedCount} addresses with GeoJSON format`);

        // Step 7: Final statistics
        const finalIndexes = await Address.collection.indexes();
        console.log('\n📋 Final indexes:', finalIndexes.map(i => i.name).join(', '));

        console.log('\n✅ Migration completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Migration error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
};

// Run the migration
runMigration();
