# Location Accuracy System - Production Guide

## Overview

This document describes the production-grade location accuracy system implemented in Quickart, following best practices used by Blinkit, Zepto, and Instamart.

## Key Improvements Made

### 1. Progressive GPS Refinement (The Secret Sauce)

**Problem**: Traditional GPS detection takes a single reading, which can be anywhere from ±20m to ±2000m depending on when the GPS hardware gets a satellite lock.

**Solution**: We now use `watchPosition` to collect multiple GPS readings over 4 seconds, then select the best one:

```javascript
// In LocationService.js
async function detectViaProgressiveGPS(options) {
    // Start watching GPS
    // Collect readings over 4 seconds
    // Use weighted average of readings (more accurate = higher weight)
    // Return best reading
}
```

**Expected Improvement**: From ±200-2000m to ±15-50m on mobile devices.

### 2. Plus Codes (Open Location Code)

Plus Codes provide building-level precision (±3m) where traditional addresses fail:

```javascript
// Example Plus Code
const plusCode = generatePlusCode(17.4485, 78.3908);
// Returns: "7JVW52GH+XR" (represents a 3m x 3m area)
```

**Use Cases**:
- Delivery agents can navigate to exact building
- Addresses without clear street names
- Rural areas with limited geocoding

### 3. Location Confidence Scoring

Every location now has a confidence score (0-100) based on:
- GPS accuracy in meters
- Detection method (GPS > WiFi > IP)
- Number of readings averaged
- User verification status

```javascript
// Confidence levels
VERIFIED: 95   // User confirmed pin position
HIGH: 85-90    // GPS ≤50m
MEDIUM: 65-70  // WiFi/GPS 50-200m
LOW: 40        // Cell tower 200-1000m
APPROXIMATE: 20 // IP-based >1000m
```

### 4. Database Geospatial Indexing

Addresses now store coordinates in GeoJSON format with MongoDB 2dsphere index:

```javascript
// Address model
location: {
    type: 'Point',
    coordinates: [longitude, latitude]
}
```

**Enables**:
- Find nearby addresses: `$near` queries
- Distance calculations: `$geoNear` aggregation
- Store assignment based on proximity

## Files Modified

### Frontend

| File | Changes |
|------|---------|
| `client/src/utils/LocationService.js` | Complete rewrite with progressive GPS, Plus Codes, confidence scoring |
| `client/src/components/AddAddress.jsx` | Location data storage, accuracy indicator UI |
| `client/src/common/SummaryApi.js` | New location-specific API endpoints |

### Backend

| File | Changes |
|------|---------|
| `server/models/address.model.js` | Added geospatial fields, 2dsphere index, methods |
| `server/controllers/address.controller.js` | Handle location data, geospatial queries |
| `server/route/address.route.js` | New endpoints for location operations |

## API Endpoints

### New Location Endpoints

```
PUT  /api/address/update-location   - Update just location (pin drag)
POST /api/address/verify-location   - User confirms pin position
GET  /api/address/details/:id       - Get address with full location data
GET  /api/address/nearby            - Find addresses near a point
POST /api/address/calculate-distance - Calculate delivery distance
```

### Request Example: Create Address with Location

```javascript
POST /api/address/create
{
    "address_line": "123 Main Street, Banjara Hills",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500034",
    "mobile": 9876543210,
    "address_type": "HOME",

    // Location data
    "latitude": 17.4485,
    "longitude": 78.3908,
    "plusCode": "7JVW52GH+XR",
    "locationAccuracy": 25,
    "locationMethod": "gps_refined",
    "locationConfidence": "high",
    "confidenceScore": 90,
    "userVerified": true
}
```

## Migration

Run the migration script to update existing addresses:

```bash
cd server
node migrations/migrate-addresses-geospatial.js
```

This will:
1. Create 2dsphere geospatial index
2. Add default values for new fields
3. Sync GeoJSON format with existing lat/lng data

## Accuracy Comparison

| Before | After |
|--------|-------|
| Single GPS reading | Progressive refinement (3-5 readings) |
| ±200-2000m typical | ±15-50m typical |
| No confidence tracking | Confidence score 0-100 |
| No building-level precision | Plus Codes (±3m) |
| Re-geocoding on every display | Stored coordinates |
| No distance calculations | Geospatial queries enabled |

## Testing Location Accuracy

### Desktop Testing
Desktop browsers typically get ±200-2000m accuracy (WiFi-based). This is expected.

### Mobile Testing

1. **ngrok Method** (recommended):
   ```bash
   cd client
   npm run dev
   # In another terminal:
   ngrok http 5173
   ```
   Access the ngrok URL from mobile phone.

2. **Local Network Method**:
   ```bash
   npm run dev -- --host
   ```
   Access via `http://YOUR_IP:5173` from mobile on same WiFi.

**Expected Mobile Accuracy**: ±10-50m with GPS enabled.

## Troubleshooting

### Low Accuracy on Mobile

1. **Check GPS is enabled**: Settings → Location → High accuracy mode
2. **Clear location cache**: `clearLocationCache()` function
3. **Wait for GPS warm-up**: First reading may be poor, progressive refinement needs 4 seconds

### Geospatial Index Not Working

```javascript
// Check indexes in MongoDB
db.addresses.getIndexes()

// Should include:
{ "location" : "2dsphere" }
```

### Plus Code Not Generating

Plus Codes require valid coordinates:
```javascript
// Verify coordinates
console.log(latitude, longitude);
// Should be numbers like 17.4485, 78.3908
```

## Performance Considerations

1. **GPS Timeout**: Set to 15 seconds to allow GPS hardware to get satellite lock
2. **Refinement Duration**: 4 seconds collects 3-5 readings on most devices
3. **Cache Duration**: 30 seconds to balance freshness vs API calls
4. **Index Usage**: 2dsphere index makes `$near` queries O(log n)

## Future Enhancements

1. **Sensor Fusion**: Combine GPS with accelerometer/compass for indoor accuracy
2. **Offline Caching**: Store Plus Codes for offline address validation
3. **Crowd-sourced Accuracy**: Learn from successful deliveries to improve confidence

## Questions?

For technical questions about this implementation, refer to:
- `client/src/utils/LocationService.js` - Main location detection logic
- `server/models/address.model.js` - Database schema and methods
- `docs/setup/GOOGLE_MAPS_API_SETUP.md` - Google Maps configuration
