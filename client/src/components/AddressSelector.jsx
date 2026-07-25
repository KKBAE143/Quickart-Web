import { useState, useEffect, useRef } from 'react'
import { MapPin, X, Search, Loader2, Home, Briefcase, Edit, Trash2, ChevronDown } from 'lucide-react'
import { useGlobalContext } from '../provider/GlobalProvider'
import AddAddress from './AddAddress'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { detectLocationWithPriority } from '../utils/LocationService'

const AddressSelector = () => {
    const { addressList, fetchAddress } = useGlobalContext()
    const [showModal, setShowModal] = useState(false)
    const [showAddAddressForm, setShowAddAddressForm] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [loadingLocation, setLoadingLocation] = useState(false)
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    
    const searchInputRef = useRef(null)
    const autocompleteRef = useRef(null)

    // Select first address by default or from localStorage
    useEffect(() => {
        // Add null/undefined check for addressList
        if (!addressList || !Array.isArray(addressList)) {
            return
        }
        
        const savedAddressId = localStorage.getItem('selectedAddressId')
        if (savedAddressId && addressList.length > 0) {
            const address = addressList.find(addr => addr._id === savedAddressId)
            if (address) {
                setSelectedAddress(address)
                return
            }
        }
        
        // Default to first address
        if (addressList.length > 0 && !selectedAddress) {
            setSelectedAddress(addressList[0])
            localStorage.setItem('selectedAddressId', addressList[0]._id)
        }
    }, [addressList])

    // Load Google Maps API (check if already loaded to prevent duplicates)
    useEffect(() => {
        // Check if already loaded
        if (window.google && window.google.maps) {
            setGoogleMapsLoaded(true)
            return
        }

        // Check if script is already being loaded by another component
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                setGoogleMapsLoaded(true)
            })
            return
        }

        const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        
        if (!GOOGLE_MAPS_API_KEY) {
            return
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&loading=async&language=en`
        script.async = true
        script.defer = true
        
        script.onload = () => {
            setGoogleMapsLoaded(true)
        }
        
        script.onerror = () => {
            console.error('Failed to load Google Maps')
        }
        
        document.head.appendChild(script)
    }, [])

    // Initialize Places Autocomplete
    useEffect(() => {
        if (!googleMapsLoaded || !searchInputRef.current || !showModal) return

        try {
            const autocomplete = new window.google.maps.places.Autocomplete(
                searchInputRef.current,
                {
                    componentRestrictions: { country: 'in' },
                    fields: ['address_components', 'formatted_address', 'geometry', 'name'],
                    types: ['address']
                }
            )

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace()
                
                if (!place.geometry) {
                    toast.error("No address details found for the selected location")
                    return
                }

                // Open add address form with the selected place
                setSearchQuery('')
                setShowAddAddressForm(true)
                setShowModal(false)
            })

            autocompleteRef.current = autocomplete
        } catch (error) {
            console.error('Error initializing Places Autocomplete:', error)
        }
    }, [googleMapsLoaded, showModal])

    // Detect current location using LocationService (GPS > WiFi > IP)
    const detectCurrentLocation = async () => {
        if (!googleMapsLoaded) {
            toast.error("Google Maps is still loading. Please wait a moment.", {
                duration: 4000
            })
            return
        }

        setLoadingLocation(true)
        const loadingToast = toast.loading("Detecting your location...")

        try {
            // Use LocationService with priority chain: GPS > WiFi > IP
            const locationData = await detectLocationWithPriority({
                googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                gpsTimeout: 15000,
                enableHighAccuracy: true
            })

            // Log detection method (console only)
            console.log(`📍 Location method: ${locationData.method}`)
            console.log(`🎯 Accuracy: ±${Math.round(locationData.accuracy)}m`)

            toast.dismiss(loadingToast)
            toast.success('Location detected!', { duration: 2000 })

            setLoadingLocation(false)
            
            // Close modal and open add address form
            setShowModal(false)
            setShowAddAddressForm(true)

        } catch (error) {
            toast.dismiss(loadingToast)
            setLoadingLocation(false)
            
            console.error("Location detection error:", error)
            
            if (error.message?.includes('permission') || error.message?.includes('denied')) {
                toast.error("Location access denied. Please enable location permissions.", {
                    duration: 5000
                })
            } else {
                toast.error("Couldn't detect location. Please try manual entry.")
            }
        }
    }

    // Select address
    const handleSelectAddress = (address) => {
        setSelectedAddress(address)
        localStorage.setItem('selectedAddressId', address._id)
        setShowModal(false)
        toast.success("Delivery address updated!")
    }

    // Delete address
    const handleDeleteAddress = async (addressId, e) => {
        e.stopPropagation()
        
        if (!confirm("Are you sure you want to delete this address?")) {
            return
        }

        try {
            const response = await Axios({
                ...SummaryApi.deleteAddress,
                data: { _id: addressId }
            })

            if (response.data.success) {
                toast.success("Address deleted successfully!")
                fetchAddress()
                
                // If deleted address was selected, select first available
                if (selectedAddress?._id === addressId) {
                    const remaining = addressList.filter(addr => addr._id !== addressId)
                    if (remaining.length > 0) {
                        handleSelectAddress(remaining[0])
                    } else {
                        setSelectedAddress(null)
                        localStorage.removeItem('selectedAddressId')
                    }
                }
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    // Get address type icon
    const getAddressIcon = (type) => {
        switch(type) {
            case 'HOME':
                return <Home size={20} className='text-red-600' />
            case 'WORK':
                return <Briefcase size={20} className='text-red-600' />
            default:
                return <MapPin size={20} className='text-red-600' />
        }
    }

    // Format address for display
    const formatAddress = (address) => {
        if (!address) return ''
        const parts = [address.address_line, address.city, address.state]
        return parts.filter(Boolean).join(', ')
    }

    return (
        <>
            {/* Address Display Button */}
            <button
                onClick={() => setShowModal(true)}
                className='flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 max-w-full md:max-w-xs group flex-1 min-w-0'
            >
                <MapPin className='text-red-600 flex-shrink-0' size={16} />
                <div className='text-left overflow-hidden flex-1 min-w-0'>
                    <p className='text-[10px] md:text-xs font-semibold text-gray-700 leading-tight'>Delivery in 10 min</p>
                    {selectedAddress ? (
                        <p className='text-xs md:text-sm font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors'>
                            {formatAddress(selectedAddress).substring(0, 30)}{formatAddress(selectedAddress).length > 30 ? '...' : ''}
                        </p>
                    ) : (
                        <p className='text-xs md:text-sm font-bold text-red-600'>Select Address</p>
                    )}
                </div>
                <ChevronDown className='text-gray-600 flex-shrink-0' size={14} />
            </button>

            {/* Modal */}
            {showModal && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-0 md:pt-20 animate-fadeIn overflow-y-auto'>
                    <div className='bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl mx-0 md:mx-4 max-h-[100vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-slideDown mt-auto md:mt-0'>
                        {/* Header */}
                        <div className='bg-white border-b border-gray-200 p-3 md:p-4 lg:p-6 flex items-center justify-between sticky top-0 z-10'>
                            <h2 className='text-lg md:text-xl lg:text-2xl font-bold text-gray-900'>Change Location</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors'
                                aria-label='Close'
                            >
                                <X size={20} className='md:w-6 md:h-6' />
                            </button>
                        </div>

                        {/* Content */}
                        <div className='overflow-y-auto flex-1'>
                            <div className='p-3 md:p-4 lg:p-6'>
                                {/* Detect Location Button */}
                                <button
                                    onClick={detectCurrentLocation}
                                    disabled={loadingLocation}
                                    className='w-full mb-4 md:mb-6 py-2.5 md:py-3 px-3 md:px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg md:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'
                                >
                                    {loadingLocation ? (
                                        <Loader2 className='animate-spin' size={18} />
                                    ) : (
                                        <MapPin size={18} />
                                    )}
                                    {loadingLocation ? "Detecting..." : "Detect my location"}
                                </button>

                                {/* OR Divider */}
                                <div className='flex items-center gap-2 md:gap-4 mb-4 md:mb-6'>
                                    <div className='flex-1 h-px bg-gray-300'></div>
                                    <span className='text-xs md:text-sm text-gray-500 font-medium'>OR</span>
                                    <div className='flex-1 h-px bg-gray-300'></div>
                                </div>

                                {/* Search Input */}
                                <div className='mb-4 md:mb-6'>
                                    <div className='relative'>
                                        <input
                                            ref={searchInputRef}
                                            type='text'
                                            placeholder='Search delivery location'
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            disabled={!googleMapsLoaded}
                                            className='w-full p-2.5 md:p-3 pl-9 md:pl-10 border border-gray-300 md:border-2 rounded-lg md:rounded-xl focus:border-red-500 focus:ring-1 md:focus:ring-2 focus:ring-red-200 transition-all duration-300 text-sm md:text-base'
                                        />
                                        <Search className='absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400' size={16} />
                                        {!googleMapsLoaded && (
                                            <div className='absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2'>
                                                <Loader2 className='animate-spin text-red-600' size={16} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Saved Addresses */}
                                <div>
                                    <h3 className='text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4'>Your saved addresses</h3>
                                    
                                    {!addressList || addressList.length === 0 ? (
                                        <div className='text-center py-8'>
                                            <MapPin className='mx-auto text-gray-300 mb-3' size={48} />
                                            <p className='text-gray-500 mb-4'>No saved addresses yet</p>
                                            <button
                                                onClick={() => {
                                                    setShowModal(false)
                                                    setShowAddAddressForm(true)
                                                }}
                                                className='px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                                            >
                                                Add New Address
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='space-y-2 md:space-y-3 max-h-64 md:max-h-96 overflow-y-auto'>
                                            {addressList && addressList.map((address) => (
                                                <div
                                                    key={address._id}
                                                    onClick={() => handleSelectAddress(address)}
                                                    className={`p-3 md:p-4 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                                                        selectedAddress?._id === address._id
                                                            ? 'border-red-600 bg-red-50'
                                                            : 'border-gray-200 hover:border-red-300'
                                                    }`}
                                                >
                                                    <div className='flex items-start gap-2 md:gap-3'>
                                                        <div className='mt-0.5 md:mt-1 flex-shrink-0'>
                                                            {getAddressIcon(address.address_type)}
                                                        </div>
                                                        <div className='flex-1 min-w-0'>
                                                            <p className='font-bold text-gray-900 mb-0.5 md:mb-1 text-xs md:text-sm'>
                                                                {address.address_type}
                                                            </p>
                                                            <p className='text-xs md:text-sm text-gray-600 line-clamp-2'>
                                                                {formatAddress(address)}
                                                            </p>
                                                            <p className='text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1'>
                                                                {address.pincode}
                                                            </p>
                                                        </div>
                                                        <div className='flex gap-1 md:gap-2 flex-shrink-0'>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    // TODO: Implement edit
                                                                    toast('Edit feature coming soon!')
                                                                }}
                                                                className='p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors'
                                                                aria-label='Edit address'
                                                            >
                                                                <Edit size={16} className='md:w-4 md:h-4 text-gray-600' />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteAddress(address._id, e)}
                                                                className='p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors'
                                                                aria-label='Delete address'
                                                            >
                                                                <Trash2 size={16} className='md:w-4 md:h-4 text-red-600' />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Address Button */}
                                    {addressList && addressList.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setShowModal(false)
                                                setShowAddAddressForm(true)
                                            }}
                                            className='w-full mt-3 md:mt-4 py-2.5 md:py-3 px-3 md:px-4 border-2 border-dashed border-red-300 text-red-600 rounded-lg md:rounded-xl font-semibold hover:bg-red-50 transition-all duration-300 text-sm md:text-base'
                                        >
                                            + Add New Address
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Address Form */}
            {showAddAddressForm && (
                <AddAddress close={() => setShowAddAddressForm(false)} />
            )}
        </>
    )
}

export default AddressSelector

