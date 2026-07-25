import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Package,
    MapPin,
    CreditCard,
    Clock,
    Home,
    ClipboardList,
    Truck,
    Mail,
    Phone,
    Calendar,
    IndianRupee,
    ShoppingBag,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

const Success = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const orderData = location?.state?.orderData;
    const orderType = location?.state?.text || "Order";

    // Use real order ID if available
    const displayOrderId = orderData?.orderId || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4'>
            <div className='max-w-4xl mx-auto'>

                {/* Success Header */}
                <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center'>
                    <div className='flex justify-center mb-6'>
                        <div className='relative'>
                            <div className='w-24 h-24 bg-green-50 rounded-full flex items-center justify-center'>
                                <CheckCircle size={56} className='text-green-500' />
                            </div>
                            <div className='absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                                <Sparkles size={16} className='text-white' />
                            </div>
                        </div>
                    </div>

                    <h1 className='text-2xl md:text-3xl font-bold text-gray-900 mb-2'>
                        {orderType} Placed Successfully!
                    </h1>
                    <p className='text-gray-500'>
                        Thank you for shopping with Quickart
                    </p>

                    {orderData && (
                        <div className='mt-6 flex flex-col sm:flex-row justify-center items-center gap-4'>
                            <div className='bg-gray-50 px-6 py-4 rounded-xl border border-gray-100'>
                                <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>Order ID</p>
                                <p className='text-gray-900 font-bold font-mono'>{displayOrderId}</p>
                            </div>
                            <div className='bg-gray-50 px-6 py-4 rounded-xl border border-gray-100'>
                                <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>Order Date</p>
                                <p className='text-gray-900 font-semibold'>{formatDate(orderData.orderDate)}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Show detailed order information if available */}
                {orderData ? (
                    <>
                        {/* Scheduled Delivery Slot */}
                        {orderData.deliverySlot && orderData.deliveryDate && (
                            <div className='bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-lg p-6 mb-6 text-white relative overflow-hidden'>
                                <div className='absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl'></div>
                                <div className='relative z-10 flex items-center gap-4'>
                                    <div className='w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm'>
                                        <Calendar size={28} className='text-white' />
                                    </div>
                                    <div className='flex-1'>
                                        <p className='text-gray-400 text-sm'>Scheduled Delivery</p>
                                        <p className='text-2xl font-bold'>{orderData.deliverySlot}</p>
                                        <p className='text-gray-400 text-sm mt-0.5'>
                                            {new Date(orderData.deliveryDate).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Items */}
                        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
                            <div className='flex items-center gap-3 mb-5 pb-4 border-b border-gray-100'>
                                <div className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center'>
                                    <Package size={20} className='text-gray-600' />
                                </div>
                                <h2 className='text-lg font-bold text-gray-900'>Order Items</h2>
                            </div>

                            <div className='space-y-3'>
                                {orderData.items.map((item, index) => (
                                    <div key={index} className='flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors'>
                                        <img
                                            src={item.productId?.image[0]}
                                            alt={item.productId?.name}
                                            className='w-16 h-16 object-cover rounded-xl border border-gray-100'
                                        />
                                        <div className='flex-1 min-w-0'>
                                            <h3 className='font-semibold text-gray-900 line-clamp-1'>{item.productId?.name}</h3>
                                            <p className='text-sm text-gray-500 mt-1'>
                                                Qty: <span className='font-medium text-gray-700'>{item.quantity}</span>
                                            </p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='font-bold text-gray-900 flex items-center gap-1'>
                                                <IndianRupee size={14} />
                                                {(item.productId?.price * item.quantity).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Address */}
                        {orderData.address && (
                            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
                                <div className='flex items-center gap-3 mb-5 pb-4 border-b border-gray-100'>
                                    <div className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center'>
                                        <MapPin size={20} className='text-gray-600' />
                                    </div>
                                    <h2 className='text-lg font-bold text-gray-900'>Delivery Address</h2>
                                </div>

                                <div className='bg-gray-50 p-5 rounded-xl border border-gray-100'>
                                    <p className='text-gray-900 font-semibold mb-2'>
                                        {orderData.address.address_line}
                                    </p>
                                    <p className='text-gray-600 text-sm'>
                                        {orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}
                                    </p>
                                    <p className='text-gray-600 text-sm'>
                                        {orderData.address.country}
                                    </p>
                                    {orderData.address.mobile && (
                                        <div className='mt-4 pt-4 border-t border-gray-200'>
                                            <p className='text-sm text-gray-600 flex items-center gap-2'>
                                                <Phone size={14} className='text-gray-400' />
                                                <span className='font-medium text-gray-700'>+91 {orderData.address.mobile}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Summary */}
                        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
                            <div className='flex items-center gap-3 mb-5 pb-4 border-b border-gray-100'>
                                <div className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center'>
                                    <CreditCard size={20} className='text-gray-600' />
                                </div>
                                <h2 className='text-lg font-bold text-gray-900'>Payment Summary</h2>
                            </div>

                            <div className='space-y-3'>
                                <div className='flex justify-between items-center py-2'>
                                    <span className='text-gray-500'>Subtotal</span>
                                    <span className='font-medium text-gray-900'>
                                        {DisplayPriceInRupees(orderData.subTotal)}
                                    </span>
                                </div>

                                <div className='flex justify-between items-center py-2'>
                                    <span className='text-gray-500'>Delivery Fee</span>
                                    <span className='font-medium text-green-600'>FREE</span>
                                </div>

                                <div className='border-t border-gray-100 pt-4 mt-4'>
                                    <div className='flex justify-between items-center'>
                                        <span className='font-bold text-gray-900'>Total Amount</span>
                                        <span className='text-xl font-bold text-gray-900 flex items-center gap-1'>
                                            <IndianRupee size={18} />
                                            {(orderData.totalAmount || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>

                                <div className='bg-gray-50 p-4 rounded-xl mt-4 border border-gray-100'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100'>
                                            <CreditCard size={18} className='text-gray-600' />
                                        </div>
                                        <div>
                                            <p className='text-xs text-gray-500 uppercase tracking-wider'>Payment Method</p>
                                            <p className='font-semibold text-gray-900'>{orderData.paymentMethod}</p>
                                            {orderData.paymentId && (
                                                <p className='text-xs text-gray-500 mt-0.5 font-mono'>ID: {orderData.paymentId}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    // Fallback for simple success message without order data
                    <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center'>
                        <p className='text-gray-600'>
                            Your {orderType.toLowerCase()} has been processed successfully!
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-8'>
                    <Link
                        to="/dashboard/myorders"
                        className='flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-xl transition-colors'
                    >
                        <ClipboardList size={20} />
                        <span>View All Orders</span>
                    </Link>

                    <button
                        onClick={() => navigate('/dashboard/myorders')}
                        className='flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors'
                    >
                        <Truck size={20} />
                        <span>Track Order</span>
                    </button>

                    <Link
                        to="/"
                        className='flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors'
                    >
                        <ShoppingBag size={20} />
                        <span>Continue Shopping</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Help Section */}
                <div className='mt-8 bg-gray-50 rounded-2xl border border-gray-200 p-6'>
                    <div className='text-center'>
                        <p className='text-gray-700 font-semibold mb-4'>Need help with your order?</p>
                        <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                            <a
                                href="mailto:support@quickart.com"
                                className='flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-sm'
                            >
                                <Mail size={16} className='text-gray-500' />
                                <span className='text-gray-700'>support@quickart.com</span>
                            </a>
                            <a
                                href="tel:1800-123-4567"
                                className='flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-sm'
                            >
                                <Phone size={16} className='text-gray-500' />
                                <span className='text-gray-700'>1800-123-4567</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Success;
