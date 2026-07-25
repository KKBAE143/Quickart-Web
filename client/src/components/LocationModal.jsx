import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, X, Search, Loader2, Home, Briefcase, Navigation, Plus, ChevronRight, Clock } from 'lucide-react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { useSelector } from 'react-redux'
import AddAddress from './AddAddress'
import toast from 'react-hot-toast'
import { detectLocationWithPriority, LOCATION_METHODS } from '../utils/LocationService'

/**
 * LocationModal - Quick commerce-style location selector
 * Features:
 * - Auto-detect current location with GPS
 * - Search addresses with Google Places Autocomplete
 * - Display and manage saved addresses
 * - Add new address functionality
 */
const LocationModal = ({ isOpen, onClose, onSelectLocation }) => {
    const { addressList, fetchAddress } = useGlobalContext()
    const user = useSelector(state => state?.user)
    
    const [loadingLocation, setLoadingLocation] = useState(false)
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddAddress, setShowAddAddress] = useState(false)
    const [detectedLocation, setDetectedLocation] = useState(null)
    const [autoDetecting, setAutoDetecting] = useState(false)
    
    const searchInputRef = useRef(null)
    const autocompleteRef = useRef(null)
    const modalRef = useRef(null)
    
    // Load Google Maps API
    useEffect(() => {
        if (!isOpen) return;

        // Check if Google Maps with Places is fully loaded
        if (window.google?.maps?.places?.Autocomplete) {
            setGoogleMapsLoaded(true)
            return
        }

        // Check if script is already loading
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
        if (existingScript) {
            // Wait for Places library to be available
            const checkPlaces = setInterval(() => {
                if (window.google?.maps?.places?.Autocomplete) {
                    clearInterval(checkPlaces)
                    setGoogleMapsLoaded(true)
                }
            }, 100)
            // Timeout after 10s
            setTimeout(() => clearInterval(checkPlaces), 10000)
            return
        }

        const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        if (!GOOGLE_MAPS_API_KEY) return

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`
        script.async = true
        script.defer = true
        script.onload = () => {
            // Wait for Places library to be available
            const checkPlaces = setInterval(() => {
                if (window.google?.maps?.places?.Autocomplete) {
                    clearInterval(checkPlaces)
                    setGoogleMapsLoaded(true)
                }
            }, 50)
            // Fallback after 3s
            setTimeout(() => {
                clearInterval(checkPlaces)
                if (window.google?.maps) setGoogleMapsLoaded(true)
            }, 3000)
        }
        document.head.appendChild(script)
    }, [isOpen])

    // Initialize Google Places Autocomplete
    useEffect(() => {
        if (!googleMapsLoaded || !searchInputRef.current || !isOpen) return

        // Extra safety check for Places API
        if (!window.google?.maps?.places?.Autocomplete) {
            console.log('Places library not yet available, waiting...')
            const waitForPlaces = setInterval(() => {
                if (window.google?.maps?.places?.Autocomplete) {
                    clearInterval(waitForPlaces)
                    initAutocomplete()
                }
            }, 200)
            setTimeout(() => clearInterval(waitForPlaces), 5000)
            return
        }

        initAutocomplete()

        function initAutocomplete() {
            try {
                autocompleteRef.current = new window.google.maps.places.Autocomplete(
                    searchInputRef.current,
                    {
                        types: ['geocode', 'establishment'],
                        componentRestrictions: { country: 'in' }
                    }
                )

                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current.getPlace()
                    if (place?.geometry?.location) {
                        const location = {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                            address: place.formatted_address || place.name,
                            method: 'search'
                        }
                        setDetectedLocation(location)
                        handleLocationSelected(location)
                    }
                })
                console.log('Places Autocomplete initialized successfully')
            } catch (error) {
                console.error('Error initializing autocomplete:', error)
            }
        }
    }, [googleMapsLoaded, isOpen])

    // Auto-detect location when modal opens
    useEffect(() => {
        if (isOpen && !detectedLocation && !autoDetecting) {
            // Check if user already has a selected address
            const savedAddressId = localStorage.getItem('selectedAddressId')
            if (!savedAddressId && addressList?.length === 0) {
                // No saved address, auto-detect
                handleDetectLocation(true) // silent = true
            }
        }
    }, [isOpen, addressList])

    // Handle click outside to close (disabled when AddAddress is open)
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Don't close if AddAddress modal is open
            if (showAddAddress) return
            
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose()
            }
        }
        
        if (isOpen && !showAddAddress) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose, showAddAddress])

    // Detect current location using GPS
    const handleDetectLocation = useCallback(async (silent = false) => {
        setLoadingLocation(true)
        setAutoDetecting(true)
        
        if (!silent) {
            toast.loading('Detecting your location...', { id: 'location-detect' })
        }

        try {
            const locationData = await detectLocationWithPriority({
                googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                gpsTimeout: 20000,
                enableHighAccuracy: true,
                useCache: false
            })

            // Reverse geocode to get address
            const address = await reverseGeocode(locationData.lat, locationData.lng)
            
            const location = {
                lat: locationData.lat,
                lng: locationData.lng,
                accuracy: locationData.accuracy,
                address: address,
                method: locationData.method
            }
            
            setDetectedLocation(location)
            
            if (!silent) {
                const accuracyText = locationData.accuracy < 100 ? 'High accuracy' : 'Approximate'
                toast.success(`Location detected! (${accuracyText})`, { id: 'location-detect' })
            }

            // Auto-select if user clicks the button
            if (!silent) {
                handleLocationSelected(location)
            }
        } catch (error) {
            console.error('Location detection failed:', error)
            if (!silent) {
                toast.error('Could not detect location. Please search or select a saved address.', { id: 'location-detect' })
            }
        } finally {
            setLoadingLocation(false)
            setAutoDetecting(false)
        }
    }, [])

    // Reverse geocode coordinates to address
    const reverseGeocode = async (lat, lng) => {
        if (!window.google?.maps) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        
        return new Promise((resolve) => {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve(results[0].formatted_address)
                } else {
                    resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                }
            })
        })
    }

    // Handle location selection
    const handleLocationSelected = (location) => {
        localStorage.setItem('detectedLocation', JSON.stringify(location))
        if (onSelectLocation) {
            onSelectLocation(location)
        }
        onClose()
    }

    // Handle saved address selection
    const handleSelectAddress = (address) => {
        localStorage.setItem('selectedAddressId', address._id)
        const location = {
            lat: address.latitude || 0,
            lng: address.longitude || 0,
            address: formatAddress(address),
            addressId: address._id,
            addressType: address.address_type
        }
        handleLocationSelected(location)
    }

    // Format address for display
    const formatAddress = (address) => {
        const parts = [
            address.address_line,
            address.landmark,
            address.city,
            address.state
        ].filter(Boolean)
        return parts.join(', ')
    }

    // Get icon for address type
    const getAddressIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'home': return <Home size={18} className="text-green-600" />
            case 'work': 
            case 'office': return <Briefcase size={18} className="text-blue-600" />
            default: return <MapPin size={18} className="text-gray-600" />
        }
    }

    // Handle add address completion
    const handleAddAddressClose = () => {
        setShowAddAddress(false)
        fetchAddress() // Refresh address list
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center">
            <div 
                ref={modalRef}
                className="bg-white w-full md:w-[480px] max-h-[85vh] md:max-h-[80vh] rounded-t-3xl md:rounded-2xl overflow-hidden animate-slideUp md:animate-fadeIn shadow-2xl mb-0 md:mb-0"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Select your Location</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto pb-20 md:pb-4">
                    {/* Search Bar */}
                    <div className="p-4">
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search delivery location"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Use Current Location Button */}
                    <div className="px-4">
                        <button
                            onClick={() => handleDetectLocation(false)}
                            disabled={loadingLocation}
                            className="w-full flex items-center gap-3 p-4 hover:bg-green-50 rounded-xl transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                {loadingLocation ? (
                                    <Loader2 size={20} className="text-green-600 animate-spin" />
                                ) : (
                                    <Navigation size={20} className="text-green-600" />
                                )}
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-green-700">Use current location</p>
                                {detectedLocation && (
                                    <p className="text-sm text-gray-500 line-clamp-1">
                                        {detectedLocation.address}
                                    </p>
                                )}
                            </div>
                            <ChevronRight size={20} className="ml-auto text-gray-400" />
                        </button>
                    </div>

                    {/* Divider */}
                    {addressList?.length > 0 && (
                        <div className="px-4 py-2">
                            <div className="h-px bg-gray-100"></div>
                        </div>
                    )}

                    {/* Saved Addresses */}
                    {user?._id && addressList?.length > 0 && (
                        <div className="px-4 pb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Saved Addresses
                            </h3>
                            <div className="space-y-2">
                                {addressList.map((address) => (
                                    <button
                                        key={address._id}
                                        onClick={() => handleSelectAddress(address)}
                                        className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                                    >
                                        <div className="mt-1">
                                            {getAddressIcon(address.address_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 capitalize">
                                                {address.address_type || 'Other'}
                                            </p>
                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                {formatAddress(address)}
                                            </p>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-400 mt-2" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add New Address */}
                    {user?._id && (
                        <div className="px-4 pb-6">
                            <button
                                onClick={() => setShowAddAddress(true)}
                                className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 hover:border-green-500 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                    <Plus size={20} className="text-gray-600 group-hover:text-green-600" />
                                </div>
                                <p className="font-semibold text-gray-700 group-hover:text-green-700">
                                    Add new address
                                </p>
                            </button>
                        </div>
                    )}

                    {/* Login prompt for guests */}
                    {!user?._id && (
                        <div className="px-4 pb-6">
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-gray-600 mb-3">Login to save and manage your addresses</p>
                                <a 
                                    href="/login"
                                    className="inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Login
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Address Modal */}
            {showAddAddress && (
                <AddAddress close={handleAddAddressClose} />
            )}

            {/* Animation styles */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    )
}

export default LocationModal
