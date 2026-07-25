import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaMotorcycle, FaUserShield, FaPhone, FaArrowRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import { setUserDetails } from '../store/userSlice';

const EditRoleMobile = () => {
    const user = useSelector(state => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [selectedRole, setSelectedRole] = useState('');
    const [mobileNumber, setMobileNumber] = useState(user?.mobile || '');
    const [loading, setLoading] = useState(false);
    const [adminExists, setAdminExists] = useState(false);
    
    // Check if admin already exists
    useEffect(() => {
        const checkAdminExists = async () => {
            try {
                const response = await Axios({
                    url: '/api/user/check-admin',
                    method: 'get'
                });
                setAdminExists(response.data.exists);
            } catch (error) {
                console.error('Error checking admin:', error);
            }
        };
        
        checkAdminExists();
    }, []);
    
    // Role options
    const roles = [
        {
            value: 'USER',
            label: 'Customer',
            icon: <FaUser className="text-4xl" />,
            description: 'Shop and order products',
            color: 'blue',
            available: true
        },
        {
            value: 'DELIVERY_AGENT',
            label: 'Delivery Agent',
            icon: <FaMotorcycle className="text-4xl" />,
            description: 'Deliver orders and earn money',
            color: 'green',
            available: true
        },
        {
            value: 'ADMIN',
            label: 'Admin',
            icon: <FaUserShield className="text-4xl" />,
            description: 'Manage the platform',
            color: 'red',
            available: !adminExists
        }
    ];
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedRole) {
            toast.error('Please select a role');
            return;
        }
        
        if (!mobileNumber || mobileNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await Axios({
                url: '/api/user/update-role-mobile',
                method: 'put',
                data: {
                    role: selectedRole,
                    mobile: mobileNumber
                }
            });
            
            if (response.data.success) {
                // Update user details in Redux store
                dispatch(setUserDetails(response.data.data));
                
                toast.success('Profile updated successfully!');
                
                // Navigate based on role
                if (selectedRole === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (selectedRole === 'DELIVERY_AGENT') {
                    navigate('/agent/profile'); // Complete agent profile
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error('Update role error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Complete Your Profile
                    </h1>
                    <p className="text-gray-600">
                        Choose your role and provide your mobile number
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => role.available && setSelectedRole(role.value)}
                                disabled={!role.available}
                                className={`
                                    relative p-6 rounded-xl border-2 transition-all duration-300
                                    ${selectedRole === role.value
                                        ? `border-${role.color}-600 bg-${role.color}-50 shadow-lg scale-105`
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                    }
                                    ${!role.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                {!role.available && (
                                    <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-semibold">
                                        Unavailable
                                    </div>
                                )}
                                
                                <div className={`
                                    flex flex-col items-center text-center
                                    ${selectedRole === role.value ? `text-${role.color}-600` : 'text-gray-600'}
                                `}>
                                    <div className="mb-3">
                                        {role.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {role.label}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {role.description}
                                    </p>
                                    
                                    {selectedRole === role.value && (
                                        <div className="mt-4">
                                            <div className={`w-6 h-6 rounded-full bg-${role.color}-600 flex items-center justify-center`}>
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    {/* Mobile Number Input */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <FaPhone className="inline mr-2 text-red-600" />
                            Mobile Number
                        </label>
                        <div className="flex gap-2">
                            <div className="flex items-center px-4 bg-gray-100 rounded-lg border border-gray-300">
                                <span className="font-semibold text-gray-700">+91</span>
                            </div>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="Enter 10-digit mobile number"
                                maxLength="10"
                                required
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                            />
                        </div>
                        {mobileNumber && mobileNumber.length !== 10 && (
                            <p className="text-xs text-red-600 mt-1">
                                Please enter a valid 10-digit mobile number
                            </p>
                        )}
                    </div>
                    
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!selectedRole || !mobileNumber || mobileNumber.length !== 10 || loading}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                Continue
                                <FaArrowRight />
                            </>
                        )}
                    </button>
                </form>
                
                {/* Info Note */}
                {selectedRole === 'DELIVERY_AGENT' && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> After selecting Delivery Agent, you'll need to complete your profile with vehicle details and documents for verification.
                        </p>
                    </div>
                )}
                
                {selectedRole === 'ADMIN' && adminExists && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                            <strong>Admin role is not available:</strong> An admin account already exists for this platform.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditRoleMobile;

