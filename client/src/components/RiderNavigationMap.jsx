import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
    Navigation,
    MapPin,
    Store,
    User,
    Loader2,
    ExternalLink,
    Clock,
    Route,
    Phone,
    ChevronRight,
    Target,
    Locate,
    Bike
} from 'lucide-react';
import { useGoogleMapsContext } from '../provider/GoogleMapsProvider';

/**
 * RiderNavigationMap Component
 *
 * Production-level navigation map for delivery riders.
 * Similar to Zomato, Swiggy, Blinkit rider apps.
 *
 * Features:
 * - Two-phase delivery: Store pickup → Customer delivery
 * - Real-time route visualization with directions
 * - Smooth current location tracking
 * - ETA and distance calculations
 * - Turn-by-turn directions summary
 * - One-tap Google Maps navigation
 * - Animated rider marker
 * - Professional UI with full-height map
 */
const RiderNavigationMap = memo(function RiderNavigationMap({
    storeLocation,           // { lat, lng, name, address, phone }
    customerLocation,        // { lat, lng, name, address, phone }
    currentPhase = 'pickup', // 'pickup' | 'delivery'
    height = '350px',
    onNavigate,
    onCallStore,
    onCallCustomer,
    showControls = true,
    className = ''
}) {
    // Refs
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const directionsRendererRef = useRef(null);
    const riderMarkerRef = useRef(null);
    const storeMarkerRef = useRef(null);
    const customerMarkerRef = useRef(null);
    const watchIdRef = useRef(null);
    const animationFrameRef = useRef(null);
    const previousLocationRef = useRef(null);

    // State
    const { isLoaded, loadError } = useGoogleMapsContext();
    const [mapReady, setMapReady] = useState(false);
    const [riderLocation, setRiderLocation] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isLocating, setIsLocating] = useState(true);

    // Current destination based on phase
    const currentDestination = currentPhase === 'pickup' ? storeLocation : customerLocation;
    const destinationName = currentPhase === 'pickup' ? 'Store' : 'Customer';

    /**
     * Smooth marker animation using requestAnimationFrame
     */
    const animateMarker = useCallback((startPos, endPos, duration = 800) => {
        if (!riderMarkerRef.current) return;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const lat = startPos.lat + (endPos.lat - startPos.lat) * easeProgress;
            const lng = startPos.lng + (endPos.lng - startPos.lng) * easeProgress;

            riderMarkerRef.current.setPosition(
                new window.google.maps.LatLng(lat, lng)
            );

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    }, []);

    /**
     * Calculate heading between two points
     */
    const calculateHeading = useCallback((from, to) => {
        if (window.google?.maps?.geometry) {
            const point1 = new window.google.maps.LatLng(from.lat, from.lng);
            const point2 = new window.google.maps.LatLng(to.lat, to.lng);
            return window.google.maps.geometry.spherical.computeHeading(point1, point2);
        }
        return 0;
    }, []);

    /**
     * Create rider marker icon
     */
    const createRiderIcon = useCallback((rotation = 0) => {
        if (!window.google) return null;

        return {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 8,
            rotation: rotation,
            anchor: new window.google.maps.Point(0, 2.5)
        };
    }, []);

    /**
     * Initialize Google Map
     */
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        // Default center (Delhi)
        const defaultCenter = { lat: 28.6139, lng: 77.2090 };

        const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] }
            ]
        });

        mapInstanceRef.current = map;

        // Create directions renderer with custom styling
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#3B82F6',
                strokeWeight: 5,
                strokeOpacity: 0.8
            }
        });
        directionsRenderer.setMap(map);
        directionsRendererRef.current = directionsRenderer;

        // Create store marker
        if (storeLocation?.lat && storeLocation?.lng) {
            const storeMarker = new window.google.maps.Marker({
                position: { lat: storeLocation.lat, lng: storeLocation.lng },
                map,
                icon: {
                    path: 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z',
                    fillColor: '#F59E0B',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 2,
                    anchor: new window.google.maps.Point(12, 12)
                },
                title: 'Store',
                zIndex: 2
            });
            storeMarkerRef.current = storeMarker;
        }

        // Create customer marker
        if (customerLocation?.lat && customerLocation?.lng) {
            const customerMarker = new window.google.maps.Marker({
                position: { lat: customerLocation.lat, lng: customerLocation.lng },
                map,
                icon: {
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: '#EF4444',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 2,
                    anchor: new window.google.maps.Point(12, 24)
                },
                title: 'Customer',
                zIndex: 2
            });
            customerMarkerRef.current = customerMarker;
        }

        // Create rider marker
        const riderMarker = new window.google.maps.Marker({
            position: defaultCenter,
            map,
            icon: createRiderIcon(0),
            title: 'You',
            zIndex: 10,
            optimized: false
        });
        riderMarkerRef.current = riderMarker;

        setMapReady(true);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isLoaded, storeLocation, customerLocation, createRiderIcon]);

    /**
     * Watch rider's current location
     */
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported');
            setIsLocating(false);
            return;
        }

        let retryCount = 0;
        const maxRetries = 3;

        const startWatching = () => {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setRiderLocation(newLocation);
                    setIsLocating(false);
                    setLocationError(null);
                    retryCount = 0; // Reset on success
                },
                (error) => {
                    console.error('Location error:', error);

                    // Handle different error types
                    if (error.code === 1) {
                        // Permission denied
                        setLocationError('Location permission denied. Please enable location access.');
                        setIsLocating(false);
                    } else if (error.code === 2) {
                        // Position unavailable
                        setLocationError('Unable to determine location. Please check GPS.');
                        setIsLocating(false);
                    } else if (error.code === 3) {
                        // Timeout - retry with lower accuracy
                        retryCount++;
                        if (retryCount <= maxRetries) {
                            console.log(`Location timeout, retrying (${retryCount}/${maxRetries})...`);
                            // Try again with lower accuracy
                            navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                    setRiderLocation({
                                        lat: pos.coords.latitude,
                                        lng: pos.coords.longitude
                                    });
                                    setIsLocating(false);
                                    setLocationError(null);
                                },
                                () => {
                                    if (retryCount >= maxRetries) {
                                        setLocationError('Location timeout. Please check GPS settings.');
                                        setIsLocating(false);
                                    }
                                },
                                { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
                            );
                        } else {
                            setLocationError('Location timeout. Please check GPS settings.');
                            setIsLocating(false);
                        }
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000, // Increased timeout
                    maximumAge: 5000 // Allow slightly cached position
                }
            );

            watchIdRef.current = watchId;
        };

        // Start watching with a small delay to allow map to initialize
        const timer = setTimeout(startWatching, 500);

        return () => {
            clearTimeout(timer);
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    /**
     * Update rider marker and route when location changes
     */
    useEffect(() => {
        if (!mapReady || !riderLocation || !riderMarkerRef.current) return;

        const prevLoc = previousLocationRef.current;

        if (prevLoc) {
            // Calculate heading for rotation
            const heading = calculateHeading(prevLoc, riderLocation);
            riderMarkerRef.current.setIcon(createRiderIcon(heading));
            // Smooth animation
            animateMarker(prevLoc, riderLocation);
        } else {
            riderMarkerRef.current.setPosition(
                new window.google.maps.LatLng(riderLocation.lat, riderLocation.lng)
            );
        }

        previousLocationRef.current = riderLocation;

        // Update route to current destination
        if (currentDestination?.lat && currentDestination?.lng && directionsRendererRef.current) {
            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: riderLocation,
                    destination: { lat: currentDestination.lat, lng: currentDestination.lng },
                    travelMode: window.google.maps.TravelMode.DRIVING
                },
                (result, status) => {
                    if (status === 'OK') {
                        directionsRendererRef.current.setDirections(result);

                        // Extract route info
                        const route = result.routes[0];
                        if (route?.legs?.[0]) {
                            const leg = route.legs[0];
                            setRouteInfo({
                                distance: leg.distance?.text || '--',
                                duration: leg.duration?.text || '--',
                                steps: leg.steps?.slice(0, 3) || []
                            });
                        }
                    }
                }
            );
        }

        // Fit bounds to show rider and destination
        if (mapInstanceRef.current && currentDestination?.lat) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(riderLocation);
            bounds.extend({ lat: currentDestination.lat, lng: currentDestination.lng });
            mapInstanceRef.current.fitBounds(bounds, { padding: 80 });
        }
    }, [riderLocation, currentDestination, mapReady, animateMarker, createRiderIcon, calculateHeading]);

    /**
     * Handle navigate button click
     */
    const handleNavigate = () => {
        if (!currentDestination?.lat || !currentDestination?.lng) return;

        const url = `https://www.google.com/maps/dir/?api=1&destination=${currentDestination.lat},${currentDestination.lng}&travelmode=driving`;
        window.open(url, '_blank');
        onNavigate?.();
    };

    /**
     * Center map on rider
     */
    const handleCenterOnRider = () => {
        if (mapInstanceRef.current && riderLocation) {
            mapInstanceRef.current.panTo(riderLocation);
            mapInstanceRef.current.setZoom(16);
        }
    };

    // Loading state - only block on Google Maps not loaded
    if (!isLoaded) {
        return (
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`} style={{ height }}>
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-3">
                    <Loader2 size={36} className="animate-spin text-green-600" />
                    <p className="text-gray-600 font-medium">Loading map...</p>
                </div>
            </div>
        );
    }

    // Error state - only for Google Maps load error
    if (loadError) {
        return (
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`} style={{ height }}>
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 gap-3">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <MapPin size={28} className="text-red-500" />
                    </div>
                    <p className="text-gray-700 font-medium text-center">{loadError}</p>
                    <button
                        onClick={handleNavigate}
                        className="mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <ExternalLink size={18} />
                        Open in Google Maps
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden relative ${className}`} style={{ height }}>
            {/* Phase Indicator Banner */}
            <div className={`absolute top-0 left-0 right-0 z-20 ${
                currentPhase === 'pickup'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}>
                <div className="px-4 py-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            {currentPhase === 'pickup' ? (
                                <Store size={20} className="text-white" />
                            ) : (
                                <MapPin size={20} className="text-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                                {currentPhase === 'pickup' ? 'Go to Store' : 'Deliver to Customer'}
                            </p>
                            <p className="font-bold text-base truncate max-w-[180px]">
                                {currentPhase === 'pickup' ? storeLocation?.name : customerLocation?.name}
                            </p>
                        </div>
                    </div>

                    {/* Route Info */}
                    {routeInfo && (
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-white/80 text-xs">ETA</p>
                                <p className="font-bold">{routeInfo.duration}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-white/80 text-xs">Distance</p>
                                <p className="font-bold">{routeInfo.distance}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Location Loading Overlay */}
            {isLocating && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-green-600" />
                        <p className="text-gray-700 font-medium">Getting your location...</p>
                        <p className="text-gray-500 text-sm">Please wait</p>
                    </div>
                </div>
            )}

            {/* Location Error Overlay */}
            {locationError && !isLocating && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-3 max-w-xs">
                        <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Navigation size={24} className="text-yellow-600" />
                        </div>
                        <p className="text-gray-700 font-medium text-center">{locationError}</p>
                        <button
                            onClick={handleNavigate}
                            className="mt-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
                        >
                            <ExternalLink size={16} />
                            Open Google Maps
                        </button>
                    </div>
                </div>
            )}

            {/* Center on Rider Button */}
            <button
                onClick={handleCenterOnRider}
                className="absolute top-20 right-4 z-20 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                title="Center on my location"
            >
                <Locate size={18} className="text-gray-700" />
            </button>

            {/* LIVE Indicator */}
            <div className="absolute top-20 left-4 z-20">
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-100">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-600 tracking-wide">LIVE</span>
                </div>
            </div>

            {/* Bottom Control Panel */}
            {showControls && (
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white to-transparent pt-6">
                    <div className="px-4 pb-4 space-y-3">
                        {/* Destination Address */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    currentPhase === 'pickup' ? 'bg-amber-100' : 'bg-red-100'
                                }`}>
                                    {currentPhase === 'pickup' ? (
                                        <Store size={18} className="text-amber-600" />
                                    ) : (
                                        <MapPin size={18} className="text-red-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                                        {currentPhase === 'pickup' ? 'Pickup from' : 'Deliver to'}
                                    </p>
                                    <p className="font-semibold text-gray-900 truncate">
                                        {currentPhase === 'pickup' ? storeLocation?.address : customerLocation?.address}
                                    </p>
                                </div>
                                {((currentPhase === 'pickup' && storeLocation?.phone) ||
                                  (currentPhase === 'delivery' && customerLocation?.phone)) && (
                                    <button
                                        onClick={() => {
                                            if (currentPhase === 'pickup') {
                                                onCallStore?.();
                                            } else {
                                                onCallCustomer?.();
                                            }
                                        }}
                                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <Phone size={18} className="text-gray-600" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Navigate Button */}
                        <button
                            onClick={handleNavigate}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg transition-colors flex items-center justify-center gap-3"
                        >
                            <Navigation size={20} />
                            Navigate with Google Maps
                            <ChevronRight size={18} />
                        </button>

                        {/* Phase Indicator Dots */}
                        <div className="flex items-center justify-center gap-2 pt-1">
                            <div className={`w-3 h-3 rounded-full transition-colors ${
                                currentPhase === 'pickup' ? 'bg-amber-500' : 'bg-green-200'
                            }`} />
                            <div className="w-8 h-0.5 bg-gray-200" />
                            <div className={`w-3 h-3 rounded-full transition-colors ${
                                currentPhase === 'delivery' ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        </div>
                        <p className="text-center text-xs text-gray-500">
                            {currentPhase === 'pickup'
                                ? 'Step 1: Pick up order from store'
                                : 'Step 2: Deliver to customer'}
                        </p>
                    </div>
                </div>
            )}

            {/* Showing both locations legend when in pickup phase */}
            {currentPhase === 'pickup' && customerLocation?.lat && (
                <div className="absolute bottom-48 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Delivery Route</p>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-gray-700">Store (Next)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-gray-700">Customer</span>
                    </div>
                </div>
            )}
        </div>
    );
});

export default RiderNavigationMap;
