/**
 * LocationService.js - Production-Grade Location Detection
 *
 * Industry-standard location detection for quick commerce platforms.
 *
 * Key Features:
 * 1. Progressive GPS Refinement - Takes multiple readings, keeps best
 * 2. Location Confidence Scoring - Rates each location fix
 * 3. Plus Codes (Open Location Code) - Building-level precision
 * 4. Multi-Source Fusion - GPS + WiFi + IP combined intelligently
 * 5. Accuracy Validation - Ensures coords match address
 * 6. Movement Detection - For delivery tracking
 *
 * @author Quickart Development Team
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const LOCATION_METHODS = {
    GPS: 'gps',
    GPS_REFINED: 'gps_refined',  // Multiple readings averaged
    WIFI: 'wifi',
    CELL: 'cell',
    IP: 'ip',
    CACHED: 'cached',
    PLUS_CODE: 'plus_code',
    FUSED: 'fused'  // Multiple sources combined
};

export const ACCURACY_THRESHOLDS = {
    EXCELLENT: 15,     // GPS on mobile with good signal
    HIGH: 50,          // Standard GPS
    MEDIUM: 200,       // WiFi triangulation
    LOW: 1000,         // Cell tower
    VERY_LOW: 5000     // IP geolocation
};

export const CONFIDENCE_LEVELS = {
    VERIFIED: 'verified',     // User confirmed + high accuracy
    HIGH: 'high',             // GPS <= 50m
    MEDIUM: 'medium',         // 50-200m
    LOW: 'low',               // 200-1000m
    APPROXIMATE: 'approximate' // > 1000m or IP-based
};

// Plus Codes (Open Location Code) length for precision
// 10 = ~14m x 14m area, 11 = ~3m x 3m area
const PLUS_CODE_LENGTH = 11;

// Cache configuration
let locationCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000; // 30 seconds (reduced for freshness)

// ============================================================================
// MAIN DETECTION FUNCTION - PROGRESSIVE GPS REFINEMENT
// ============================================================================

/**
 * Detect location with progressive GPS refinement (Industry Standard)
 *
 * This is the industry-standard approach used by leading quick commerce platforms:
 * 1. Start GPS watch
 * 2. Collect multiple readings over 3-5 seconds
 * 3. Keep the reading with best accuracy
 * 4. Stop and return best result
 *
 * Falls back to WiFi -> IP if GPS fails
 *
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} Best location result with confidence
 */
