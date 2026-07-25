import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
    Phone,
    MessageCircle,
    Navigation,
    MapPin,
    Clock,
    Bike,
    Package,
    Store,
    User,
    Star,
    Share2,
    Shield,
    Loader2,
    RefreshCw,
    ChevronUp,
    ChevronDown,
    X
} from 'lucide-react';
import { useGoogleMapsContext } from '../provider/GoogleMapsProvider';
import { geocodeAddress, calculateDistance, calculateHeading } from '../hooks/useGoogleMaps';
import { socketService } from '../config/socket';

/**
 * LiveTrackingMap Component
 *
 * Production-level live rider tracking map similar to Zomato, Uber, Blinkit, Zepto.
 *
 * Features:
 * - Smooth marker animation with interpolation (no jumping)
 * - Custom rider icon with real-time rotation based on heading
 * - Animated route polyline with dashed pattern
 * - Live ETA and distance updates
 * - Rider info card with call/chat actions
 * - Delivery status timeline
 * - Pulsing "LIVE" indicator
 * - Path trail visualization
 */
const LiveTrackingMap = memo(function LiveTrackingMap({
    orderId,
    deliveryAddress,
    storeLocation,
    initialRiderLocation,
    riderInfo,
    orderStatus,
    onCall,
    onChat,
    onShare,
    variant = 'customer', // 'customer' | 'admin'
    showRiderCard = true,
    showStatusBar = true,
    height = '400px',
    className = ''
}) {
    // Refs
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const riderMarkerRef = useRef(null);
    const customerMarkerRef = useRef(null);
    const storeMarkerRef = useRef(null);
    const routePolylineRef = useRef(null);
    const pathTrailRef = useRef(null);
    const animationFrameRef = useRef(null);
    const previousLocationRef = useRef(null);

    // State
    const { isLoaded, loadError } = useGoogleMapsContext();
    const [customerCoords, setCustomerCoords] = useState(null);
    const [riderLocation, setRiderLocation] = useState(initialRiderLocation || null);
    const [riderHeading, setRiderHeading] = useState(0);
    const [pathHistory, setPathHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isCardExpanded, setIsCardExpanded] = useState(true);
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);

    // Animation state for smooth marker movement
    const animationState = useRef({
        startPosition: null,
        endPosition: null,
        startTime: null,
        duration: 1000 // Animation duration in ms
    });

    /**
     * Smooth marker animation using linear interpolation
     * This is how Uber/Zomato achieve smooth movement
     */
    const animateMarker = useCallback((startPos, endPos) => {
        if (!riderMarkerRef.current || !mapInstanceRef.current) return;

        // Cancel any ongoing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const start = performance.now();
        const duration = animationState.current.duration;

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth deceleration (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            // Interpolate position
            const lat = startPos.lat + (endPos.lat - startPos.lat) * easeProgress;
            const lng = startPos.lng + (endPos.lng - startPos.lng) * easeProgress;

            const newPosition = new window.google.maps.LatLng(lat, lng);
            riderMarkerRef.current.setPosition(newPosition);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    }, []);

    /**
     * Create custom rider marker icon (bike/scooter style)
     */
    const createRiderIcon = useCallback((heading = 0, isActive = true) => {
        if (!window.google) return null;

        // SVG path for a delivery bike/scooter icon
        const bikePath = 'M19.15 8a2 2 0 0 0-1.72-1H15V5h-2v2H9V5H7v2h-.43a2 2 0 0 0-1.72 1L3 12v8h2v-2h14v2h2v-8l-1.85-4zM6 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm12 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z';

        return {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: isActive ? '#10B981' : '#6B7280',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 8,
            rotation: heading,
            anchor: new window.google.maps.Point(0, 2.5)
        };
    }, []);

    /**
     * Create pulsing circle overlay for rider marker
     */
    const createPulsingCircle = useCallback((position) => {
        if (!window.google || !mapInstanceRef.current) return null;

        return new window.google.maps.Circle({
            strokeColor: '#10B981',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#10B981',
            fillOpacity: 0.15,
            map: mapInstanceRef.current,
            center: position,
            radius: 50,
        });
    }, []);

    /**
     * Create animated dashed route polyline
     */
    const createRoutePolyline = useCallback((path, isActive = true) => {
        if (!window.google || !mapInstanceRef.current) return null;

        return new window.google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: isActive ? '#3B82F6' : '#9CA3AF',
            strokeOpacity: 0,
            icons: [{
                icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: isActive ? 1 : 0.5,
                    strokeColor: isActive ? '#3B82F6' : '#9CA3AF',
                    scale: 3
                },
                offset: '0',
                repeat: '12px'
            }],
            map: mapInstanceRef.current
        });
    }, []);

    /**
     * Geocode delivery address
     */
    useEffect(() => {
        const fetchCoords = async () => {
            if (!deliveryAddress || !isLoaded) return;

            try {
                const result = await geocodeAddress(deliveryAddress);
                setCustomerCoords({ lat: result.lat, lng: result.lng });
            } catch (err) {
                console.error('Geocoding error:', err);
                setError('Unable to locate delivery address');
            } finally {
                setLoading(false);
            }
        };

        fetchCoords();
    }, [deliveryAddress, isLoaded]);

    /**
     * Initialize Google Map
     */
    useEffect(() => {
        if (!isLoaded || !customerCoords || !mapRef.current || mapInstanceRef.current) return;

        // Default center - rider location if available, otherwise customer
        const defaultCenter = riderLocation || customerCoords;

        const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'transit',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        mapInstanceRef.current = map;

        // Create customer marker (destination)
        const customerMarker = new window.google.maps.Marker({
            position: customerCoords,
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
            title: 'Delivery Location',
            zIndex: 2
        });
        customerMarkerRef.current = customerMarker;

        // Create store marker if available
        if (storeLocation) {
            const storeMarker = new window.google.maps.Marker({
                position: storeLocation,
                map,
                icon: {
                    path: 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z',
                    fillColor: '#F59E0B',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 1.5,
                    scale: 1.8,
                    anchor: new window.google.maps.Point(12, 12)
                },
                title: 'Store Location',
                zIndex: 1
            });
            storeMarkerRef.current = storeMarker;
        }

        // Create rider marker
        const riderPos = riderLocation || {
            lat: customerCoords.lat + 0.003,
            lng: customerCoords.lng + 0.003
        };

        const riderMarker = new window.google.maps.Marker({
            position: riderPos,
            map,
            icon: createRiderIcon(riderHeading, true),
            title: riderInfo?.name || 'Delivery Partner',
            zIndex: 10,
            optimized: false // Required for smooth animation
        });
        riderMarkerRef.current = riderMarker;

        // Create path trail polyline
        const pathTrail = new window.google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: '#10B981',
            strokeOpacity: 0.4,
            strokeWeight: 4,
            map
        });
        pathTrailRef.current = pathTrail;

        // Create route to destination
        if (riderLocation) {
            const routePath = [riderPos, customerCoords];
            const routeLine = createRoutePolyline(routePath, true);
            routePolylineRef.current = routeLine;
        }

        // Fit bounds to show all markers
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(customerCoords);
        if (riderLocation) bounds.extend(riderLocation);
        if (storeLocation) bounds.extend(storeLocation);
        map.fitBounds(bounds, { padding: 60 });

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isLoaded, customerCoords, storeLocation, createRiderIcon, createRoutePolyline]);

    /**
     * Update rider marker when location changes (with smooth animation)
     */
    useEffect(() => {
        if (!riderLocation || !riderMarkerRef.current || !mapInstanceRef.current) return;

        const prevLoc = previousLocationRef.current;
        const newLoc = riderLocation;

        // Calculate heading from movement
        if (prevLoc) {
            const heading = calculateHeading(prevLoc, newLoc);
            setRiderHeading(heading);
            riderMarkerRef.current.setIcon(createRiderIcon(heading, true));

            // Smooth animation to new position
            animateMarker(prevLoc, newLoc);
        } else {
            // First location - just set it
            riderMarkerRef.current.setPosition(
                new window.google.maps.LatLng(newLoc.lat, newLoc.lng)
            );
        }

        previousLocationRef.current = newLoc;

        // Update path trail
        if (pathTrailRef.current) {
            setPathHistory(prev => {
                const updated = [...prev, newLoc];
                const trail = updated.slice(-100); // Keep last 100 points
                pathTrailRef.current.setPath(
                    trail.map(p => new window.google.maps.LatLng(p.lat, p.lng))
                );
                return trail;
            });
        }

        // Update route polyline
        if (routePolylineRef.current && customerCoords) {
            routePolylineRef.current.setPath([
                new window.google.maps.LatLng(newLoc.lat, newLoc.lng),
                new window.google.maps.LatLng(customerCoords.lat, customerCoords.lng)
            ]);
        }

        // Calculate ETA and distance
        if (customerCoords) {
            const dist = calculateDistance(newLoc.lat, newLoc.lng, customerCoords.lat, customerCoords.lng);
            setDistance(dist);
            // Assume 20 km/h average speed
            const etaMinutes = Math.ceil((dist / 20) * 60);
            setEta(etaMinutes);
        }

        setLastUpdate(new Date());
    }, [riderLocation, customerCoords, createRiderIcon, animateMarker]);

    /**
     * Socket listener for real-time location updates
     */
    useEffect(() => {
        if (!orderId) return;

        // Ensure socket is connected
        if (!socketService.socket?.connected) {
            socketService.connect();
        }

        // Track this order
        socketService.trackOrder(orderId);

        const handleLocationUpdate = (data) => {
            const loc = data.location || { lat: data.lat, lng: data.lng };
            if (loc?.lat && loc?.lng) {
                setRiderLocation(loc);
            }
        };

        socketService.on('rider-location-update', handleLocationUpdate);
        socketService.on('order:location-update', handleLocationUpdate);
        socketService.on('update-delivery-location', handleLocationUpdate);

        return () => {
            socketService.untrackOrder(orderId);
            socketService.off('rider-location-update', handleLocationUpdate);
            socketService.off('order:location-update', handleLocationUpdate);
            socketService.off('update-delivery-location', handleLocationUpdate);
        };
    }, [orderId]);

    /**
     * Format ETA display
     */
    const formatEtaDisplay = (minutes) => {
        if (!minutes) return '--';
        if (minutes < 1) return 'Arriving!';
        if (minutes === 1) return '1 min';
        if (minutes < 60) return `${minutes} mins`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    /**
     * Get status message based on order status
     */
    const getStatusMessage = () => {
        switch (orderStatus?.toUpperCase()) {
            case 'CONFIRMED':
                return 'Order confirmed, preparing soon...';
            case 'PROCESSING':
                return 'Your order is being prepared';
            case 'READY':
                return 'Order ready for pickup';
            case 'PICKED_UP':
            case 'OUT_FOR_DELIVERY':
                return 'Rider is on the way to you';
            case 'REACHED':
                return 'Rider has reached your location';
            case 'DELIVERED':
                return 'Order delivered successfully!';
            default:
                return 'Tracking your order...';
        }
    };

    // Loading state
    if (loading || !isLoaded) {
        return (
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`} style={{ height }}>
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                    <Loader2 size={36} className="animate-spin text-green-600 mb-3" />
                    <p className="text-gray-600 font-medium">Loading live map...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || loadError) {
        return (
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`} style={{ height }}>
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <MapPin size={28} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">Unable to load map</p>
                    <p className="text-gray-500 text-sm text-center">{error || loadError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden relative ${className}`}>
            {/* Live Indicator Badge */}
            <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-100">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-600 tracking-wide">LIVE</span>
                </div>
            </div>

            {/* ETA Badge */}
            {eta && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Arriving in</p>
                        <p className="text-xl font-bold text-gray-900">{formatEtaDisplay(eta)}</p>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div ref={mapRef} className="w-full" style={{ height }} />

            {/* Status Bar */}
            {showStatusBar && (
                <div className="absolute bottom-0 left-0 right-0 z-10">
                    {/* Status Message Bar */}
                    <div className="bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4 px-4">
                        <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                        <Bike size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-300">{getStatusMessage()}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {distance && (
                                                <span className="text-white font-semibold">
                                                    {distance.toFixed(1)} km away
                                                </span>
                                            )}
                                            {lastUpdate && (
                                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                                    <RefreshCw size={10} />
                                                    {lastUpdate.toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2">
                                    {onCall && (
                                        <button
                                            onClick={() => onCall(riderInfo?.phone)}
                                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                                        >
                                            <Phone size={18} className="text-white" />
                                        </button>
                                    )}
                                    {onChat && (
                                        <button
                                            onClick={onChat}
                                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                                        >
                                            <MessageCircle size={18} className="text-white" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rider Info Card (Expandable) */}
            {showRiderCard && riderInfo && (
                <div className={`absolute left-4 right-4 z-20 transition-all duration-300 ${
                    showStatusBar ? 'bottom-28' : 'bottom-4'
                }`}>
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Card Header */}
                        <button
                            onClick={() => setIsCardExpanded(!isCardExpanded)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {/* Rider Avatar */}
                                <div className="relative">
                                    {riderInfo.avatar ? (
                                        <img
                                            src={riderInfo.avatar}
                                            alt={riderInfo.name}
                                            className="w-12 h-12 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                            <User size={20} className="text-green-600" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                </div>

                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900">{riderInfo.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        {riderInfo.rating && (
                                            <span className="flex items-center gap-0.5">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                {riderInfo.rating.toFixed(1)}
                                            </span>
                                        )}
                                        {riderInfo.vehicleNumber && (
                                            <span className="text-gray-400">• {riderInfo.vehicleNumber}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
                                    <Shield size={12} className="text-green-600" />
                                    <span className="text-xs text-green-700 font-medium">Verified</span>
                                </div>
                                {isCardExpanded ? (
                                    <ChevronDown size={20} className="text-gray-400" />
                                ) : (
                                    <ChevronUp size={20} className="text-gray-400" />
                                )}
                            </div>
                        </button>

                        {/* Expanded Content */}
                        {isCardExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onCall?.(riderInfo.phone)}
                                        className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                                    >
                                        <Phone size={18} />
                                        Call Rider
                                    </button>
                                    <button
                                        onClick={onChat}
                                        className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                        Chat
                                    </button>
                                </div>

                                {riderInfo.phone && (
                                    <p className="text-center text-sm text-gray-500 mt-3">
                                        {riderInfo.phone}
                                    </p>
                                )}

                                {onShare && (
                                    <button
                                        onClick={onShare}
                                        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <Share2 size={16} />
                                        Share Live Location
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* No Rider Location Notice */}
            {!riderLocation && (
                <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Navigation size={20} className="text-yellow-600" />
                            </div>
                            <div>
                                <p className="font-medium text-yellow-800">Waiting for rider location</p>
                                <p className="text-sm text-yellow-600">Location will appear once rider starts delivery</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default LiveTrackingMap;
