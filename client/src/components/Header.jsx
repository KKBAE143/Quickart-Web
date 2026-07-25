import React, { useEffect, useState } from 'react'
import Search from './Search'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaRegCircleUser } from "react-icons/fa6";
import useMobile from '../hooks/useMobile';
import { BsCart4 } from "react-icons/bs";
import { useSelector, useDispatch } from 'react-redux';
import { GoTriangleDown, GoTriangleUp } from "react-icons/go";
import UserMenu from './UserMenu';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { useGlobalContext } from '../provider/GlobalProvider';
import DisplayCartItem from './DisplayCartItem';
import { Heart, MapPin, ChevronDown, Clock } from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { setWishlist } from '../store/wishlistSlice';
import LocationModal from './LocationModal';

const Header = () => {
    const [isMobile] = useMobile()
    const location = useLocation()
    const isSearchPage = location.pathname === "/search"
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector((state) => state?.user)
    const [openUserMenu, setOpenUserMenu] = useState(false)
    const cartItem = useSelector(state => state.cartItem.cart)
    const wishlist = useSelector(state => state.wishlist.wishlist)
    const { totalPrice, totalQty, addressList } = useGlobalContext()
    const [openCartSection, setOpenCartSection] = useState(false)
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState(null)

    // Load selected location from localStorage
    useEffect(() => {
        const savedLocation = localStorage.getItem('detectedLocation')
        if (savedLocation) {
            try {
                setSelectedLocation(JSON.parse(savedLocation))
            } catch (e) {
                // Invalid JSON, ignore
            }
        }
        
        // Also check for saved address
        const savedAddressId = localStorage.getItem('selectedAddressId')
        if (savedAddressId && addressList?.length > 0) {
            const address = addressList.find(a => a._id === savedAddressId)
            if (address) {
                setSelectedLocation({
                    address: [address.address_line, address.city].filter(Boolean).join(', '),
                    addressType: address.address_type
                })
            }
        }
    }, [addressList])

    // Handle location selection from modal
    const handleLocationSelect = (location) => {
        setSelectedLocation(location)
    }

    // Get display address (truncated)
    const getDisplayAddress = () => {
        if (selectedLocation?.address) {
            const addr = selectedLocation.address
            return addr.length > 35 ? addr.substring(0, 35) + '...' : addr
        }
        return 'Select delivery location'
    }

    // Fetch wishlist count when user logs in
    useEffect(() => {
        if (user?._id) {
            fetchWishlistCount()
        }
    }, [user])

    const fetchWishlistCount = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getWishlist
            })
            if (response.data.success) {
                dispatch(setWishlist(response.data.data))
            }
        } catch (error) {
            // Silently fail - not critical
        }
    }

    const redirectToLoginPage = () => {
        navigate("/login")
    }

    const handleCloseUserMenu = () => {
        setOpenUserMenu(false)
    }

    const handleMobileUser = () => {
        if (!user._id) {
            navigate("/login")
            return
        }

        navigate("/user")
    }

    return (
        <header className='min-h-[56px] md:min-h-[72px] lg:h-24 sticky top-0 z-40 flex flex-col justify-center bg-white shadow-md border-b-2 border-red-500'>
            {
                !(isSearchPage && isMobile) && (
                    <div className='container mx-auto flex items-center px-3 lg:px-6 justify-between py-1.5 lg:py-0'>
                        {/**logo */}
                        <div className='h-full'>
                            <Link to={"/"} className='h-full flex justify-center items-center group'>
                                <div className='relative'>
                                    <img
                                        src="/logo.png"
                                        alt='Quickart logo'
                                        className='hidden lg:block w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-glow-red'
                                    />
                                    <img
                                        src="/logo.png"
                                        alt='Quickart logo'
                                        className='lg:hidden w-10 h-10 object-contain transition-transform duration-200 group-hover:scale-105'
                                    />
                                    {/* Premium red glow effect on hover matching logo */}
                                    <div className='absolute inset-0 bg-brand-red opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 rounded-full'></div>
                                </div>
                            </Link>
                        </div>

                        {/** Location Selector - Blinkit Style */}
                        <button 
                            onClick={() => setShowLocationModal(true)}
                            className='hidden lg:flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors max-w-[280px] group'
                        >
                            <MapPin size={20} className='text-red-600 flex-shrink-0' />
                            <div className='text-left min-w-0'>
                                <div className='flex items-center gap-1'>
                                    <span className='text-xs font-bold text-gray-800'>Delivery in 10 min</span>
                                    <Clock size={12} className='text-gray-400' />
                                </div>
                                <div className='flex items-center gap-1'>
                                    <span className='text-sm text-gray-600 truncate'>
                                        {getDisplayAddress()}
                                    </span>
                                    <ChevronDown size={14} className='text-gray-400 flex-shrink-0 group-hover:rotate-180 transition-transform' />
                                </div>
                            </div>
                        </button>

                        {/**Search */}
                        <div className='hidden lg:block flex-1 max-w-2xl mx-4'>
                            <Search />
                        </div>

                        {/**login and my cart */}
                        <div className='flex items-center gap-1.5 lg:gap-3'>
                            {/**Mobile view */}
                            <div className='flex lg:hidden items-center gap-1'>
                                <button
                                    className='flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-50 active:bg-red-100 transition-all duration-200 text-red-600'
                                    onClick={handleMobileUser}
                                    aria-label='My Account'
                                >
                                    <FaRegCircleUser size={20} />
                                </button>

                                {/**Mobile Wishlist Button */}
                                {user?._id && (
                                    <button
                                        onClick={() => navigate('/wishlist')}
                                        className='relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-50 active:bg-red-100 transition-all duration-200'
                                        aria-label='Wishlist'
                                    >
                                        <Heart
                                            size={18}
                                            className='text-red-600'
                                        />
                                        {wishlist.length > 0 && (
                                            <span className='absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'>
                                                {wishlist.length}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {/**Mobile Cart Button - Matching Logo Red */}
                                <button
                                    onClick={() => setOpenCartSection(true)}
                                    className='relative flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 px-2.5 py-1.5 rounded-full text-white shadow-md transition-all duration-200'
                                >
                                    <BsCart4 size={18} />
                                    {totalQty > 0 && (
                                        <span className='text-xs font-bold min-w-[16px]'>
                                            {totalQty}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/**Desktop view */}
                            <div className='hidden lg:flex items-center gap-6'>
                                {
                                    user?._id ? (
                                        <div className='relative'>
                                            <div
                                                onClick={() => setOpenUserMenu(preve => !preve)}
                                                className='flex select-none items-center gap-2 cursor-pointer px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-300 group'
                                            >
                                                <FaRegCircleUser className='text-red-800 text-2xl group-hover:text-red-600 transition-colors' />
                                                <p className='font-semibold text-red-800 group-hover:text-red-600 transition-colors'>Account</p>
                                                {
                                                    openUserMenu ? (
                                                        <GoTriangleUp className='text-red-600' size={20} />
                                                    ) : (
                                                        <GoTriangleDown className='text-red-800 group-hover:text-red-600 transition-colors' size={20} />
                                                    )
                                                }
                                            </div>
                                            {
                                                openUserMenu && (
                                                    <div className='absolute right-0 top-14 z-50 animate-fadeIn'>
                                                        <div className='bg-white rounded-2xl p-4 min-w-56 shadow-2xl border-2 border-red-100'>
                                                            <UserMenu close={handleCloseUserMenu} />
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    ) : (
                                        <button
                                            onClick={redirectToLoginPage}
                                            className='text-lg px-6 py-2 rounded-xl font-semibold text-red-800 hover:bg-red-50 hover:text-red-600 transition-all duration-300 hover:shadow-md'
                                        >
                                            Login
                                        </button>
                                    )
                                }

                                {/**Desktop Wishlist Button */}
                                {user?._id && (
                                    <button
                                        onClick={() => navigate('/wishlist')}
                                        className='relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-red-600 text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-105 group'
                                        aria-label='Wishlist'
                                    >
                                        <div className='relative'>
                                            <Heart
                                                size={24}
                                                className='group-hover:fill-red-600 transition-all duration-300'
                                            />
                                            {wishlist.length > 0 && (
                                                <span className='absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse'>
                                                    {wishlist.length}
                                                </span>
                                            )}
                                        </div>
                                        <span className='font-semibold'>Wishlist</span>
                                    </button>
                                )}

                                {/**Desktop Cart Button - Matching Logo Red */}
                                <button
                                    onClick={() => setOpenCartSection(true)}
                                    className='relative flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-5 py-3 rounded-xl text-white shadow-lg hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105 group'
                                >
                                    <div className='relative'>
                                        <BsCart4 size={28} className='group-hover:rotate-12 transition-transform duration-300' />
                                        {totalQty > 0 && (
                                            <span className='absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse border-2 border-red-500'>
                                                {totalQty}
                                            </span>
                                        )}
                                    </div>
                                    <div className='font-bold text-sm'>
                                        {
                                            cartItem[0] ? (
                                                <div className='text-left'>
                                                    <p className='text-xs opacity-90'>My Cart</p>
                                                    <p className='text-base'>{DisplayPriceInRupees(totalPrice)}</p>
                                                </div>
                                            ) : (
                                                <p className='text-base'>My Cart</p>
                                            )
                                        }
                                    </div>
                                    {/* Premium shine effect */}
                                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700'></div>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Mobile Location Bar */}
            <div className='lg:hidden'>
                <button 
                    onClick={() => setShowLocationModal(true)}
                    className='w-full flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100'
                >
                    <MapPin size={16} className='text-red-600 flex-shrink-0' />
                    <div className='flex-1 text-left min-w-0'>
                        <span className='text-xs text-gray-600 truncate block'>
                            {getDisplayAddress()}
                        </span>
                    </div>
                    <ChevronDown size={14} className='text-gray-400 flex-shrink-0' />
                </button>
            </div>

            {/* Mobile Search with enhanced styling */}
            <div className='container mx-auto px-3 pb-2 lg:hidden'>
                <Search />
            </div>

            {
                openCartSection && (
                    <DisplayCartItem close={() => setOpenCartSection(false)} />
                )
            }

            {/* Location Modal */}
            <LocationModal 
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelectLocation={handleLocationSelect}
            />
        </header>
    )
}

export default Header