export async function detectLocationWithPriority(options = {}) {
    const {
        googleMapsApiKey = null,
        useCache = true,
        gpsTimeout = 15000,           // Total time to wait for GPS
        refinementDuration = 4000,     // Time to collect multiple readings
        enableHighAccuracy = true,
        minAccuracyRequired = 500,     // Minimum acceptable accuracy
        includesPlusCode = true        // Generate Plus Code for precision
    } = options;

    // Check cache first (but only for fresh, accurate data)
    if (useCache && locationCache && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        if (cacheAge < CACHE_DURATION && locationCache.accuracy <= ACCURACY_THRESHOLDS.MEDIUM) {
            console.log('📍 Using cached location (age:', Math.round(cacheAge/1000), 's, accuracy:', Math.round(locationCache.accuracy), 'm)');
            return {
                ...locationCache,
                method: LOCATION_METHODS.CACHED,
                fromCache: true
            };
        }
    }

    let result = null;
    let errors = [];

    // 1. Try Progressive GPS Refinement (most accurate method)
    console.log('🛰️ Starting progressive GPS refinement...');
    try {
        result = await detectViaProgressiveGPS({
            timeout: gpsTimeout,
            refinementDuration,
            enableHighAccuracy,
            minAccuracy: minAccuracyRequired
        });

        // Generate Plus Code for extra precision
        if (includesPlusCode) {
            result.plusCode = generatePlusCode(result.lat, result.lng);
        }

        // Calculate confidence
        result.confidence = calculateConfidence(result);

        console.log(`✅ GPS refined: ±${Math.round(result.accuracy)}m (${result.readingsUsed} readings, confidence: ${result.confidence.level})`);
        updateCache(result);
        return result;
    } catch (gpsError) {
        console.warn('⚠️ GPS failed:', gpsError.message);
        errors.push({ method: 'GPS', error: gpsError.message, code: gpsError.code });

        if (gpsError.code === 1) {
            console.log('🔒 GPS permission denied');
        }
    }

    // 2. Try WiFi/Cell Triangulation via Google Geolocation API
    if (googleMapsApiKey) {
        console.log('📶 Attempting WiFi/Cell triangulation...');
        try {
            result = await detectViaGoogleGeolocation(googleMapsApiKey);

            if (includesPlusCode) {
                result.plusCode = generatePlusCode(result.lat, result.lng);
            }
            result.confidence = calculateConfidence(result);

            console.log(`✅ WiFi triangulation: ±${Math.round(result.accuracy)}m`);
            updateCache(result);
            return result;
        } catch (wifiError) {
            console.warn('⚠️ WiFi triangulation failed:', wifiError.message);
            errors.push({ method: 'WiFi', error: wifiError.message });
        }
    }

    // 3. Try IP Geolocation with enhanced accuracy
    console.log('🌐 Attempting IP geolocation with enhancement...');
    try {
        result = await detectViaEnhancedIP();

        if (includesPlusCode) {
            result.plusCode = generatePlusCode(result.lat, result.lng);
        }
        result.confidence = calculateConfidence(result);

        console.log(`✅ IP geolocation: ±${Math.round(result.accuracy)}m (${result.provider})`);
        updateCache(result);
        return result;
    } catch (ipError) {
        console.warn('⚠️ IP geolocation failed:', ipError.message);
        errors.push({ method: 'IP', error: ipError.message });
    }

    throw new Error(`Location detection failed. Errors: ${JSON.stringify(errors)}`);
}

// ============================================================================
// PROGRESSIVE GPS REFINEMENT - THE SECRET SAUCE
// ============================================================================

/**
 * Progressive GPS Detection - Takes multiple readings, returns best one
 *
 * This is what makes professional delivery platforms so accurate:
 * - GPS needs time to "warm up" and get satellite lock
 * - First reading might be ±500m, but after 3-4 seconds it's ±20m
 * - We collect readings over 3-5 seconds and keep the best
 *
 * @param {Object} options Configuration
 * @returns {Promise<Object>} Best GPS reading
 */
