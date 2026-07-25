import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaMotorcycle, FaHome, FaPhone, FaSyncAlt } from 'react-icons/fa';
import { MdDeliveryDining, MdLocationOn, MdMyLocation } from 'react-icons/md';
import { useGoogleMaps, geocodeAddress, calculateDistance, calculateHeading, formatETA } from '../hooks/useGoogleMaps';
import { socketService } from '../config/socket';

/**
 * LiveMap Component
 *
 * Real-time rider tracking map using Google Maps.
 * Shows rider location updating in real-time with a moving marker.
 * Displays ETA, distance, and path trail.
 */
const LiveMap = ({ orderId, deliveryAddress, initialAgentLocation }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const riderMarkerRef = useRef(null);
    const customerMarkerRef = useRef(null);
    const pathLineRef = useRef(null);
    const previousLocation = useRef(null);

    const { isLoaded, loadError } = useGoogleMaps();
    const [customerCoordinates, setCustomerCoordinates] = useState(null);
    const [riderLocation, setRiderLocation] = useState(initialAgentLocation || null);
    const [riderHeading, setRiderHeading] = useState(0);
    const [pathHistory, setPathHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [shouldFollowRider, setShouldFollowRider] = useState(true);
    const [riderInfo, setRiderInfo] = useState(null);

    // Geocode delivery address
    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!deliveryAddress) {
                setError('No delivery address provided');
                setLoading(false);
                return;
            }

            if (!isLoaded) return;

            try {
                const result = await geocodeAddress(deliveryAddress);
                setCustomerCoordinates({
                    lat: result.lat,
                    lng: result.lng
                });
            } catch (err) {
                console.error('Geocoding error:', err);
                setError('Unable to load map location');
            } finally {
                setLoading(false);
            }
        };

        fetchCoordinates();
    }, [deliveryAddress, isLoaded]);

    // Create rider marker icon
    const createRiderMarkerIcon = useCallback((heading = 0) => {
        if (!window.google) return null;

        return {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 8,
            rotation: heading,
            anchor: new window.google.maps.Point(0, 2.5)
        };
    }, []);

    // Initialize Google Map
    useEffect(() => {
        if (!isLoaded || !customerCoordinates || !mapRef.current) return;

        // Default center - use rider location if available, otherwise customer
        const defaultRiderLocation = riderLocation || {
            lat: customerCoordinates.lat + 0.005,
            lng: customerCoordinates.lng + 0.005
        };

        const mapOptions = {
            center: defaultRiderLocation,
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        };

        const map = new window.google.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Create customer delivery marker
        const customerIcon = {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#DC2626',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 2,
            anchor: new window.google.maps.Point(12, 24)
        };

        const customerMarker = new window.google.maps.Marker({
            position: customerCoordinates,
            map: map,
            icon: customerIcon,
            title: 'Delivery Location',
            zIndex: 1
        });

        customerMarkerRef.current = customerMarker;

        // Customer info window
        const customerInfoWindow = new window.google.maps.InfoWindow({
            content: `
                <div style="padding: 8px; min-width: 150px;">
                    <h3 style="margin: 0 0 4px 0; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 4px;">
                        🏠 Delivery Location
                    </h3>
                    <p style="margin: 0; font-size: 12px; color: #6B7280;">${deliveryAddress.address_line}</p>
                    <p style="margin: 0; font-size: 12px; color: #6B7280;">${deliveryAddress.city}</p>
                </div>
            `
        });

        customerMarker.addListener('click', () => {
            customerInfoWindow.open(map, customerMarker);
        });

        // Create rider marker
        const riderMarker = new window.google.maps.Marker({
            position: defaultRiderLocation,
            map: map,
            icon: createRiderMarkerIcon(riderHeading),
            title: 'Delivery Partner',
            zIndex: 2,
            animation: window.google.maps.Animation.DROP
        });

        riderMarkerRef.current = riderMarker;

        // Rider info window
        const riderInfoWindow = new window.google.maps.InfoWindow({
            content: `
                <div style="padding: 8px; min-width: 150px;">
                    <h3 style="margin: 0 0 4px 0; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 4px;">
                        🏍️ ${riderInfo?.name || 'Delivery Partner'}
                    </h3>
                    <p style="margin: 0; font-size: 12px; color: #10B981;">On the way to you!</p>
                    ${riderInfo?.phone ? `
                        <a href="tel:${riderInfo.phone}" style="font-size: 12px; color: #10B981; text-decoration: none;">
                            📞 ${riderInfo.phone}
                        </a>
                    ` : ''}
                </div>
            `
        });

        riderMarker.addListener('click', () => {
            riderInfoWindow.open(map, riderMarker);
        });

        // Create path polyline
        const pathLine = new window.google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: '#10B981',
            strokeOpacity: 0.7,
            strokeWeight: 4
        });

        pathLine.setMap(map);
        pathLineRef.current = pathLine;

        // Fit bounds to show both markers
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(customerCoordinates);
        bounds.extend(defaultRiderLocation);
        map.fitBounds(bounds, { padding: 60 });

        // Cleanup
        return () => {
            if (riderMarkerRef.current) riderMarkerRef.current.setMap(null);
            if (customerMarkerRef.current) customerMarkerRef.current.setMap(null);
            if (pathLineRef.current) pathLineRef.current.setMap(null);
        };
    }, [isLoaded, customerCoordinates, createRiderMarkerIcon]);

    // Update rider marker when location changes
    useEffect(() => {
        if (!riderLocation || !riderMarkerRef.current || !mapInstanceRef.current) return;

        const newPosition = new window.google.maps.LatLng(riderLocation.lat, riderLocation.lng);

        // Animate marker to new position
        riderMarkerRef.current.setPosition(newPosition);

        // Update icon rotation based on heading
        riderMarkerRef.current.setIcon(createRiderMarkerIcon(riderHeading));

        // Update path line
        if (pathLineRef.current) {
            const path = pathLineRef.current.getPath();
            path.push(newPosition);

            // Keep only last 100 points for performance
            while (path.getLength() > 100) {
                path.removeAt(0);
            }
        }

        // Pan map to follow rider if enabled
        if (shouldFollowRider) {
            mapInstanceRef.current.panTo(newPosition);
        }
    }, [riderLocation, riderHeading, shouldFollowRider, createRiderMarkerIcon]);

    // Socket listener for real-time rider location
    useEffect(() => {
        if (!orderId) return;

        // Connect to socket if not already connected
        if (!socketService.socket) {
            socketService.connect();
        }

        // Start tracking this order
        socketService.trackOrder(orderId);

        // Handler for rider location updates
        const handleRiderLocationUpdate = (data) => {
            console.log('Rider location update:', data);

            if (data.location && data.location.lat && data.location.lng) {
                const newLocation = {
                    lat: data.location.lat,
                    lng: data.location.lng
                };

                // Calculate heading based on movement
                if (previousLocation.current) {
                    const heading = calculateHeading(previousLocation.current, newLocation);
                    setRiderHeading(heading);
                }

                previousLocation.current = newLocation;
                setRiderLocation(newLocation);
                setLastUpdate(new Date());

                // Update rider info if provided
                if (data.riderName || data.riderPhone) {
                    setRiderInfo({
                        name: data.riderName,
                        phone: data.riderPhone,
                        vehicle: data.vehicleNumber
                    });
                }
            }
        };

        // Listen for location updates
        socketService.on('rider-location-update', handleRiderLocationUpdate);
        socketService.on('order:location-update', handleRiderLocationUpdate);

        // Cleanup
        return () => {
            socketService.untrackOrder(orderId);
            socketService.off('rider-location-update', handleRiderLocationUpdate);
            socketService.off('order:location-update', handleRiderLocationUpdate);
        };
    }, [orderId]);

    // Calculate distance and ETA
    const distance = riderLocation && customerCoordinates
        ? calculateDistance(
            riderLocation.lat,
            riderLocation.lng,
            customerCoordinates.lat,
            customerCoordinates.lng
        )
        : null;

    const eta = distance ? formatETA(distance) : null;

    // Loading state
    if (loading || !isLoaded) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <MdDeliveryDining className="text-green-600 mr-2 text-2xl" />
                    Live Rider Tracking
                </h2>
                <div className="w-full h-72 md:h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="text-4xl text-green-600 animate-spin mx-auto mb-2" />
                        <p className="text-gray-600">Loading live map...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || loadError || !customerCoordinates) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <MdDeliveryDining className="text-green-600 mr-2 text-2xl" />
                    Live Rider Tracking
                </h2>
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center px-4">
                        <MdLocationOn className="text-4xl text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">
                            {error || loadError || 'Unable to load live tracking map'}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                            Your rider is on the way!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header with Live indicator */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <MdDeliveryDining className="text-green-600 mr-2 text-2xl" />
                    Live Rider Tracking
                    <span className="ml-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="ml-1 text-xs font-normal text-green-600">LIVE</span>
                    </span>
                </h2>
                <button
                    onClick={() => setShouldFollowRider(!shouldFollowRider)}
                    className={`p-2 rounded-full transition-colors ${
                        shouldFollowRider
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                    title={shouldFollowRider ? 'Following rider' : 'Click to follow rider'}
                >
                    <MdMyLocation className="text-xl" />
                </button>
            </div>

            {/* ETA and Distance Banner */}
            {distance && (
                <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <FaMotorcycle className="text-white text-lg" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Estimated Arrival</p>
                                <p className="text-lg font-bold text-green-700">{eta}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Distance</p>
                            <p className="text-lg font-bold text-gray-800">
                                {distance.toFixed(1)} km
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div className="relative">
                <div
                    ref={mapRef}
                    className="w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-md border-2 border-green-200"
                    style={{ minHeight: '288px' }}
                />

                {/* Refresh indicator */}
                {lastUpdate && (
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FaSyncAlt className="text-green-500" />
                            <span>Updated: {lastUpdate.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            })}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-green-500"></div>
                    <span>Rider Location</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white">●</span>
                    </div>
                    <span>Your Location</span>
                </div>
            </div>

            {/* Rider Info Card */}
            {riderInfo && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <FaMotorcycle className="text-white" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{riderInfo.name}</p>
                                {riderInfo.vehicle && (
                                    <p className="text-xs text-gray-500">{riderInfo.vehicle}</p>
                                )}
                            </div>
                        </div>
                        {riderInfo.phone && (
                            <a
                                href={`tel:${riderInfo.phone}`}
                                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            >
                                <FaPhone className="text-sm" />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* No rider location notice */}
            {!riderLocation && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 flex items-center">
                        <MdLocationOn className="mr-2 text-yellow-600" />
                        Waiting for rider's live location...
                    </p>
                </div>
            )}
        </div>
    );
};

export default LiveMap;
