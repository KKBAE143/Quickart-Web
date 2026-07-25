import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js";

/**
 * Address Controller - Production-Grade with Geolocation Support
 *
 * All endpoints now support:
 * - Latitude/Longitude storage
 * - Plus Code for building-level precision
 * - Location accuracy tracking
 * - Confidence scoring
 * - Geospatial queries
 */

// ============================================================================
// CREATE ADDRESS
// ============================================================================

export const addAddressController = async (request, response) => {
    try {
        const userId = request.userId; // middleware

        const {
            // Basic fields
            address_line,
            city,
            state,
            pincode,
            country,
            mobile,
            address_type,

            // New location fields
            latitude,
            longitude,
            plusCode,
            locationAccuracy,
            locationMethod,
            locationConfidence,
            confidenceScore,
            userVerified,

            // Delivery optimization fields
            landmark,
            flatNo,
            floor,
            deliveryInstructions,
            gateCode
        } = request.body;

        // Build the address object
        const addressData = {
            address_line,
            city,
            state,
            country: country || 'India',
            pincode,
            mobile,
            address_type: address_type || 'HOME',
            userId,

            // Delivery fields
            landmark: landmark || '',
            flatNo: flatNo || '',
            floor: floor || '',
            deliveryInstructions: deliveryInstructions || '',
            gateCode: gateCode || ''
        };

        // Add location data if provided
        if (latitude && longitude) {
            addressData.latitude = latitude;
            addressData.longitude = longitude;
            addressData.location = {
                type: 'Point',
                coordinates: [longitude, latitude]  // GeoJSON uses [lng, lat]
            };
        }

        // Add Plus Code if provided
        if (plusCode) {
            addressData.plusCode = plusCode;
        }

        // Add accuracy tracking if provided
        if (locationAccuracy !== undefined) {
            addressData.locationAccuracy = locationAccuracy;
        }

        if (locationMethod) {
            addressData.locationMethod = locationMethod;
        }

        if (locationConfidence) {
            addressData.locationConfidence = locationConfidence;
        }

        if (confidenceScore !== undefined) {
            addressData.confidenceScore = confidenceScore;
        }

        if (userVerified !== undefined) {
            addressData.userVerified = userVerified;
        }

        // Create and save address
        const createAddress = new AddressModel(addressData);
        const saveAddress = await createAddress.save();

        // Add to user's address list
        await UserModel.findByIdAndUpdate(userId, {
            $push: {
                address_details: saveAddress._id
            }
        });

        return response.json({
            message: "Address Created Successfully",
            error: false,
            success: true,
            data: saveAddress
        });

    } catch (error) {
        console.error('Add address error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// GET ADDRESSES
// ============================================================================

export const getAddressController = async (request, response) => {
    try {
        const userId = request.userId; // middleware auth

        const data = await AddressModel.find({
            userId: userId,
            status: true
        }).sort({ createdAt: -1 });

        // Calculate delivery info for each address
        const addressesWithInfo = data.map(addr => {
            const addressObj = addr.toObject();

            // Add computed fields
            if (addr.latitude && addr.longitude) {
                addressObj.hasLocation = true;
                addressObj.coordinatesDisplay = `${addr.latitude.toFixed(6)}, ${addr.longitude.toFixed(6)}`;
            } else {
                addressObj.hasLocation = false;
            }

            // Add deliverability check
            addressObj.isDeliverable = addr.latitude && addr.longitude &&
                (!addr.locationAccuracy || addr.locationAccuracy <= 5000);

            return addressObj;
        });

        return response.json({
            data: addressesWithInfo,
            message: "List of addresses",
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// UPDATE ADDRESS
// ============================================================================

export const updateAddressController = async (request, response) => {
    try {
        const userId = request.userId; // middleware auth

        const {
            _id,

            // Basic fields
            address_line,
            city,
            state,
            country,
            pincode,
            mobile,
            address_type,

            // Location fields
            latitude,
            longitude,
            plusCode,
            locationAccuracy,
            locationMethod,
            locationConfidence,
            confidenceScore,
            userVerified,

            // Delivery fields
            landmark,
            flatNo,
            floor,
            deliveryInstructions,
            gateCode
        } = request.body;

        // Build update object with only provided fields
        const updateData = {};

        // Basic fields
        if (address_line !== undefined) updateData.address_line = address_line;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (country !== undefined) updateData.country = country;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (address_type !== undefined) updateData.address_type = address_type;

        // Delivery fields
        if (landmark !== undefined) updateData.landmark = landmark;
        if (flatNo !== undefined) updateData.flatNo = flatNo;
        if (floor !== undefined) updateData.floor = floor;
        if (deliveryInstructions !== undefined) updateData.deliveryInstructions = deliveryInstructions;
        if (gateCode !== undefined) updateData.gateCode = gateCode;

        // Location fields
        if (latitude !== undefined && longitude !== undefined) {
            updateData.latitude = latitude;
            updateData.longitude = longitude;
            updateData.location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            };
        }

        if (plusCode !== undefined) updateData.plusCode = plusCode;
        if (locationAccuracy !== undefined) updateData.locationAccuracy = locationAccuracy;
        if (locationMethod !== undefined) updateData.locationMethod = locationMethod;
        if (locationConfidence !== undefined) updateData.locationConfidence = locationConfidence;
        if (confidenceScore !== undefined) updateData.confidenceScore = confidenceScore;
        if (userVerified !== undefined) updateData.userVerified = userVerified;

        const updateAddress = await AddressModel.findOneAndUpdate(
            { _id: _id, userId: userId },
            updateData,
            { new: true }  // Return updated document
        );

        if (!updateAddress) {
            return response.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Address Updated",
            error: false,
            success: true,
            data: updateAddress
        });
    } catch (error) {
        console.error('Update address error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// UPDATE LOCATION ONLY (for pin drag/adjustment)
// ============================================================================

export const updateAddressLocationController = async (request, response) => {
    try {
        const userId = request.userId;

        const {
            _id,
            latitude,
            longitude,
            plusCode,
            locationAccuracy,
            locationMethod,
            userVerified
        } = request.body;

        if (!latitude || !longitude) {
            return response.status(400).json({
                message: "Latitude and longitude are required",
                error: true,
                success: false
            });
        }

        // Calculate confidence based on accuracy
        let locationConfidence = 'approximate';
        let confidenceScore = 20;

        if (userVerified) {
            locationConfidence = 'verified';
            confidenceScore = 95;
        } else if (locationAccuracy && locationAccuracy <= 50) {
            locationConfidence = 'high';
            confidenceScore = 90;
        } else if (locationAccuracy && locationAccuracy <= 200) {
            locationConfidence = 'medium';
            confidenceScore = 70;
        } else if (locationAccuracy && locationAccuracy <= 1000) {
            locationConfidence = 'low';
            confidenceScore = 40;
        }

        const updateAddress = await AddressModel.findOneAndUpdate(
            { _id: _id, userId: userId },
            {
                latitude,
                longitude,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                plusCode: plusCode || null,
                locationAccuracy: locationAccuracy || null,
                locationMethod: locationMethod || 'manual',
                locationConfidence,
                confidenceScore,
                userVerified: userVerified || false,
                lastValidated: userVerified ? new Date() : null
            },
            { new: true }
        );

        if (!updateAddress) {
            return response.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Location Updated",
            error: false,
            success: true,
            data: updateAddress
        });
    } catch (error) {
        console.error('Update location error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// DELETE/DISABLE ADDRESS
// ============================================================================

export const deleteAddresscontroller = async (request, response) => {
    try {
        const userId = request.userId; // auth middleware
        const { _id } = request.body;

        const disableAddress = await AddressModel.updateOne(
            { _id: _id, userId },
            { status: false }
        );

        return response.json({
            message: "Address removed",
            error: false,
            success: true,
            data: disableAddress
        });
    } catch (error) {
        console.error('Delete address error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// FIND NEARBY ADDRESSES (for store assignment/delivery optimization)
// ============================================================================

export const findNearbyAddressesController = async (request, response) => {
    try {
        const { latitude, longitude, maxDistance = 5000 } = request.query;

        if (!latitude || !longitude) {
            return response.status(400).json({
                message: "Latitude and longitude are required",
                error: true,
                success: false
            });
        }

        const addresses = await AddressModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            },
            status: true
        }).limit(50);

        // Calculate distance for each address
        const addressesWithDistance = addresses.map(addr => {
            const addressObj = addr.toObject();
            if (addr.distanceTo) {
                addressObj.distance = addr.distanceTo(
                    parseFloat(latitude),
                    parseFloat(longitude)
                );
            }
            return addressObj;
        });

        return response.json({
            data: addressesWithDistance,
            count: addressesWithDistance.length,
            message: "Nearby addresses found",
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Find nearby error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// CALCULATE DELIVERY DISTANCE
// ============================================================================

export const calculateDeliveryDistanceController = async (request, response) => {
    try {
        const { addressId, storeLat, storeLng } = request.body;

        if (!addressId || !storeLat || !storeLng) {
            return response.status(400).json({
                message: "addressId, storeLat, and storeLng are required",
                error: true,
                success: false
            });
        }

        const address = await AddressModel.findById(addressId);

        if (!address) {
            return response.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            });
        }

        if (!address.latitude || !address.longitude) {
            return response.status(400).json({
                message: "Address has no location data",
                error: true,
                success: false
            });
        }

        const distance = address.distanceTo(parseFloat(storeLat), parseFloat(storeLng));

        // Estimate delivery time (rough calculation)
        // Assuming 20 km/h average speed in city
        const estimatedMinutes = Math.ceil((distance / 1000) / 20 * 60);

        return response.json({
            data: {
                distanceMeters: Math.round(distance),
                distanceKm: (distance / 1000).toFixed(2),
                estimatedMinutes: Math.max(10, estimatedMinutes), // Minimum 10 minutes
                addressAccuracy: address.locationAccuracy,
                addressConfidence: address.locationConfidence
            },
            message: "Distance calculated",
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Calculate distance error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// VERIFY ADDRESS LOCATION
// ============================================================================

export const verifyAddressLocationController = async (request, response) => {
    try {
        const userId = request.userId;
        const { _id } = request.body;

        const address = await AddressModel.findOneAndUpdate(
            { _id: _id, userId: userId },
            {
                userVerified: true,
                locationConfidence: 'verified',
                confidenceScore: 95,
                lastValidated: new Date()
            },
            { new: true }
        );

        if (!address) {
            return response.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Address location verified",
            error: false,
            success: true,
            data: address
        });
    } catch (error) {
        console.error('Verify address error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// ============================================================================
// GET ADDRESS WITH FULL LOCATION DATA
// ============================================================================

export const getAddressWithLocationController = async (request, response) => {
    try {
        const { addressId } = request.params;

        const address = await AddressModel.findById(addressId);

        if (!address) {
            return response.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            });
        }

        const addressData = address.toObject();

        // Add computed fields
        if (address.latitude && address.longitude) {
            addressData.hasLocation = true;
            addressData.coordinatesDisplay = `${address.latitude.toFixed(6)}, ${address.longitude.toFixed(6)}`;
            addressData.googleMapsLink = `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
        } else {
            addressData.hasLocation = false;
        }

        addressData.isDeliverable = address.latitude && address.longitude &&
            (!address.locationAccuracy || address.locationAccuracy <= 5000);

        return response.json({
            data: addressData,
            message: "Address details",
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Get address error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};
