import { useState, useEffect, useRef } from 'react'
import { useForm } from "react-hook-form"
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { 
    X,
    MapPin,
    Home,
    Briefcase,
    Map,
    Phone,
    Search,
    Loader2,
    Wifi,
    Globe,
    Satellite
} from "lucide-react";
import { useGlobalContext } from '../provider/GlobalProvider'
import {
    detectLocationWithPriority,
    LOCATION_METHODS,
    generatePlusCode,
    getAccuracyLevel,
    ACCURACY_THRESHOLDS
} from '../utils/LocationService'

const AddAddress = ({close}) => {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()
    const { fetchAddress } = useGlobalContext()
    
    const [loadingLocation, setLoadingLocation] = useState(false)
    const [addressType, setAddressType] = useState('HOME')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
    const [mapCenter, setMapCenter] = useState({ lat: 17.4485, lng: 78.3908 }) // Hyderabad default
    const [showMap, setShowMap] = useState(false)
    const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false)
    const [showGpsPrompt, setShowGpsPrompt] = useState(false) // Show when GPS denied but got fallback location

    // Location data state for saving with address
    const [locationData, setLocationData] = useState({
        latitude: null,
        longitude: null,
        accuracy: null,
        method: null,
        plusCode: null,
        confidence: null
    })
    
    const searchInputRef = useRef(null)
    const autocompleteRef = useRef(null)
    const mapRef = useRef(null)
    const markerRef = useRef(null)

    // Load Google Maps JavaScript API
    useEffect(() => {
        const loadGoogleMaps = () => {
            // Check if already loaded with Places
            if (window.google && window.google.maps && window.google.maps.places) {
                setGoogleMapsLoaded(true);
                console.log('✅ Google Maps already loaded with Places');
                return;
            }

            // Check if script is already being loaded
            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                console.log('⏳ Google Maps script already loading...');
                const checkPlaces = setInterval(() => {
                    if (window.google && window.google.maps && window.google.maps.places) {
                        clearInterval(checkPlaces);
                        setGoogleMapsLoaded(true);
                        console.log('✅ Google Maps loaded from existing script');
                    }
                }, 100);
                // Timeout after 10s
                setTimeout(() => clearInterval(checkPlaces), 10000);
                return;
            }

            const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            
            if (!GOOGLE_MAPS_API_KEY) {
                console.error('⚠️ Google Maps API key not found in environment variables');
                toast.error("Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file", {
                    duration: 6000
                });
                return;
            }

            // Create script element with async loading for better performance
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&loading=async&language=en`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                // Wait for Places library to be available
                let isLoaded = false;
                const checkPlaces = setInterval(() => {
                    if (window.google && window.google.maps && window.google.maps.places) {
                        clearInterval(checkPlaces);
                        if (!isLoaded) {
                            isLoaded = true;
                            setGoogleMapsLoaded(true);
                            console.log('✅ Google Maps API loaded successfully with Places');
                        }
                    }
                }, 50);
                // Fallback: set loaded anyway after 2s
                setTimeout(() => {
                    clearInterval(checkPlaces);
                    if (!isLoaded) {
                        isLoaded = true;
                        setGoogleMapsLoaded(true);
                        console.log('✅ Google Maps API loaded (Places may still be loading)');
                    }
                }, 2000);
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Google Maps API');
                toast.error("Failed to load Google Maps. Please check your internet connection.", {
                    duration: 6000
                });
            };
            
            document.head.appendChild(script);
        };

        loadGoogleMaps();
    }, []);

    // Initialize Places Autocomplete
    useEffect(() => {
        if (!googleMapsLoaded || !searchInputRef.current) return;
        
        // Check if Places library is available
        if (!window.google?.maps?.places?.Autocomplete) {
            console.warn('⏳ Places library not yet available, retrying...');
            const retryTimeout = setTimeout(() => {
                if (window.google?.maps?.places?.Autocomplete) {
                    initAutocomplete();
                } else {
                    console.error('❌ Places library failed to load');
                }
            }, 1000);
            return () => clearTimeout(retryTimeout);
        }
        
        initAutocomplete();
        
        function initAutocomplete() {
            try {
                // Create autocomplete instance
                const autocomplete = new window.google.maps.places.Autocomplete(
                    searchInputRef.current,
                    {
                        componentRestrictions: { country: 'in' }, // Restrict to India
                        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
                        types: ['address'] // Focus on full addresses
                    }
                );

                // Listen for place selection
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    
                    if (!place.geometry) {
                        toast.error("No address details found for the selected location");
                        return;
                    }

                    handlePlaceSelect(place);
                });

                autocompleteRef.current = autocomplete;
                console.log('✅ Google Places Autocomplete initialized');
            } catch (error) {
                console.error('Error initializing Places Autocomplete:', error);
            }
        }
    }, [googleMapsLoaded]);

    // Handle place selection from autocomplete
    const handlePlaceSelect = (place) => {
        try {
            let street = '';
            let locality = '';
            let city = '';
            let state = '';
            let country = '';
            let pincode = '';
            
            // Extract address components
            place.address_components?.forEach(component => {
                const types = component.types;
                
                if (types.includes('street_number') || types.includes('premise')) {
                    street = component.long_name + ' ' + street;
                }
                if (types.includes('route') || types.includes('street_address')) {
                    street += component.long_name;
                }
                if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
                    locality = component.long_name;
                }
                if (types.includes('locality')) {
                    city = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                    state = component.long_name;
                }
                if (types.includes('country')) {
                    country = component.long_name;
                }
                if (types.includes('postal_code')) {
                    pincode = component.long_name;
                }
            });

            // Build complete address line (for Area/Locality field)
            const addressLine = [locality, city, state].filter(Boolean).join(', ');

            // Auto-fill form fields
            setValue('addressline', addressLine || place.formatted_address);
            setValue('city', city);
            setValue('state', state);
            setValue('country', country || 'India');
            setValue('pincode', pincode);
            
            // Store coordinates and show map
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Generate Plus Code for building-level precision
            const plusCode = generatePlusCode(lat, lng);

            setSelectedLocation({
                lat,
                lng,
                displayName: locality || city,
                formattedAddress: addressLine || place.formatted_address
            });
            setMapCenter({ lat, lng });
            setShowMap(true);

            // Store location data for saving - autocomplete = high accuracy from Google
            setLocationData({
                latitude: lat,
                longitude: lng,
                accuracy: 20, // Autocomplete selection is very accurate
                method: 'gps',
                plusCode: plusCode,
                confidence: { level: 'high', score: 90 }
            });
            
            // Clear search
            setSearchQuery('');
            
            // Show success message
            toast.success(`Address selected: ${city}, ${state}`, {
                duration: 4000
            });
            
            console.log('📍 Address selected:', { city, state, pincode });
        } catch (error) {
            console.error('Error processing place selection:', error);
            toast.error("Failed to process selected address. Please try again.");
        }
    };

    // Show pre-permission modal before requesting location
    const handleUseMyLocation = () => {
        if (!googleMapsLoaded) {
            toast.error("Google Maps is still loading. Please wait a moment.", { duration: 3000 });
            return;
        }
        setShowLocationPermissionModal(true);
    };

    // Called when user confirms in pre-permission modal
    const handleConfirmLocationAccess = () => {
        setShowLocationPermissionModal(false);
        detectCurrentLocation();
    };

    // Detect user's current location using LocationService (Industry Standard)
    // Priority: GPS > WiFi Triangulation > IP Geolocation
    const detectCurrentLocation = async () => {
        if (!googleMapsLoaded) {
            toast.error("Google Maps is still loading. Please wait a moment and try again.", {
                duration: 5000
            });
            return;
        }

        setLoadingLocation(true);
        const loadingToast = toast.loading("Detecting location...");

        try {
            // Use LocationService with priority chain: GPS > WiFi > IP
            const locationData = await detectLocationWithPriority({
                googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                gpsTimeout: 20000, // 20 seconds for mobile GPS to get a good fix
                enableHighAccuracy: true,
                useCache: false // Always get fresh location when user clicks button
            });

            // Log detection method (console only, no toast spam)
            console.log(`📍 Location method: ${locationData.method}`);
            console.log(`🎯 Accuracy: ±${Math.round(locationData.accuracy)}m`);

            // Convert to format expected by geocodeAndSetLocation
            const formattedLocation = {
                latitude: locationData.lat,
                longitude: locationData.lng,
                accuracy: locationData.accuracy,
                isIPBased: locationData.method === LOCATION_METHODS.IP,
                method: locationData.method,
                plusCode: locationData.plusCode,
                confidence: locationData.confidence
            };

            // Store location data for saving with address
            setLocationData({
                latitude: locationData.lat,
                longitude: locationData.lng,
                accuracy: locationData.accuracy,
                method: locationData.method,
                plusCode: locationData.plusCode || generatePlusCode(locationData.lat, locationData.lng),
                confidence: locationData.confidence
            });

            // Geocode the location (this will show the success message)
            await geocodeAndSetLocation(formattedLocation, loadingToast);

        } catch (error) {
            toast.dismiss(loadingToast);
            setLoadingLocation(false);
            
            console.error("Location detection error:", error);
            
            // Show user-friendly error with guidance
            if (error.message?.includes('permission') || error.message?.includes('denied')) {
                toast.error(
                    "📍 Location access blocked!\n\nTo get accurate location:\n• Click the 🔒 icon in address bar\n• Allow location access\n• Or search for your address below", 
                    { duration: 8000 }
                );
            } else {
                toast.error("Couldn't detect location. Please search for your address or enable location permissions.", {
                    duration: 6000
                });
            }
        }
    };

    // Helper function to geocode and set location
    const geocodeAndSetLocation = async (locationData, loadingToast) => {
        const { latitude, longitude, accuracy, isIPBased } = locationData;
        
        try {
            // Use Google Maps Geocoding API
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };
                
            geocoder.geocode({ location: latlng }, (results, status) => {
                toast.dismiss(loadingToast);
                setLoadingLocation(false);
                
                if (status === 'OK' && results[0]) {
                    const place = results[0];
                    
                    let street = '';
                    let locality = '';
                    let city = '';
                    let state = '';
                    let country = '';
                    let pincode = '';
                    
                    // Extract address components with Indian address priority
                    place.address_components?.forEach(component => {
                        const types = component.types;
                        
                        // Street/Road name
                        if (types.includes('route')) {
                            street = component.long_name;
                        }
                        // Building number/name (highest priority)
                        if (types.includes('premise') || types.includes('subpremise') || types.includes('street_number')) {
                            street = component.long_name + (street ? ', ' + street : '');
                        }
                        // Locality/Area (Indian format priority)
                        if (types.includes('sublocality_level_2') || types.includes('sublocality_level_3')) {
                            locality = component.long_name; // Most specific
                        }
                        if (!locality && (types.includes('sublocality') || types.includes('sublocality_level_1'))) {
                            locality = component.long_name;
                        }
                        if (!locality && types.includes('neighborhood')) {
                            locality = component.long_name;
                        }
                        // City (multiple fallbacks for suburbs)
                        if (types.includes('locality')) {
                            city = component.long_name;
                        }
                        if (!city && types.includes('administrative_area_level_2')) {
                            city = component.long_name; // District fallback
                        }
                        // State
                        if (types.includes('administrative_area_level_1')) {
                            state = component.long_name;
                        }
                        // Country
                        if (types.includes('country')) {
                            country = component.long_name;
                        }
                        // Pincode
                        if (types.includes('postal_code')) {
                            pincode = component.long_name;
                        }
                    });

                    // Build complete address line for Area/Locality field
                    const addressLine = [locality, city, state].filter(Boolean).join(', ');

                    // Auto-fill form fields
                    setValue('addressline', addressLine || place.formatted_address);
                    setValue('city', city);
                    setValue('state', state);
                    setValue('country', country || 'India');
                    setValue('pincode', pincode);
                    
                    setSelectedLocation({ 
                        lat: latitude, 
                        lng: longitude,
                        displayName: locality || city || 'Current Location',
                        formattedAddress: addressLine || place.formatted_address
                    });
                    setMapCenter({ lat: latitude, lng: longitude });
                    setShowMap(true);
                    
                    // Show ONE clean success message
                    if (city && state) {
                        const needsAdjust = isIPBased || accuracy > 200;
                        const msg = needsAdjust ? `${city}, ${state} - Drag pin to adjust` : `${city}, ${state}`;
                        toast.success(msg, { duration: 3000 });
                        console.log(`✅ Location: ${city}, ${state}, ${pincode}`);
                        console.log(`📐 Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        console.log(`🎯 Accuracy: ${isIPBased ? 'IP-based (~5km)' : `±${Math.round(accuracy)}m`}`);
                        
                        // Show GPS prompt if accuracy is poor (>500m)
                        if (accuracy > 500) {
                            setShowGpsPrompt(true);
                        } else {
                            setShowGpsPrompt(false);
                        }
                    } else {
                        toast.success("Location detected!", { duration: 3000 });
                    }
                } else {
                    toast.error('Failed to get address. Please try searching or enter manually.', {
                        duration: 6000
                    });
                    console.error('Geocoding failed:', status);
                }
            });
        } catch (error) {
            toast.dismiss(loadingToast);
            setLoadingLocation(false);
            console.error("Geocoding error:", error);
            toast.error("Couldn't get address details. Please try searching instead.", {
                duration: 6000
            });
        }
    };

    // Initialize Google Map
    useEffect(() => {
        if (!googleMapsLoaded || !showMap || !selectedLocation) return

        // Create map
        const map = new window.google.maps.Map(document.getElementById('location-map'), {
            center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
            zoom: 17,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        })

        // Create draggable marker
        const marker = new window.google.maps.Marker({
            position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
            map: map,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3" fill="#DC2626"></circle>
                    </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 40)
            }
        })

        mapRef.current = map
        markerRef.current = marker

        // Handle marker drag end
        marker.addListener('dragend', () => {
            const position = marker.getPosition()
            geocodeLocation(position.lat(), position.lng())
        })

        // Handle map center button
        const centerButton = document.getElementById('center-map-button')
        if (centerButton) {
            centerButton.onclick = () => {
                detectCurrentLocation()
            }
        }
    }, [googleMapsLoaded, showMap, selectedLocation])

    // Geocode location and update form (industry-level accuracy)
    const geocodeLocation = async (lat, lng) => {
        try {
            const geocoder = new window.google.maps.Geocoder()
            const latlng = { lat, lng }

            geocoder.geocode({ location: latlng }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const place = results[0]

                    let street = ''
                    let locality = ''
                    let city = ''
                    let state = ''
                    let country = ''
                    let pincode = ''

                    place.address_components?.forEach(component => {
                        const types = component.types

                        // Street/Road name
                        if (types.includes('route')) {
                            street = component.long_name
                        }
                        // Building number/name (highest priority)
                        if (types.includes('premise') || types.includes('subpremise') || types.includes('street_number')) {
                            street = component.long_name + (street ? ', ' + street : '')
                        }
                        // Locality/Area (Indian format priority)
                        if (types.includes('sublocality_level_2') || types.includes('sublocality_level_3')) {
                            locality = component.long_name // Most specific
                        }
                        if (!locality && (types.includes('sublocality') || types.includes('sublocality_level_1'))) {
                            locality = component.long_name
                        }
                        if (!locality && types.includes('neighborhood')) {
                            locality = component.long_name
                        }
                        // City (multiple fallbacks for suburbs)
                        if (types.includes('locality')) {
                            city = component.long_name
                        }
                        if (!city && types.includes('administrative_area_level_2')) {
                            city = component.long_name // District fallback
                        }
                        // State
                        if (types.includes('administrative_area_level_1')) {
                            state = component.long_name
                        }
                        // Country
                        if (types.includes('country')) {
                            country = component.long_name
                        }
                        // Pincode
                        if (types.includes('postal_code')) {
                            pincode = component.long_name
                        }
                    })

                    const addressLine = [locality, city, state].filter(Boolean).join(', ')

                    setValue('addressline', addressLine || place.formatted_address)
                    setValue('city', city)
                    setValue('state', state)
                    setValue('country', country || 'India')
                    setValue('pincode', pincode)

                    setSelectedLocation({
                        lat,
                        lng,
                        displayName: locality || city,
                        formattedAddress: addressLine || place.formatted_address
                    })

                    // Update location data for saving - manual pin drag = user verified
                    const plusCode = generatePlusCode(lat, lng)
                    setLocationData({
                        latitude: lat,
                        longitude: lng,
                        accuracy: 10, // Manual pin placement = high accuracy
                        method: 'manual',
                        plusCode: plusCode,
                        confidence: { level: 'verified', score: 95 }
                    })

                    // Update map center and marker
                    if (mapRef.current) {
                        mapRef.current.panTo({ lat, lng })
                    }
                    if (markerRef.current) {
                        markerRef.current.setPosition({ lat, lng })
                    }
                }
            })
        } catch (error) {
            console.error('Geocoding error:', error)
        }
    }

    const onSubmit = async(data) => {
        try {
            // Build complete address line from all components
            const completeAddressLine = [
                data.flatno,
                data.floor ? `Floor ${data.floor}` : '',
                data.addressline,
                data.landmark
            ].filter(Boolean).join(', ')

            // Build request data with location information
            const requestData = {
                address_line: completeAddressLine,
                city: data.city,
                state: data.state,
                country: data.country || 'India',
                pincode: data.pincode,
                mobile: data.mobile,
                address_type: addressType,

                // Location data (if available)
                latitude: locationData.latitude || selectedLocation?.lat || null,
                longitude: locationData.longitude || selectedLocation?.lng || null,
                plusCode: locationData.plusCode || (selectedLocation ? generatePlusCode(selectedLocation.lat, selectedLocation.lng) : null),
                locationAccuracy: locationData.accuracy || null,
                locationMethod: locationData.method || 'manual',
                locationConfidence: locationData.confidence?.level || null,
                confidenceScore: locationData.confidence?.score || null,
                userVerified: false, // Will be true when user confirms pin position

                // Delivery optimization fields
                landmark: data.landmark || '',
                flatNo: data.flatno || '',
                floor: data.floor || ''
            }

            const response = await Axios({
                ...SummaryApi.createAddress,
                data: requestData
            })

            const { data : responseData } = response
            
            if(responseData.success){
                toast.success("Address saved successfully!")
                if(close){
                    close()
                    reset()
                    fetchAddress()
                }
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    return (
        <section className='bg-black fixed top-0 left-0 right-0 bottom-0 z-[200] bg-opacity-70 h-screen overflow-hidden'>
            {/* Pre-Permission Modal - Explains benefits before browser permission */}
            {showLocationPermissionModal && (
                <div className='fixed inset-0 bg-black/60 z-[210] flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden'>
                        <div className='bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-center'>
                            <div className='bg-white/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3'>
                                <MapPin className='text-white' size={32} />
                            </div>
                            <h3 className='text-white text-xl font-bold'>Share Your Location</h3>
                            <p className='text-gray-300 text-sm mt-1'>For accurate delivery</p>
                        </div>
                        <div className='p-5 space-y-3'>
                            <div className='flex items-start gap-3'>
                                <span className='text-xl'>🏪</span>
                                <div>
                                    <p className='font-medium text-gray-900 text-sm'>Show nearby stores</p>
                                    <p className='text-gray-500 text-xs'>Find fastest delivery options</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <span className='text-xl'>⏱️</span>
                                <div>
                                    <p className='font-medium text-gray-900 text-sm'>Accurate delivery time</p>
                                    <p className='text-gray-500 text-xs'>10-30 min estimates</p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <span className='text-xl'>🔒</span>
                                <div>
                                    <p className='font-medium text-gray-900 text-sm'>Your privacy is safe</p>
                                    <p className='text-gray-500 text-xs'>Only used for this delivery</p>
                                </div>
                            </div>
                        </div>
                        <div className='p-5 pt-0 space-y-3'>
                            <button
                                onClick={handleConfirmLocationAccess}
                                className='w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg'
                            >
                                <MapPin size={18} /> Allow Location Access
                            </button>
                            <button 
                                onClick={() => setShowLocationPermissionModal(false)} 
                                className='w-full text-gray-500 hover:text-gray-700 py-2 font-medium text-sm'
                            >
                                Enter address manually
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='bg-white w-full h-full md:max-w-5xl md:h-[96vh] md:mt-4 md:mx-auto md:rounded-2xl shadow-2xl overflow-hidden flex flex-col'>
                {/* Close Button - Top Right */}
                <button 
                    onClick={close} 
                    className='absolute top-2 right-2 md:top-4 md:right-4 z-20 bg-white hover:bg-gray-100 rounded-full p-1.5 md:p-2 shadow-lg transition-all duration-300'
                >
                    <X size={20} className='md:w-6 md:h-6 text-gray-700'/>
                </button>

                {/* Two Column Layout for Desktop, Stacked for Mobile */}
                <div className='flex flex-col md:flex-row h-full overflow-hidden'>
                    {/* LEFT SIDE: Map Section */}
                    <div className='w-full h-[40vh] md:w-2/5 md:h-full bg-gray-100 relative flex flex-col flex-shrink-0'>
                        {/* Map Container */}
                        <div className='flex-1 relative w-full h-full'>
                            {showMap && selectedLocation ? (
                                <>
                                    {/* Google Map */}
                                    <div id='location-map' className='w-full h-full absolute inset-0'></div>
                                    
                                    {/* Go to Current Location Button */}
                                    <button
                                        id='center-map-button'
                                        onClick={detectCurrentLocation}
                                        disabled={loadingLocation}
                                        className='absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 bg-white hover:bg-gray-50 text-green-600 px-3 py-1.5 rounded-full shadow-lg font-medium flex items-center gap-2 transition-all duration-300 disabled:opacity-50 text-xs md:text-sm z-10'
                                    >
                                        {loadingLocation ? <Loader2 className='animate-spin' size={14} /> : <MapPin size={14} />}
                                        <span className='hidden sm:inline'>{loadingLocation ? "Detecting..." : "Go to current location"}</span>
                                        <span className='sm:hidden'>{loadingLocation ? "..." : "Current"}</span>
                                    </button>
                                    
                                    {/* Pin Adjustment Hint */}
                                    {selectedLocation && (
                                        <div className='absolute top-1 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md text-[10px] md:text-xs text-gray-700 z-10 max-w-[90%] text-center'>
                                            💡 Drag pin to exact building
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className='w-full h-full flex items-center justify-center bg-gray-50'>
                                    <div className='text-center p-3 md:p-4'>
                                        <Map className='mx-auto text-gray-300 mb-2 md:mb-3' size={40} />
                                        <p className='text-gray-500 text-xs md:text-sm mb-2'>Quick ways to add address:</p>
                                        <button
                                            type='button'
                                            onClick={handleUseMyLocation}
                                            disabled={loadingLocation}
                                            className='bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 text-xs md:text-sm w-full max-w-xs'
                                        >
                                            {loadingLocation ? <Loader2 className='animate-spin' size={16} /> : <MapPin size={16} />}
                                            {loadingLocation ? "Detecting..." : "Use My Location"}
                                        </button>
                                        <p className='text-[10px] md:text-xs text-gray-400 mt-2'>OR search above</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delivering to Section with Accuracy Indicator */}
                        {selectedLocation && (
                            <div className='bg-white p-2 md:p-3 border-t border-gray-200 flex-shrink-0'>
                                <p className='text-[10px] md:text-xs font-bold text-gray-900 mb-1'>Delivering your order to</p>
                                <div className='flex items-start gap-1.5 md:gap-2'>
                                    <MapPin className='text-red-600 flex-shrink-0 mt-0.5' size={14} />
                                    <div className='flex-1 min-w-0'>
                                        <p className='font-bold text-gray-900 text-xs md:text-sm truncate'>
                                            {selectedLocation.displayName || 'Current Location'}
                                        </p>
                                        <p className='text-[10px] md:text-xs text-gray-600 line-clamp-1'>
                                            {selectedLocation.formattedAddress || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
                                        </p>
                                    </div>
                                </div>
                                {/* Accuracy Indicator */}
                                {locationData.accuracy && (
                                    <div className={`mt-2 px-2 py-1 rounded-md text-[10px] md:text-xs flex items-center gap-1 ${
                                        locationData.accuracy <= 50 ? 'bg-green-50 text-green-700' :
                                        locationData.accuracy <= 200 ? 'bg-blue-50 text-blue-700' :
                                        locationData.accuracy <= 1000 ? 'bg-yellow-50 text-yellow-700' :
                                        'bg-orange-50 text-orange-700'
                                    }`}>
                                        <span>
                                            {locationData.accuracy <= 50 ? '🎯' :
                                             locationData.accuracy <= 200 ? '📍' :
                                             locationData.accuracy <= 1000 ? '📶' : '🌐'}
                                        </span>
                                        <span>
                                            {locationData.method === 'manual' ? 'Pin placed manually' :
                                             locationData.accuracy <= 50 ? `±${Math.round(locationData.accuracy)}m - GPS locked` :
                                             locationData.accuracy <= 200 ? `±${Math.round(locationData.accuracy)}m - Good accuracy` :
                                             locationData.accuracy <= 1000 ? `±${Math.round(locationData.accuracy)}m - Adjust pin if needed` :
                                             'Approximate - Please adjust pin'}
                                        </span>
                                    </div>
                                )}
                                {/* Plus Code Display */}
                                {locationData.plusCode && (
                                    <div className='mt-1 text-[9px] md:text-[10px] text-gray-400 font-mono'>
                                        Plus Code: {locationData.plusCode}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: Form Section */}
                    <div className='w-full md:w-3/5 overflow-y-auto flex-1 min-h-0 pb-24 md:pb-4'>
                        {/* Header */}
                        <div className='bg-white p-2 md:p-4 border-b border-gray-200 sticky top-0 z-10'>
                            <h2 className='text-base md:text-xl font-bold text-gray-900'>Enter complete address</h2>
                        </div>

                        <div className='p-2 md:p-4'>
                            {/* Search Address with Google Places Autocomplete */}
                            <div className='mb-3 md:mb-4'>
                                <div className='relative'>
                                    <input
                                        ref={searchInputRef}
                                        type='text'
                                        placeholder='Search for an area, street name...'
                                        className='w-full p-2 md:p-2.5 pl-8 md:pl-9 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all duration-300 text-xs md:text-sm'
                                        disabled={!googleMapsLoaded}
                                    />
                                    <Search className='absolute left-2 md:left-2.5 top-1/2 -translate-y-1/2 text-gray-400' size={14} />
                                    {!googleMapsLoaded && (
                                        <div className='absolute right-2 md:right-2.5 top-1/2 -translate-y-1/2'>
                                            <Loader2 className='animate-spin text-red-600' size={14} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form className='space-y-2 md:space-y-3' onSubmit={handleSubmit(onSubmit)}>
                                {/* Save Address As */}
                                <div>
                                    <label className='block text-[10px] md:text-xs font-medium text-gray-600 mb-1.5 md:mb-2'>
                                        Save address as <span className='text-red-600'>*</span>
                                    </label>
                                    <div className='grid grid-cols-4 gap-1.5 md:gap-2'>
                                        {[
                                            { type: 'HOME', label: 'Home', icon: '🏠' },
                                            { type: 'WORK', label: 'Work', icon: '🏢' },
                                            { type: 'HOTEL', label: 'Hotel', icon: '🏨' },
                                            { type: 'OTHER', label: 'Other', icon: '📍' }
                                        ].map(({ type, label, icon }) => (
                                            <button
                                                key={type}
                                                type='button'
                                                onClick={() => setAddressType(type)}
                                                className={`py-1.5 md:py-2 px-1 md:px-2 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center gap-0.5 md:gap-1 border-2 text-[9px] md:text-xs ${
                                                    addressType === type
                                                        ? 'border-yellow-500 bg-yellow-50 text-gray-900'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className='text-sm md:text-base'>{icon}</span>
                                                <span className='text-[9px] md:text-xs leading-tight'>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Flat / House Number */}
                                <div>
                                    <input
                                        type='text'
                                        id='flatno' 
                                        placeholder='Flat / House no / Building name *'
                                        className='w-full p-2 md:p-2.5 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all duration-300 text-xs md:text-sm'
                                        {...register("flatno", { required: "Required" })}
                                    />
                                    {errors.flatno && (
                                        <p className='text-red-600 text-[10px] md:text-xs mt-0.5'>{errors.flatno.message}</p>
                                    )}
                                </div>

                                {/* Floor (Optional) */}
                                <div>
                                    <input
                                        type='text'
                                        id='floor' 
                                        placeholder='Floor (optional)'
                                        className='w-full p-2 md:p-2.5 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all duration-300 text-xs md:text-sm'
                                        {...register("floor")}
                                    />
                                </div>

                                {/* Area / Sector / Locality (Auto-filled) */}
                                <div>
                                    <label htmlFor='addressline' className='block text-[10px] md:text-xs font-medium text-gray-600 mb-0.5 md:mb-1'>
                                        Area / Sector / Locality <span className='text-red-600'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        id='addressline' 
                                        className='w-full p-2 md:p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-xs md:text-sm text-gray-700 font-medium'
                                        {...register("addressline", { required: true })}
                                        readOnly
                                    />
                                </div>

                                {/* Nearby Landmark (Optional) */}
                                <div>
                                    <input
                                        type='text'
                                        id='landmark' 
                                        placeholder='Nearby landmark (optional)'
                                        className='w-full p-2 md:p-2.5 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all duration-300 text-xs md:text-sm'
                                        {...register("landmark")}
                                    />
                                </div>

                                {/* Divider */}
                                <div className='border-t border-gray-200 my-3 md:my-4'></div>
                                
                                {/* Enter your details section */}
                                <p className='text-[10px] md:text-xs font-medium text-gray-600 mb-2 md:mb-3'>Enter your details for seamless delivery experience</p>

                                {/* Your Name */}
                                <div>
                                    <input
                                        type='text'
                                        id='name' 
                                        placeholder='Your name *'
                                        className='w-full p-2 md:p-2.5 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all duration-300 text-xs md:text-sm'
                                        {...register("name", { required: "Required" })}
                                    />
                                    {errors.name && (
                                        <p className='text-red-600 text-[10px] md:text-xs mt-0.5'>{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Your Phone Number */}
                                <div>
                                    <input
                                        type='tel'
                                        id='mobile' 
                                        placeholder='Your phone number (optional)'
                                        maxLength={10}
                                        className='w-full p-2 md:p-2.5 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all duration-300 text-xs md:text-sm'
                                        {...register("mobile", { 
                                            required: "Required",
                                            pattern: {
                                                value: /^[6-9][0-9]{9}$/,
                                                message: "Enter valid 10-digit number"
                                            }
                                        })}
                                    />
                                    {errors.mobile && (
                                        <p className='text-red-600 text-[10px] md:text-xs mt-0.5'>{errors.mobile.message}</p>
                                    )}
                                </div>

                                {/* Hidden fields for city, state, pincode, country */}
                                <input type='hidden' {...register("city", { required: true })} />
                                <input type='hidden' {...register("state", { required: true })} />
                                <input type='hidden' {...register("pincode", { required: true })} />
                                <input type='hidden' {...register("country")} defaultValue="India" />

                                {/* Submit Button */}
                                <button
                                    type='submit'
                                    className='w-full py-2.5 md:py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs md:text-sm mt-2 md:mt-0'
                                >
                                    Save Address
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AddAddress
