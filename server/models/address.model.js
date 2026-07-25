import mongoose from "mongoose";

/**
 * Address Model - Production-Grade with Geospatial Support
 *
 * Key Features:
 * 1. Stores exact coordinates (lat/lng) for precise delivery
 * 2. MongoDB 2dsphere geospatial index for distance queries
 * 3. Plus Code for building-level precision
 * 4. Location confidence tracking
 * 5. Accuracy metrics for quality assurance
 */

const addressSchema = new mongoose.Schema({
    // Basic address fields
    address_line: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    pincode: {
        type: String
    },
    country: {
        type: String,
        default: "India"
    },
    mobile: {
        type: Number,
        default: null
    },
    address_type: {
        type: String,
        enum: ['HOME', 'WORK', 'HOTEL', 'OTHER'],
        default: 'HOME'
    },

    // ============================================================================
    // GEOLOCATION FIELDS - Critical for accurate delivery
    // ============================================================================

    // GeoJSON format for MongoDB geospatial queries
    // This enables $near, $geoWithin queries for finding nearby addresses/stores
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],  // [longitude, latitude] - GeoJSON format
            default: [0, 0]
        }
    },

    // Separate lat/lng for easy access (redundant but convenient)
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },

    // Plus Code (Open Location Code) - Building-level precision
    // Example: "7JVW52GH+XR" represents a ~3m x 3m area
    // Used by Google Maps, Uber, and delivery apps in India
    plusCode: {
        type: String,
        default: null
    },

    // ============================================================================
    // ACCURACY & CONFIDENCE TRACKING
    // ============================================================================

    // Accuracy in meters at time of saving
    // Lower = better (GPS typically 10-50m, WiFi 100-200m, IP ~5000m)
    locationAccuracy: {
        type: Number,
        default: null
    },

    // How the location was detected
    locationMethod: {
        type: String,
        enum: ['gps', 'gps_refined', 'wifi', 'cell', 'ip', 'manual', 'plus_code', 'fused', null],
        default: null
    },

    // Confidence level in the location
    locationConfidence: {
        type: String,
        enum: ['verified', 'high', 'medium', 'low', 'approximate', null],
        default: null
    },

    // Confidence score (0-100)
    confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },

    // Whether user manually verified/adjusted the pin
    userVerified: {
        type: Boolean,
        default: false
    },

    // ============================================================================
    // DELIVERY OPTIMIZATION FIELDS
    // ============================================================================

    // Landmark for delivery navigation
    landmark: {
        type: String,
        default: ""
    },

    // Flat/building details
    flatNo: {
        type: String,
        default: ""
    },

    // Floor number
    floor: {
        type: String,
        default: ""
    },

    // Delivery instructions
    deliveryInstructions: {
        type: String,
        default: ""
    },

    // Gate/entrance code if applicable
    gateCode: {
        type: String,
        default: ""
    },

    // ============================================================================
    // METADATA
    // ============================================================================

    status: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    // Last time location was validated
    lastValidated: {
        type: Date,
        default: null
    },

    // Number of successful deliveries to this address
    successfulDeliveries: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// ============================================================================
// INDEXES
// ============================================================================

// 2dsphere index for geospatial queries (find nearby, calculate distance)
// This is what enables: "Find all addresses within 5km of store"
addressSchema.index({ location: '2dsphere' });

// Compound index for user queries
addressSchema.index({ userId: 1, status: 1 });

// Index for Plus Code lookups
addressSchema.index({ plusCode: 1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

// Format coordinates for display
addressSchema.virtual('coordinatesDisplay').get(function() {
    if (this.latitude && this.longitude) {
        return `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`;
    }
    return null;
});

// Check if location is accurate enough for delivery
addressSchema.virtual('isDeliverable').get(function() {
    // Require at least city-level accuracy for delivery
    if (!this.latitude || !this.longitude) return false;
    if (this.locationAccuracy && this.locationAccuracy > 5000) return false;
    return true;
});

// ============================================================================
// METHODS
// ============================================================================

// Calculate distance to another point (in meters)
addressSchema.methods.distanceTo = function(lat, lng) {
    if (!this.latitude || !this.longitude) return null;

    const R = 6371e3; // Earth radius in meters
    const φ1 = this.latitude * Math.PI / 180;
    const φ2 = lat * Math.PI / 180;
    const Δφ = (lat - this.latitude) * Math.PI / 180;
    const Δλ = (lng - this.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

// Mark as user verified
addressSchema.methods.markVerified = function() {
    this.userVerified = true;
    this.locationConfidence = 'verified';
    this.lastValidated = new Date();
    return this.save();
};

// Update location with new coordinates
addressSchema.methods.updateLocation = function(lat, lng, accuracy, method) {
    this.latitude = lat;
    this.longitude = lng;
    this.location = {
        type: 'Point',
        coordinates: [lng, lat]  // GeoJSON uses [lng, lat]
    };
    this.locationAccuracy = accuracy;
    this.locationMethod = method;

    // Calculate confidence based on accuracy
    if (accuracy <= 50) {
        this.locationConfidence = 'high';
        this.confidenceScore = 90;
    } else if (accuracy <= 200) {
        this.locationConfidence = 'medium';
        this.confidenceScore = 70;
    } else if (accuracy <= 1000) {
        this.locationConfidence = 'low';
        this.confidenceScore = 40;
    } else {
        this.locationConfidence = 'approximate';
        this.confidenceScore = 20;
    }

    return this.save();
};

// ============================================================================
// STATICS (Class methods)
// ============================================================================

// Find addresses near a point (for store assignment)
addressSchema.statics.findNearby = function(lat, lng, maxDistanceMeters = 5000) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: maxDistanceMeters
            }
        },
        status: true
    });
};

// Find all addresses for a user with location data
addressSchema.statics.findByUserWithLocation = function(userId) {
    return this.find({
        userId: userId,
        status: true,
        latitude: { $ne: null },
        longitude: { $ne: null }
    }).sort({ updatedAt: -1 });
};

// Calculate delivery distance from store
addressSchema.statics.calculateDeliveryDistance = async function(addressId, storeLat, storeLng) {
    const address = await this.findById(addressId);
    if (!address || !address.latitude || !address.longitude) {
        return null;
    }
    return address.distanceTo(storeLat, storeLng);
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

addressSchema.pre('save', function(next) {
    // Sync location field with lat/lng if they're set but location isn't
    if (this.latitude && this.longitude) {
        if (!this.location || !this.location.coordinates ||
            this.location.coordinates[0] === 0 && this.location.coordinates[1] === 0) {
            this.location = {
                type: 'Point',
                coordinates: [this.longitude, this.latitude]
            };
        }
    }

    // Sync lat/lng with location if location is set but lat/lng aren't
    if (this.location && this.location.coordinates &&
        this.location.coordinates[0] !== 0 && this.location.coordinates[1] !== 0) {
        if (!this.latitude || !this.longitude) {
            this.longitude = this.location.coordinates[0];
            this.latitude = this.location.coordinates[1];
        }
    }

    next();
});

const AddressModel = mongoose.model('address', addressSchema);

export default AddressModel;