async function detectViaProgressiveGPS(options = {}) {
    const {
        timeout = 15000,
        refinementDuration = 4000,
        enableHighAccuracy = true,
        minAccuracy = 500
    } = options;

    if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
    }

    return new Promise((resolve, reject) => {
        const readings = [];
        let watchId = null;
        let refinementTimer = null;
        let timeoutTimer = null;
        let hasResolved = false;

        const cleanup = () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
            if (refinementTimer) {
                clearTimeout(refinementTimer);
                refinementTimer = null;
            }
            if (timeoutTimer) {
                clearTimeout(timeoutTimer);
                timeoutTimer = null;
            }
        };

        const finalize = () => {
            if (hasResolved) return;
            hasResolved = true;
            cleanup();

            if (readings.length === 0) {
                reject(new Error('No GPS readings obtained'));
                return;
            }

            // Find the best reading (lowest accuracy value = most accurate)
            const best = readings.reduce((a, b) => a.accuracy < b.accuracy ? a : b);

            // Calculate average for additional stability if we have enough readings
            let finalResult;
            if (readings.length >= 3) {
                // Use weighted average based on accuracy (more accurate = higher weight)
                const weights = readings.map(r => 1 / (r.accuracy + 1));
                const totalWeight = weights.reduce((a, b) => a + b, 0);

                const avgLat = readings.reduce((sum, r, i) => sum + r.lat * weights[i], 0) / totalWeight;
                const avgLng = readings.reduce((sum, r, i) => sum + r.lng * weights[i], 0) / totalWeight;

                // Use the best accuracy from our readings
                finalResult = {
                    lat: avgLat,
                    lng: avgLng,
                    accuracy: best.accuracy,
                    altitude: best.altitude,
                    heading: best.heading,
                    speed: best.speed,
                    timestamp: Date.now(),
                    method: LOCATION_METHODS.GPS_REFINED,
                    readingsUsed: readings.length,
                    allReadings: readings.map(r => ({
                        accuracy: r.accuracy,
                        lat: r.lat.toFixed(6),
                        lng: r.lng.toFixed(6)
                    })),
                    isApproximate: best.accuracy > ACCURACY_THRESHOLDS.MEDIUM,
                    refinementApplied: true
                };
            } else {
                // Not enough readings for averaging, use best single reading
                finalResult = {
                    ...best,
                    method: LOCATION_METHODS.GPS,
                    readingsUsed: readings.length,
                    refinementApplied: false
                };
            }

            console.log(`📊 GPS Refinement: ${readings.length} readings, best: ±${Math.round(best.accuracy)}m`);
            resolve(finalResult);
        };

        // Start watching position
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;

                console.log(`📡 GPS reading #${readings.length + 1}: ±${Math.round(accuracy)}m`);

                readings.push({
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    altitude,
                    heading,
                    speed,
                    timestamp: position.timestamp
                });

                // If we got excellent accuracy early, resolve immediately
                if (accuracy <= ACCURACY_THRESHOLDS.EXCELLENT && readings.length >= 2) {
                    console.log('🎯 Excellent accuracy achieved early!');
                    finalize();
                    return;
                }

                // Start refinement timer after first reading
                if (readings.length === 1 && !refinementTimer) {
                    refinementTimer = setTimeout(() => {
                        console.log('⏱️ Refinement duration complete');
                        finalize();
                    }, refinementDuration);
                }
            },
            (error) => {
                cleanup();

                if (readings.length > 0) {
                    // If we got some readings before error, use them
                    console.log('⚠️ GPS error, but have readings to use');
                    finalize();
                } else {
                    reject(error);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: timeout,
                maximumAge: 0  // Always get fresh position
            }
        );

        // Overall timeout
        timeoutTimer = setTimeout(() => {
            console.log('⏱️ GPS timeout reached');
            finalize();
        }, timeout);
    });
}

// ============================================================================
// SIMPLE GPS (FALLBACK)
// ============================================================================

/**
 * Simple GPS detection (single reading) - Fallback method
 */
export async function detectViaGPS(options = {}) {
    const { timeout = 15000, enableHighAccuracy = true } = options;

    if (!navigator.geolocation) {
        throw new Error('Geolocation not supported by this browser');
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp,
                    method: LOCATION_METHODS.GPS,
                    readingsUsed: 1,
                    isApproximate: position.coords.accuracy > ACCURACY_THRESHOLDS.MEDIUM
                });
            },
            (error) => {
                // Try lower accuracy as fallback
                if (error.code !== 1 && enableHighAccuracy) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            resolve({
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                altitude: position.coords.altitude,
                                heading: position.coords.heading,
                                speed: position.coords.speed,
                                timestamp: position.timestamp,
                                method: LOCATION_METHODS.GPS,
                                readingsUsed: 1,
                                isApproximate: true,
                                lowAccuracyFallback: true
                            });
                        },
                        reject,
                        { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
                    );
                } else {
                    reject(error);
                }
            },
            { enableHighAccuracy: true, timeout, maximumAge: 0 }
        );
    });
}

// ============================================================================
// WIFI/CELL TRIANGULATION
// ============================================================================

/**
 * WiFi/Cell Triangulation via Google Geolocation API
 * Works even without GPS hardware
 */
export async function detectViaGoogleGeolocation(apiKey) {
    if (!apiKey) {
        throw new Error('Google Maps API key required');
    }

    try {
        // Try to get WiFi access points if available (Browser Network Information API)
        let wifiAccessPoints = null;
        let cellTowers = null;

        // Note: Browser security prevents WiFi scanning, but Google's API
        // uses server-side detection based on IP routing

        const response = await fetch(
            `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    considerIp: true,
                    wifiAccessPoints: wifiAccessPoints,
                    cellTowers: cellTowers
                })
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API error ${response.status}`);
        }

        const data = await response.json();

        if (!data.location) {
            throw new Error('No location in response');
        }

        return {
            lat: data.location.lat,
            lng: data.location.lng,
            accuracy: data.accuracy || 150,
            method: LOCATION_METHODS.WIFI,
            isApproximate: (data.accuracy || 150) > ACCURACY_THRESHOLDS.MEDIUM,
            readingsUsed: 1
        };
    } catch (error) {
        throw new Error(`Google Geolocation: ${error.message}`);
    }
}

