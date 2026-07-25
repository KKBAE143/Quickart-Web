import mongoose from "mongoose";

/**
 * Store Location Model
 *
 * Stores the store/warehouse locations for pickup
 * Riders will see the exact store location on Google Maps
 */
const storeLocationSchema = new mongoose.Schema({
    // Store name
    name: {
        type: String,
        required: true
    },

    // Store code/ID
    storeCode: {
        type: String,
        required: true,
        unique: true
    },

    // Full address
    address: {
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },

    // GeoJSON location for geospatial queries
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

    // Contact information
    phone: {
        type: String,
        default: ""
    },

    // Store manager name
    managerName: {
        type: String,
        default: ""
    },

    // Operating hours
    operatingHours: {
        open: { type: String, default: "06:00" },
        close: { type: String, default: "23:00" }
    },

    // Delivery radius in km
    deliveryRadius: {
        type: Number,
        default: 5
    },

    // Is store active
    isActive: {
        type: Boolean,
        default: true
    },

    // Google Maps Place ID (for accurate navigation)
    googlePlaceId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// 2dsphere index for geospatial queries
storeLocationSchema.index({ location: '2dsphere' });
storeLocationSchema.index({ storeCode: 1 });
storeLocationSchema.index({ isActive: 1 });

// Static method to find nearest store
storeLocationSchema.statics.findNearestStore = function(lat, lng, maxDistance = 10000) {
    return this.findOne({
        isActive: true,
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: maxDistance
            }
        }
    });
};

// Static method to find stores within radius
storeLocationSchema.statics.findStoresWithinRadius = function(lat, lng, radiusKm = 5) {
    return this.find({
        isActive: true,
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radiusKm / 6378.1] // Earth radius in km
            }
        }
    });
};

const StoreLocationModel = mongoose.model("StoreLocation", storeLocationSchema);

export default StoreLocationModel;
