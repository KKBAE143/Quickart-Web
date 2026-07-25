import React, { useEffect, useState, useRef } from 'react';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { useGoogleMapsContext } from '../provider/GoogleMapsProvider';
import { geocodeAddress } from '../hooks/useGoogleMaps';

/**
 * DeliveryMap Component
 *
 * Displays a static Google Map showing the delivery address location.
 * Used on order tracking page to show where the order will be delivered.
 */
const DeliveryMap = ({ address }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    const { isLoaded, loadError } = useGoogleMapsContext();
    const [coordinates, setCoordinates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Geocode address when component mounts or address changes
    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!address) {
                setError('No address provided');
                setLoading(false);
                return;
            }

            if (!isLoaded) return;

            try {
                setLoading(true);
                setError(null);

                const result = await geocodeAddress(address);
                setCoordinates({
                    lat: result.lat,
                    lng: result.lng,
                    isApproximate: result.isApproximate
                });

                console.log('Geocoded address:', result);
            } catch (err) {
                console.error('Geocoding error:', err);
                setError(err.message || 'Failed to load map location');
            } finally {
                setLoading(false);
            }
        };

        fetchCoordinates();
    }, [address, isLoaded]);

    // Initialize map when coordinates are available
    useEffect(() => {
        if (!isLoaded || !coordinates || !mapRef.current) return;

        // Create map instance
        const mapOptions = {
            center: { lat: coordinates.lat, lng: coordinates.lng },
            zoom: 16,
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

        // Create custom marker icon
        const markerIcon = {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#DC2626',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 2,
            anchor: new window.google.maps.Point(12, 24)
        };

        // Add marker
        const marker = new window.google.maps.Marker({
            position: { lat: coordinates.lat, lng: coordinates.lng },
            map: map,
            icon: markerIcon,
            animation: window.google.maps.Animation.DROP,
            title: 'Delivery Location'
        });

        markerRef.current = marker;

        // Add info window
        const infoWindowContent = `
            <div style="padding: 8px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 6px;">
                    <span style="color: #DC2626;">📍</span>
                    Delivery Location
                </h3>
                <p style="margin: 0 0 4px 0; font-weight: 500; color: #374151;">${address.address_line || ''}</p>
                <p style="margin: 0 0 4px 0; color: #6B7280;">${address.city}, ${address.state}</p>
                <p style="margin: 0 0 8px 0; color: #6B7280;">${address.pincode || ''}</p>
                ${address.mobile ? `
                    <a href="tel:${address.mobile}" style="color: #DC2626; font-weight: 500; text-decoration: none;">
                        📞 ${address.mobile}
                    </a>
                ` : ''}
                ${coordinates.isApproximate ? `
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #F59E0B;">
                        ⚠️ Approximate location
                    </p>
                ` : ''}
            </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
            content: infoWindowContent
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        // Add delivery radius circle
        new window.google.maps.Circle({
            strokeColor: '#DC2626',
            strokeOpacity: 0.3,
            strokeWeight: 2,
            fillColor: '#DC2626',
            fillOpacity: 0.1,
            map: map,
            center: { lat: coordinates.lat, lng: coordinates.lng },
            radius: 200 // 200 meters radius
        });

        return () => {
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }
        };
    }, [coordinates, isLoaded, address]);

    // Loading state
    if (loading || !isLoaded) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <FaMapMarkerAlt className="text-red-600 mr-2" />
                    Delivery Location Map
                </h2>
                <div className="w-full h-64 md:h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="text-4xl text-red-600 animate-spin mx-auto mb-2" />
                        <p className="text-gray-600">Loading map...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || loadError || !coordinates) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <FaMapMarkerAlt className="text-red-600 mr-2" />
                    Delivery Location Map
                </h2>
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center px-4">
                        <FaMapMarkerAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">
                            {error || loadError || 'Unable to load map for this address'}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                            Don't worry, your delivery will still arrive!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaMapMarkerAlt className="text-red-600 mr-2" />
                Delivery Location Map
            </h2>

            {/* Map Container */}
            <div
                ref={mapRef}
                className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-md border-2 border-gray-200"
                style={{ minHeight: '256px' }}
            />

            {/* Map Info */}
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-gray-700 flex items-start">
                    <FaMapMarkerAlt className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                        Your order will be delivered to the location marked on the map.
                        <span className="font-semibold text-red-600"> Click the marker</span> to see full address details.
                    </span>
                </p>
            </div>

            {/* Get Directions Button */}
            <div className="mt-3">
                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 text-sm font-medium"
                >
                    <FaMapMarkerAlt className="mr-2" />
                    Get Directions
                </a>
            </div>
        </div>
    );
};

export default DeliveryMap;