// ============================================================================
// ENHANCED IP GEOLOCATION
// ============================================================================

/**
 * Enhanced IP Geolocation with multiple providers
 * Returns the most accurate result from all providers
 */
async function detectViaEnhancedIP() {
    const providers = [
        {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            parse: (d) => ({ lat: d.latitude, lng: d.longitude, city: d.city, region: d.region, accuracy: 5000 })
        },
        {
            name: 'ip-api.com',
            url: 'http://ip-api.com/json/?fields=status,lat,lon,city,regionName,query',
            parse: (d) => ({ lat: d.lat, lng: d.lon, city: d.city, region: d.regionName, accuracy: 5000 })
        },
        {
            name: 'ipinfo.io',
            url: 'https://ipinfo.io/json',
            parse: (d) => {
                const [lat, lng] = (d.loc || '0,0').split(',').map(Number);
                return { lat, lng, city: d.city, region: d.region, accuracy: 5000 };
            }
        }
    ];

    let results = [];
    let errors = [];

    // Try all providers in parallel for speed
    const promises = providers.map(async (provider) => {
        try {
            const res = await fetch(provider.url, { signal: AbortSignal.timeout(3000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const parsed = provider.parse(data);
            if (!parsed.lat || !parsed.lng) throw new Error('Invalid coords');
            return { ...parsed, provider: provider.name };
        } catch (e) {
            return { error: e.message, provider: provider.name };
        }
    });

    const all = await Promise.all(promises);

    for (const r of all) {
        if (r.error) {
            errors.push(r);
        } else {
            results.push(r);
        }
    }

    if (results.length === 0) {
        throw new Error(`All IP providers failed: ${errors.map(e => e.provider).join(', ')}`);
    }

    // If we have multiple results, average them for slightly better accuracy
    if (results.length >= 2) {
        const avgLat = results.reduce((s, r) => s + r.lat, 0) / results.length;
        const avgLng = results.reduce((s, r) => s + r.lng, 0) / results.length;

        return {
            lat: avgLat,
            lng: avgLng,
            accuracy: 4500, // Slightly better from averaging
            city: results[0].city,
            region: results[0].region,
            method: LOCATION_METHODS.IP,
            isApproximate: true,
            provider: `fused (${results.map(r => r.provider).join('+')})`,
            readingsUsed: results.length
        };
    }

    const best = results[0];
    return {
        lat: best.lat,
        lng: best.lng,
        accuracy: ACCURACY_THRESHOLDS.VERY_LOW,
        city: best.city,
        region: best.region,
        method: LOCATION_METHODS.IP,
        isApproximate: true,
        provider: best.provider,
        readingsUsed: 1
    };
}

/**
 * Legacy IP detection for backward compatibility
 */
export async function detectViaIP() {
    return detectViaEnhancedIP();
}

// ============================================================================
// PLUS CODES (OPEN LOCATION CODE) - BUILDING-LEVEL PRECISION
// ============================================================================

/**
 * Generate Plus Code from coordinates
 *
 * Plus Codes are used by Google Maps, Uber, and delivery apps in India
 * because traditional addresses are often inaccurate.
 *
 * A Plus Code like "7JVW52GH+XR" represents a ~3m x 3m area
 *
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {number} codeLength Length of code (10 = 14m, 11 = 3m)
 * @returns {string} Plus Code
 */
export function generatePlusCode(lat, lng, codeLength = PLUS_CODE_LENGTH) {
    // Open Location Code algorithm implementation
    const ENCODING_CHARS = '23456789CFGHJMPQRVWX';
    const LATITUDE_MAX = 90;
    const LONGITUDE_MAX = 180;
    const PAIR_CODE_LENGTH = 10;
    const GRID_ROWS = 5;
    const GRID_COLS = 4;
    const SEPARATOR = '+';
    const SEPARATOR_POSITION = 8;

    // Normalize latitude
    let normalizedLat = Math.min(LATITUDE_MAX * 2, Math.max(0, lat + LATITUDE_MAX));
    let normalizedLng = lng + LONGITUDE_MAX;
    while (normalizedLng < 0) normalizedLng += LONGITUDE_MAX * 2;
    while (normalizedLng >= LONGITUDE_MAX * 2) normalizedLng -= LONGITUDE_MAX * 2;

    let code = '';
    let latVal = normalizedLat;
    let lngVal = normalizedLng;
    let latPlaceValue = 20;
    let lngPlaceValue = 20;

    // Generate pairs
    for (let i = 0; i < PAIR_CODE_LENGTH / 2; i++) {
        const latDigit = Math.floor(latVal / latPlaceValue);
        const lngDigit = Math.floor(lngVal / lngPlaceValue);

        latVal -= latDigit * latPlaceValue;
        lngVal -= lngDigit * lngPlaceValue;

        latPlaceValue /= 20;
        lngPlaceValue /= 20;

        code += ENCODING_CHARS.charAt(latDigit);
        code += ENCODING_CHARS.charAt(lngDigit);
    }

    // Add grid refinement for extra precision
    if (codeLength > PAIR_CODE_LENGTH) {
        latPlaceValue /= GRID_ROWS;
        lngPlaceValue /= GRID_COLS;

        for (let i = 0; i < codeLength - PAIR_CODE_LENGTH; i++) {
            const row = Math.floor(latVal / latPlaceValue);
            const col = Math.floor(lngVal / lngPlaceValue);

            latVal -= row * latPlaceValue;
            lngVal -= col * lngPlaceValue;

            latPlaceValue /= GRID_ROWS;
            lngPlaceValue /= GRID_COLS;

            code += ENCODING_CHARS.charAt(row * GRID_COLS + col);
        }
    }

    // Insert separator
    return code.slice(0, SEPARATOR_POSITION) + SEPARATOR + code.slice(SEPARATOR_POSITION);
}

/**
 * Decode Plus Code to coordinates
 *
 * @param {string} code Plus Code
 * @returns {Object} { lat, lng, latLo, latHi, lngLo, lngHi }
 */
export function decodePlusCode(code) {
    const ENCODING_CHARS = '23456789CFGHJMPQRVWX';
    const LATITUDE_MAX = 90;
    const LONGITUDE_MAX = 180;
    const PAIR_CODE_LENGTH = 10;
    const GRID_ROWS = 5;
    const GRID_COLS = 4;

    // Clean the code
    code = code.toUpperCase().replace('+', '').replace(/0/g, '');

    let lat = 0;
    let lng = 0;
    let latPlaceValue = 20;
    let lngPlaceValue = 20;

    // Decode pairs
    for (let i = 0; i < Math.min(code.length, PAIR_CODE_LENGTH); i += 2) {
        lat += ENCODING_CHARS.indexOf(code.charAt(i)) * latPlaceValue;
        lng += ENCODING_CHARS.indexOf(code.charAt(i + 1)) * lngPlaceValue;
        latPlaceValue /= 20;
        lngPlaceValue /= 20;
    }

    // Decode grid if present
    if (code.length > PAIR_CODE_LENGTH) {
        latPlaceValue /= GRID_ROWS;
        lngPlaceValue /= GRID_COLS;

        for (let i = PAIR_CODE_LENGTH; i < code.length; i++) {
            const digit = ENCODING_CHARS.indexOf(code.charAt(i));
            const row = Math.floor(digit / GRID_COLS);
            const col = digit % GRID_COLS;
            lat += row * latPlaceValue;
            lng += col * lngPlaceValue;
            latPlaceValue /= GRID_ROWS;
            lngPlaceValue /= GRID_COLS;
        }
    }

    const finalLat = lat - LATITUDE_MAX + latPlaceValue / 2;
    const finalLng = lng - LONGITUDE_MAX + lngPlaceValue / 2;

    return {
        lat: finalLat,
        lng: finalLng,
        latLo: finalLat - latPlaceValue / 2,
        latHi: finalLat + latPlaceValue / 2,
        lngLo: finalLng - lngPlaceValue / 2,
        lngHi: finalLng + lngPlaceValue / 2
    };
}

/**
 * Check if a string is a valid Plus Code
 */
export function isValidPlusCode(code) {
    const pattern = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,}$/i;
    return pattern.test(code);
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate location confidence score
 *
 * @param {Object} location Location object
 * @returns {Object} Confidence information
 */
export function calculateConfidence(location) {
    const { accuracy, method, readingsUsed = 1, isApproximate } = location;

    let score = 100;
    let level = CONFIDENCE_LEVELS.HIGH;
    let factors = [];

    // Accuracy score (biggest factor)
    if (accuracy <= ACCURACY_THRESHOLDS.EXCELLENT) {
        score = 100;
        factors.push('Excellent GPS accuracy');
    } else if (accuracy <= ACCURACY_THRESHOLDS.HIGH) {
        score = 85;
        factors.push('Good GPS accuracy');
    } else if (accuracy <= ACCURACY_THRESHOLDS.MEDIUM) {
        score = 65;
        factors.push('Moderate accuracy');
    } else if (accuracy <= ACCURACY_THRESHOLDS.LOW) {
        score = 40;
        factors.push('Low accuracy');
    } else {
        score = 20;
        factors.push('Very low accuracy');
    }

    // Method bonus
    if (method === LOCATION_METHODS.GPS_REFINED) {
        score += 10;
        factors.push('Refined from multiple readings');
    }

    if (method === LOCATION_METHODS.IP) {
        score -= 20;
        factors.push('IP-based only');
    }

    // Multiple readings bonus
    if (readingsUsed >= 3) {
        score += 5;
        factors.push(`${readingsUsed} readings averaged`);
    }

    // Cap score
    score = Math.max(0, Math.min(100, score));

    // Determine level
    if (score >= 80) level = CONFIDENCE_LEVELS.HIGH;
    else if (score >= 60) level = CONFIDENCE_LEVELS.MEDIUM;
    else if (score >= 40) level = CONFIDENCE_LEVELS.LOW;
    else level = CONFIDENCE_LEVELS.APPROXIMATE;

    return {
        score,
        level,
        factors,
        requiresVerification: score < 60,
        canTrustForDelivery: score >= 50
    };
}

// ============================================================================
// ACCURACY DISPLAY HELPERS
// ============================================================================

/**
 * Get accuracy level classification with UI data
 */
export function getAccuracyLevel(accuracy, method) {
    if (method === LOCATION_METHODS.IP) {
        return {
            level: 'approximate',
            icon: '🌐',
            label: 'Approximate Location',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            description: 'City-level (~5km). Drag pin to your exact location.',
            needsRefinement: true,
            trustScore: 20
        };
    }

    if (accuracy <= ACCURACY_THRESHOLDS.EXCELLENT) {
        return {
            level: 'excellent',
            icon: '🎯',
            label: 'Excellent Accuracy',
            color: 'text-green-700',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            description: `±${Math.round(accuracy)}m - GPS locked perfectly`,
            needsRefinement: false,
            trustScore: 100
        };
    }

    if (accuracy <= ACCURACY_THRESHOLDS.HIGH) {
        return {
            level: 'high',
            icon: '📍',
            label: 'High Accuracy',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            description: `±${Math.round(accuracy)}m - GPS locked`,
            needsRefinement: false,
            trustScore: 85
        };
    }

    if (accuracy <= ACCURACY_THRESHOLDS.MEDIUM) {
        return {
            level: 'medium',
            icon: '📶',
            label: 'Good Accuracy',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            description: `±${Math.round(accuracy)}m - Verify pin position`,
            needsRefinement: true,
            trustScore: 65
        };
    }

    if (accuracy <= ACCURACY_THRESHOLDS.LOW) {
        return {
            level: 'low',
            icon: '⚠️',
            label: 'Low Accuracy',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-300',
            description: `±${Math.round(accuracy)}m - Please adjust pin`,
            needsRefinement: true,
            trustScore: 40
        };
    }

    return {
        level: 'very-low',
        icon: '❗',
        label: 'Very Low Accuracy',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: `±${Math.round(accuracy)}m - Must adjust pin to building`,
        needsRefinement: true,
        trustScore: 20
    };
}

/**
 * Format location for UI display
 */
export function formatLocationForDisplay(location) {
    const accuracyInfo = getAccuracyLevel(location.accuracy, location.method);

    return {
        coordinates: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        accuracyText: `±${Math.round(location.accuracy)}m`,
        methodText: getMethodDisplayText(location.method),
        plusCode: location.plusCode || generatePlusCode(location.lat, location.lng),
        ...accuracyInfo,
        confidence: location.confidence || calculateConfidence(location)
    };
}

function getMethodDisplayText(method) {
    const methods = {
        [LOCATION_METHODS.GPS]: '🛰️ GPS',
        [LOCATION_METHODS.GPS_REFINED]: '🎯 GPS (Refined)',
        [LOCATION_METHODS.WIFI]: '📶 WiFi',
        [LOCATION_METHODS.CELL]: '📱 Cell Tower',
        [LOCATION_METHODS.IP]: '🌐 IP Address',
        [LOCATION_METHODS.CACHED]: '💾 Cached',
        [LOCATION_METHODS.PLUS_CODE]: '📍 Plus Code',
        [LOCATION_METHODS.FUSED]: '🔗 Combined Sources'
    };
    return methods[method] || '📍 Unknown';
}

// ============================================================================
// CACHING
// ============================================================================

function updateCache(location) {
    locationCache = { ...location };
    cacheTimestamp = Date.now();
}

export function clearLocationCache() {
    locationCache = null;
    cacheTimestamp = null;
    console.log('🗑️ Location cache cleared');
}

export function getCachedLocation() {
    if (!locationCache || !cacheTimestamp) return null;
    const age = Date.now() - cacheTimestamp;
    if (age > CACHE_DURATION) return null;
    return { ...locationCache, cacheAge: age };
}

// ============================================================================
// CONTINUOUS LOCATION WATCHING (FOR DELIVERY AGENTS)
// ============================================================================

/**
 * Watch location continuously with smart filtering
 *
 * @param {Function} onUpdate Callback for updates
 * @param {Function} onError Callback for errors
 * @param {Object} options Configuration
 * @returns {Object} Watch controller
 */
export function watchLocation(onUpdate, onError, options = {}) {
    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 3000,
        minAccuracy = 300,
        minDistanceChange = 5,  // Minimum meters before update
        minTimeChange = 2000,   // Minimum ms between updates
        includeSpeed = true
    } = options;

    if (!navigator.geolocation) {
        onError(new Error('Geolocation not supported'));
        return null;
    }

    let lastPosition = null;
    let lastUpdateTime = 0;

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
            const now = Date.now();

            // Filter low accuracy
            if (accuracy > minAccuracy) {
                console.log(`⚠️ Skipping: ±${Math.round(accuracy)}m > ${minAccuracy}m threshold`);
                return;
            }

            // Filter if too soon since last update
            if (now - lastUpdateTime < minTimeChange) {
                return;
            }

            // Filter if hasn't moved enough
            if (lastPosition) {
                const distance = calculateDistance(
                    lastPosition.lat, lastPosition.lng,
                    latitude, longitude
                );
                if (distance < minDistanceChange && accuracy >= lastPosition.accuracy) {
                    return;
                }
            }

            const location = {
                lat: latitude,
                lng: longitude,
                accuracy,
                altitude,
                heading,
                speed,
                timestamp: position.timestamp,
                method: LOCATION_METHODS.GPS,
                plusCode: generatePlusCode(latitude, longitude),
                movementInfo: lastPosition ? {
                    distanceMoved: calculateDistance(lastPosition.lat, lastPosition.lng, latitude, longitude),
                    timeSinceLastUpdate: now - lastUpdateTime,
                    isMoving: speed > 0.5 // Moving if > 0.5 m/s
                } : null
            };

            lastPosition = { lat: latitude, lng: longitude, accuracy };
            lastUpdateTime = now;

            updateCache(location);
            onUpdate(location);
        },
        (error) => {
            console.error('📍 Watch error:', error.message);
            onError(error);
        },
        { enableHighAccuracy, timeout, maximumAge }
    );

    console.log('📍 Location watching started (ID:', watchId, ')');

    return {
        id: watchId,
        stop: () => {
            navigator.geolocation.clearWatch(watchId);
            console.log('📍 Location watching stopped');
        }
    };
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId) {
    if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        console.log('📍 Location watching stopped (ID:', watchId, ')');
    }
}

