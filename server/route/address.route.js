import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
    addAddressController,
    deleteAddresscontroller,
    getAddressController,
    updateAddressController,
    updateAddressLocationController,
    findNearbyAddressesController,
    calculateDeliveryDistanceController,
    verifyAddressLocationController,
    getAddressWithLocationController
} from '../controllers/address.controller.js'

const addressRouter = Router()

// ============================================================================
// BASIC CRUD OPERATIONS
// ============================================================================

// Create new address (with optional location data)
addressRouter.post('/create', auth, addAddressController)

// Get all user addresses
addressRouter.get('/get', auth, getAddressController)

// Update address (all fields)
addressRouter.put('/update', auth, updateAddressController)

// Soft delete address
addressRouter.delete('/disable', auth, deleteAddresscontroller)

// ============================================================================
// LOCATION-SPECIFIC ENDPOINTS
// ============================================================================

// Update just the location (for pin drag/adjustment)
addressRouter.put('/update-location', auth, updateAddressLocationController)

// Verify/confirm address location
addressRouter.post('/verify-location', auth, verifyAddressLocationController)

// Get single address with full location data
addressRouter.get('/details/:addressId', auth, getAddressWithLocationController)

// ============================================================================
// GEOSPATIAL QUERIES (for delivery optimization)
// ============================================================================

// Find addresses near a point (for store assignment)
addressRouter.get('/nearby', auth, findNearbyAddressesController)

// Calculate delivery distance from store to address
addressRouter.post('/calculate-distance', auth, calculateDeliveryDistanceController)

export default addressRouter
