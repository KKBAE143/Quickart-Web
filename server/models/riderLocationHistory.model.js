import mongoose from "mongoose";

/**
 * Rider Location History Model
 *
 * Tracks rider location updates for:
 * 1. Admin live tracking dashboard
 * 2. Customer order tracking
 * 3. Analytics and route optimization
 * 4. Dispute resolution
 */
const riderLocationHistorySchema = new mongoose.Schema({
    // Reference to the rider
    rider: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Reference to active order (if any)
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        default: null,
        index: true
    },

    // Order ID string
    orderId: {
        type: String,
        default: null
    },

    // Location coordinates
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },

    // Separate lat/lng for easy access
    latitude: {
        type: Number,
        required: true
    },

    longitude: {
        type: Number,
        required: true
    },

    // Accuracy in meters
    accuracy: {
        type: Number,
        default: null
    },

    // Speed in km/h
    speed: {
        type: Number,
        default: null
    },

    // Heading in degrees (0-360)
    heading: {
        type: Number,
        default: null
    },

    // Altitude in meters
    altitude: {
        type: Number,
        default: null
    },

    // Battery level (0-100)
    batteryLevel: {
        type: Number,
        default: null
    },

    // Activity type
    activityType: {
        type: String,
        enum: ['idle', 'moving_to_store', 'at_store', 'moving_to_customer', 'at_customer', 'returning', null],
        default: null
    },

    // Source of location
    source: {
        type: String,
        enum: ['gps', 'network', 'fused', 'manual'],
        default: 'gps'
    }
}, {
    timestamps: true
});

// 2dsphere index for geospatial queries
riderLocationHistorySchema.index({ location: '2dsphere' });

// Compound index for rider location history
riderLocationHistorySchema.index({ rider: 1, createdAt: -1 });

// TTL index to auto-delete old records (keep 7 days of history)
riderLocationHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const RiderLocationHistoryModel = mongoose.model("RiderLocationHistory", riderLocationHistorySchema);

export default RiderLocationHistoryModel;