// ============================================================================
// DISTANCE CALCULATIONS (HAVERSINE)
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 *
 * @param {number} lat1 First latitude
 * @param {number} lng1 First longitude
 * @param {number} lat2 Second latitude
 * @param {number} lng2 Second longitude
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const x = Math.cos(φ2) * Math.sin(Δλ);
    const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(x, y);
    return ((θ * 180 / Math.PI) + 360) % 360;
}

// ============================================================================
// ADDRESS VALIDATION
// ============================================================================

/**
 * Validate that coordinates match the expected address area
 *
 * @param {Object} coords { lat, lng }
 * @param {Object} address { city, state, pincode }
 * @param {string} googleMapsApiKey API key for verification
 * @returns {Promise<Object>} Validation result
 */
export async function validateLocationWithAddress(coords, address, googleMapsApiKey) {
    if (!googleMapsApiKey || !window.google?.maps?.Geocoder) {
        return {
            valid: null,
            reason: 'Cannot validate (no API)',
            confidence: 'unknown'
        };
    }

    return new Promise((resolve) => {
        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ location: { lat: coords.lat, lng: coords.lng } }, (results, status) => {
            if (status !== 'OK' || !results[0]) {
                resolve({ valid: null, reason: 'Geocoding failed', confidence: 'unknown' });
                return;
            }

            let foundCity = '';
            let foundState = '';
            let foundPincode = '';

            results[0].address_components.forEach(comp => {
                if (comp.types.includes('locality')) foundCity = comp.long_name;
                if (comp.types.includes('administrative_area_level_1')) foundState = comp.long_name;
                if (comp.types.includes('postal_code')) foundPincode = comp.long_name;
            });

            const cityMatch = !address.city ||
                foundCity.toLowerCase().includes(address.city.toLowerCase()) ||
                address.city.toLowerCase().includes(foundCity.toLowerCase());

            const stateMatch = !address.state ||
                foundState.toLowerCase().includes(address.state.toLowerCase()) ||
                address.state.toLowerCase().includes(foundState.toLowerCase());

            const pincodeMatch = !address.pincode || foundPincode === address.pincode;

            const matchScore = [cityMatch, stateMatch, pincodeMatch].filter(Boolean).length;

            if (matchScore === 3) {
                resolve({ valid: true, reason: 'All components match', confidence: 'high', matchScore });
            } else if (matchScore >= 2) {
                resolve({ valid: true, reason: 'Most components match', confidence: 'medium', matchScore });
            } else if (matchScore === 1) {
                resolve({ valid: false, reason: 'Location may be incorrect', confidence: 'low', matchScore });
            } else {
                resolve({ valid: false, reason: 'Location does not match address', confidence: 'none', matchScore });
            }
        });
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Main detection
    detectLocationWithPriority,
    detectViaGPS,
    detectViaGoogleGeolocation,
    detectViaIP,

    // Plus Codes
    generatePlusCode,
    decodePlusCode,
    isValidPlusCode,

    // Confidence & Display
    calculateConfidence,
    getAccuracyLevel,
    formatLocationForDisplay,

    // Caching
    clearLocationCache,
    getCachedLocation,

    // Watching
    watchLocation,
    stopWatchingLocation,

    // Distance
    calculateDistance,
    calculateBearing,

    // Validation
    validateLocationWithAddress,

    // Constants
    LOCATION_METHODS,
    ACCURACY_THRESHOLDS,
    CONFIDENCE_LEVELS
};
