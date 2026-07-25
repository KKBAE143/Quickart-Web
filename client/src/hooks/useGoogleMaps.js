import { useState, useEffect, useCallback, useRef } from 'react';

// Try to import the context, but provide fallback if not wrapped in provider
let useGoogleMapsContext;
try {
    const context = require('../provider/GoogleMapsProvider');
    useGoogleMapsContext = context.useGoogleMapsContext;
} catch (e) {
    useGoogleMapsContext = null;
}

/**
 * Custom hook for Google Maps initialization and geocoding
 * Provides map instance management and address geocoding utilities
 *
 * This hook checks if GoogleMapsProvider is available and uses it,
 * otherwise falls back to standalone loading.
 */
export function useGoogleMaps() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const loadAttemptedRef = useRef(false);

    useEffect(() => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }

        // Prevent duplicate loading attempts
        if (loadAttemptedRef.current) return;
        loadAttemptedRef.current = true;

        // Check for existing script
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            const handleLoad = () => {
                if (window.google?.maps) {
                    setIsLoaded(true);
                }
            };
            existingScript.addEventListener('load', handleLoad);
            // Check if already loaded
            if (window.google?.maps) setIsLoaded(true);
            return;
        }

        // Load script if not exists
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setLoadError('Google Maps API key not configured');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setTimeout(() => {
                if (window.google?.maps) {
                    setIsLoaded(true);
                } else {
                    setLoadError('Google Maps failed to initialize');
                }
            }, 100);
        };

        script.onerror = () => {
            setLoadError('Failed to load Google Maps script');
        };

        document.head.appendChild(script);
    }, []);

    return { isLoaded, loadError };
}

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 */
export async function geocodeAddress(address) {
    if (!window.google || !window.google.maps) {
        throw new Error('Google Maps not loaded');
    }

    const geocoder = new window.google.maps.Geocoder();

    // Build address string
    const addressParts = [];
    if (address.address_line) addressParts.push(address.address_line);
    if (address.city) addressParts.push(address.city);
    if (address.state) addressParts.push(address.state);
    if (address.pincode) addressParts.push(address.pincode);
    if (address.country) addressParts.push(address.country);

    const addressString = addressParts.join(', ');

    return new Promise((resolve, reject) => {
        geocoder.geocode({ address: addressString }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                resolve({
                    lat: location.lat(),
                    lng: location.lng(),
                    formattedAddress: results[0].formatted_address
                });
            } else {
                // Try with just city and state as fallback
                const fallbackAddress = [address.city, address.state, address.country]
                    .filter(Boolean)
                    .join(', ');

                geocoder.geocode({ address: fallbackAddress }, (fallbackResults, fallbackStatus) => {
                    if (fallbackStatus === 'OK' && fallbackResults[0]) {
                        const location = fallbackResults[0].geometry.location;
                        resolve({
                            lat: location.lat(),
                            lng: location.lng(),
                            formattedAddress: fallbackResults[0].formatted_address,
                            isApproximate: true
                        });
                    } else {
                        reject(new Error('Unable to geocode address'));
                    }
                });
            }
        });
    });
}

/**
 * Calculate distance between two points in km
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    if (window.google && window.google.maps && window.google.maps.geometry) {
        const point1 = new window.google.maps.LatLng(lat1, lng1);
        const point2 = new window.google.maps.LatLng(lat2, lng2);
        return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 1000;
    }

    // Fallback calculation using Haversine formula
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Calculate heading/bearing between two points
 */
export function calculateHeading(from, to) {
    if (window.google && window.google.maps && window.google.maps.geometry) {
        const point1 = new window.google.maps.LatLng(from.lat, from.lng);
        const point2 = new window.google.maps.LatLng(to.lat, to.lng);
        return window.google.maps.geometry.spherical.computeHeading(point1, point2);
    }

    // Fallback calculation
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/**
 * Format ETA based on distance
 */
export function formatETA(distanceKm) {
    // Assume average speed of 20 km/h in city traffic
    const minutes = Math.ceil((distanceKm / 20) * 60);
    if (minutes < 1) return 'Arriving now!';
    if (minutes === 1) return '1 min away';
    if (minutes < 60) return `${minutes} mins away`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m away`;
}

/**
 * Create custom marker icon for Google Maps
 */
export function createCustomMarker(type, heading = 0) {
    if (!window.google || !window.google.maps) return null;

    const icons = {
        rider: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
            rotation: heading,
            anchor: new window.google.maps.Point(0, 2.5)
        },
        delivery: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#DC2626',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 2,
            anchor: new window.google.maps.Point(12, 24)
        },
        store: {
            path: 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z',
            fillColor: '#2563EB',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1,
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 12)
        }
    };

    return icons[type] || icons.delivery;
}

export default useGoogleMaps;
