import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    MapPin,
    Phone,
    Plus,
    Pencil,
    Trash2,
    Home,
    Building2,
    MapPinned,
    Navigation
} from 'lucide-react';
import AddAddress from '../components/AddAddress';
import EditAddressDetails from '../components/EditAddressDetails';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import { useGlobalContext } from '../provider/GlobalProvider';

const Address = () => {
    const addressList = useSelector(state => state.addresses.addressList);
    const [openAddress, setOpenAddress] = useState(false);
    const [OpenEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState({});
    const { fetchAddress } = useGlobalContext();

    const handleDisableAddress = async (id) => {
        try {
            const response = await Axios({
                ...SummaryApi.disableAddress,
                data: {
                    _id: id
                }
            });
            if (response.data.success) {
                toast.success("Address removed successfully");
                if (fetchAddress) {
                    fetchAddress();
                }
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Get address type icon
    const getAddressIcon = (index) => {
        if (index === 0) return Home;
        if (index === 1) return Building2;
        return MapPinned;
    };

    // Get address type label
    const getAddressLabel = (index) => {
        if (index === 0) return 'Home';
        if (index === 1) return 'Work';
        return `Address ${index + 1}`;
    };

    // Filter active addresses
    const activeAddresses = addressList.filter(addr => addr.status);

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* Header */}
            <div className='bg-white rounded-b-3xl shadow-sm border-b border-gray-100'>
                <div className='px-4 md:px-6 py-5 md:py-6'>
                    <div className='flex flex-col sm:flex-row justify-between gap-4 sm:items-center'>
                        <div className='flex items-center gap-3'>
                            <div className='w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center text-white shadow-lg'>
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h1 className='font-bold text-xl md:text-2xl text-gray-900'>Saved Addresses</h1>
                                <p className='text-gray-500 text-sm mt-0.5'>
                                    {activeAddresses.length} {activeAddresses.length === 1 ? 'address' : 'addresses'} saved
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpenAddress(true)}
                            className='w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-semibold transition-colors text-sm'
                        >
                            <Plus size={18} />
                            Add New Address
                        </button>
                    </div>
                </div>
            </div>

            {/* Address List */}
            <div className='p-4 md:p-6 space-y-4'>
                {activeAddresses.length === 0 ? (
                    /* Empty State */
                    <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center'>
                        <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                            <Navigation size={36} className='text-gray-400' />
                        </div>
                        <h3 className='text-lg font-bold text-gray-900 mb-2'>No Saved Addresses</h3>
                        <p className='text-gray-500 text-sm mb-6 max-w-sm mx-auto'>
                            Add your delivery addresses to make checkout faster and easier.
                        </p>
                        <button
                            onClick={() => setOpenAddress(true)}
                            className='inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors'
                        >
                            <Plus size={18} />
                            Add Your First Address
                        </button>
                    </div>
                ) : (
                    /* Address Cards */
                    <div className='grid gap-4'>
                        {addressList.map((address, index) => {
                            if (!address.status) return null;
                            const AddressIcon = getAddressIcon(index);

                            return (
                                <div
                                    key={address._id}
                                    className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200'
                                >
                                    <div className='flex flex-col sm:flex-row gap-4'>
                                        {/* Address Icon */}
                                        <div className='flex-shrink-0'>
                                            <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center'>
                                                <AddressIcon size={22} className='text-gray-600' />
                                            </div>
                                        </div>

                                        {/* Address Details */}
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-start justify-between gap-3 mb-3'>
                                                <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg'>
                                                    <AddressIcon size={12} />
                                                    {getAddressLabel(index)}
                                                </span>
                                                {index === 0 && (
                                                    <span className='px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100'>
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className='font-semibold text-gray-900 text-base mb-2 line-clamp-1'>
                                                {address.address_line}
                                            </h3>

                                            <div className='space-y-1.5 text-sm text-gray-600'>
                                                <p className='flex items-start gap-2'>
                                                    <MapPin size={14} className='text-gray-400 mt-0.5 flex-shrink-0' />
                                                    <span>{address.city}, {address.state}, {address.country} - {address.pincode}</span>
                                                </p>
                                                <p className='flex items-center gap-2'>
                                                    <Phone size={14} className='text-gray-400 flex-shrink-0' />
                                                    <span className='font-medium text-gray-700'>{address.mobile}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className='flex sm:flex-col gap-2 justify-end pt-2 sm:pt-0'>
                                            <button
                                                onClick={() => {
                                                    setOpenEdit(true);
                                                    setEditData(address);
                                                }}
                                                className='flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm'
                                                aria-label='Edit address'
                                            >
                                                <Pencil size={16} />
                                                <span className='sm:hidden'>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDisableAddress(address._id)}
                                                className='flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors text-sm'
                                                aria-label='Delete address'
                                            >
                                                <Trash2 size={16} />
                                                <span className='sm:hidden'>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add New Address Card */}
                {activeAddresses.length > 0 && (
                    <button
                        onClick={() => setOpenAddress(true)}
                        className='w-full h-20 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 group'
                    >
                        <Plus size={20} className='group-hover:scale-110 transition-transform' />
                        <span className='font-medium'>Add Another Address</span>
                    </button>
                )}
            </div>

            {/* Modals */}
            {openAddress && (
                <AddAddress close={() => setOpenAddress(false)} />
            )}

            {OpenEdit && (
                <EditAddressDetails data={editData} close={() => setOpenEdit(false)} />
            )}
        </div>
    );
};

export default Address;
