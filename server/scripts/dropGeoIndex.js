import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server folder
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function dropGeoIndex() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('deliveryagents');

        // Get all indexes
        const indexes = await collection.indexes();
        console.log('\nCurrent indexes:', JSON.stringify(indexes, null, 2));

        // Drop all geospatial indexes
        for (const index of indexes) {
            if (index.name && index.name.includes('2dsphere')) {
                console.log(`\nDropping index: ${index.name}`);
                await collection.dropIndex(index.name);
                console.log(`✅ Dropped: ${index.name}`);
            }
        }

        // Also try dropping by field name
        try {
            await collection.dropIndex('operationalZone.center_2dsphere');
            console.log('✅ Dropped: operationalZone.center_2dsphere');
        } catch (err) {
            if (err.code !== 27) { // Index not found
                console.log('Info: No operationalZone.center_2dsphere index found (already dropped)');
            }
        }

        try {
            await collection.dropIndex('operationalZone_2dsphere');
            console.log('✅ Dropped: operationalZone_2dsphere');
        } catch (err) {
            if (err.code !== 27) {
                console.log('Info: No operationalZone_2dsphere index found (already dropped)');
            }
        }

        console.log('\n✅ All geospatial indexes removed successfully!');
        console.log('You can now restart your server.');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

dropGeoIndex();

