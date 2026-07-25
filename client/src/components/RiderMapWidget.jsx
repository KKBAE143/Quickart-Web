import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
    RefreshCw,
    Navigation,
    MapPin,
    Loader2,
    Route,
    Timer
} from 'lucide-react';
import { useGoogleMapsContext } from '../provider/GoogleMapsProvider';
import { calculateDistance, calculateHeading } from '../hooks/useGoogleMaps';
import { useRiderTracking } from '../hooks/useRiderTracking';

/**
 * RiderMapWidget Component
 *
 * Compact map widget for admin grid view with smooth rider animation.
 * Optimized for performance when rendering multiple instances.
 *
 * Features:
 * - Smooth marker animation (Uber/Zomato style)
 * - Real-time location subscription
 * - ETA and distance display
 * - Path trail visualization
 * - Compact footer with key stats
 */
const RiderMapWidget = memo(function RiderMapWidget({
    riderId,
    initialLocation,
    customerLocation,
    storeLocation,
    height = '180px',
    showStats = true,
    onLocationUpdate
}) {
    // Refs
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const riderMarkerRef = useRef(null);
    const customerMarkerRef = useRef(null);
    const pathTrailRef = useRef(null);
    const routeLineRef = useRef(null);
    const animationFrameRef = useRef(null);
    const previousLocationRef = useRef(null);

    // State
    const { isLoaded, loadError } = useGoogleMapsContext();
    const [mapReady, setMapReady] = useState(false);

    // Use isolated rider tracking hook
    const {
        location,
        heading,
        pathHistory,
        isOnline,
        lastUpdate,
        connectionStatus
    } = useRiderTracking(riderId, {
        enablePathHistory: true,
        maxPathPoints: 50,
        onLocationUpdate
    });

    const currentLocation = location || initialLocation;

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
     * Create rider marker icon with rotation
     */
    const createRiderIcon = useCallback((rotationAngle = 0) => {
        if (!window.google) return null;

        return {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
            rotation: rotationAngle,
            anchor: new window.google.maps.Point(0, 2.5)
        };
    }, []);

    /**
     * Initialize Google Map
     */
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        const center = currentLocation || { lat: 28.6139, lng: 77.2090 };

        const map = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'cooperative',
            clickableIcons: false,
            styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] }
            ]
        });

        mapInstanceRef.current = map;

        // Create rider marker
        const riderMarker = new window.google.maps.Marker({
            position: center,
            map,
            icon: createRiderIcon(heading),
            zIndex: 10,
            optimized: false
        });
        riderMarkerRef.current = riderMarker;

        // Create customer marker if available
        if (customerLocation) {
            const customerMarker = new window.google.maps.Marker({
                position: customerLocation,
                map,
                icon: {
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                    fillColor: '#EF4444',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 1.5,
                    anchor: new window.google.maps.Point(12, 24)
                },
                zIndex: 5
            });
            customerMarkerRef.current = customerMarker;

            // Create route line
            const routeLine = new window.google.maps.Polyline({
                path: [center, customerLocation],
                geodesic: true,
                strokeColor: '#3B82F6',
                strokeOpacity: 0,
                icons: [{
                    icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 0.6,
                        strokeColor: '#3B82F6',
                        scale: 2
                    },
                    offset: '0',
                    repeat: '10px'
                }],
                map
            });
            routeLineRef.current = routeLine;

            // Fit bounds
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(center);
            bounds.extend(customerLocation);
            map.fitBounds(bounds, { padding: 30 });
        }

        // Create path trail
        const pathTrail = new window.google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: '#10B981',
            strokeOpacity: 0.4,
            strokeWeight: 3,
            map
        });
        pathTrailRef.current = pathTrail;

        setMapReady(true);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isLoaded, customerLocation, createRiderIcon]);

    /**
     * Update marker position with smooth animation
     */
    useEffect(() => {
        if (!mapReady || !currentLocation || !riderMarkerRef.current) return;

        const prevLoc = previousLocationRef.current;

        if (prevLoc) {
            // Calculate heading and update icon
            const newHeading = calculateHeading(prevLoc, currentLocation);
            riderMarkerRef.current.setIcon(createRiderIcon(newHeading));

            // Animate to new position
            animateMarker(prevLoc, currentLocation);
        } else {
            riderMarkerRef.current.setPosition(
                new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng)
            );
        }

        previousLocationRef.current = currentLocation;

        // Update path trail
        if (pathTrailRef.current && pathHistory.length > 0) {
            pathTrailRef.current.setPath(
                pathHistory.map(p => new window.google.maps.LatLng(p.lat, p.lng))
            );
        }

        // Update route line
        if (routeLineRef.current && customerLocation) {
            routeLineRef.current.setPath([
                new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng),
                new window.google.maps.LatLng(customerLocation.lat, customerLocation.lng)
            ]);
        }

        // Pan map to follow rider
        if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo(currentLocation);
        }
    }, [currentLocation, pathHistory, customerLocation, mapReady, animateMarker, createRiderIcon]);

    // Calculate distance and ETA
    const stats = (() => {
        if (!currentLocation || !customerLocation) return null;

        const dist = calculateDistance(
            currentLocation.lat, currentLocation.lng,
            customerLocation.lat, customerLocation.lng
        );
        const etaMins = Math.ceil((dist / 20) * 60); // Assume 20 km/h

        return {
            distance: dist.toFixed(1),
            eta: etaMins < 1 ? '< 1' : etaMins < 60 ? `${etaMins}` : `${Math.floor(etaMins/60)}h ${etaMins%60}`
        };
    })();

    const lastUpdateText = lastUpdate
        ? lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '--:--';

    return (
        <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ height }}>
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Loading Overlay */}
            {(!isLoaded || !mapReady) && !loadError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            )}

            {/* Error Overlay */}
            {loadError && (
                <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
                    <MapPin size={20} className="text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">Map unavailable</p>
                </div>
            )}

            {/* No Location Overlay */}
            {mapReady && !currentLocation && (
                <div className="absolute inset-0 bg-gray-100/80 flex flex-col items-center justify-center">
                    <Navigation size={20} className="text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">No location</p>
                </div>
            )}

            {/* Live Indicator */}
            {currentLocation && (
                <div className="absolute top-2 left-2">
                    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-green-600">LIVE</span>
                    </div>
                </div>
            )}

            {/* Stats Overlay */}
            {showStats && stats && (
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm px-2 py-1.5">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <Timer size={12} className="text-green-600" />
                            <span className="font-bold text-green-700">{stats.eta}m</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-1">
                            <Route size={12} className="text-gray-500" />
                            <span className="font-medium text-gray-700">{stats.distance}km</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Last Update */}
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <RefreshCw size={8} />
                    {lastUpdateText}
                </div>
            </div>

            {/* Connection Status */}
            <div className={`absolute bottom-2 left-2 w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'
            }`} title={connectionStatus} />
        </div>
    );
});

export default RiderMapWidget;
