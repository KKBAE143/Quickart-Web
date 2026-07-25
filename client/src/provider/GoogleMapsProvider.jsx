import { createContext, useContext, useState, useEffect, useRef } from 'react';

/**
 * Google Maps Provider
 *
 * Provides global Google Maps loading state and ensures the script
 * is loaded once and shared across all map components.
 *
 * Production-level implementation like Blinkit/Zepto/Uber.
 */

const GoogleMapsContext = createContext({
    isLoaded: false,
    loadError: null,
    google: null
});

export const useGoogleMapsContext = () => useContext(GoogleMapsContext);

export const GoogleMapsProvider = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const loadAttemptedRef = useRef(false);

    useEffect(() => {
        // Already loaded
        if (window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        // Prevent duplicate loading
        if (loadAttemptedRef.current) return;
        loadAttemptedRef.current = true;

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            const handleLoad = () => {
                if (window.google?.maps) {
                    setIsLoaded(true);
                }
            };
            existingScript.addEventListener('load', handleLoad);
            // Check immediately in case it's already loaded
            if (window.google?.maps) {
                setIsLoaded(true);
            }
            return;
        }

        // Get API key from environment
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setLoadError('Google Maps API key not configured');
            console.error('VITE_GOOGLE_MAPS_API_KEY is not set in environment variables');
            return;
        }

        // Create and load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            // Wait a tick for google object to be fully available
            setTimeout(() => {
                if (window.google?.maps) {
                    setIsLoaded(true);
                    console.log('Google Maps loaded successfully');
                } else {
                    setLoadError('Google Maps failed to initialize');
                }
            }, 100);
        };

        script.onerror = () => {
            setLoadError('Failed to load Google Maps script');
            console.error('Google Maps script failed to load');
        };

        document.head.appendChild(script);
    }, []);

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError, google: window.google }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export default GoogleMapsProvider;
