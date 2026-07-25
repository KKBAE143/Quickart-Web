import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Package,
    MapPin,
    Phone,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Loader2,
    IndianRupee,
    Truck,
    ShoppingBag,
    Copy,
    Check,
    Share2,
    MessageCircle,
    HelpCircle,
    ChevronRight,
    Clock,
    Gift
} from 'lucide-react';
import LiveTrackingMap from '../components/LiveTrackingMap';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { useSocket } from '../provider/SocketProvider';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';

const TrackOrderPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { trackOrder, untrackOrder, onOrderStatusUpdate, offOrderStatusUpdate } = useSocket();

    const groupedItems = location.state?.groupedItems || null;
    const groupTotalAmount = location.state?.totalAmount || null;
    const groupItemCount = location.state?.itemCount || null;

    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [otpCopied, setOtpCopied] = useState(false);
    const [showAllItems, setShowAllItems] = useState(false);

    const fetchOrderDetails = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            setError(null);

            const response = await Axios({
                ...SummaryApi.trackOrder,
                url: SummaryApi.trackOrder.url.replace(':orderId', orderId)
            });

            if (response.data.success) {
                setOrderData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch order details');
            }
        } catch (err) {
            console.error('Track order error:', err);
            setError(err.response?.data?.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) {
            trackOrder(orderId);

            const handleStatusUpdate = (data) => {
                if (data.orderId === orderId) {
                    fetchOrderDetails(true);
                    toast.success(`Order ${data.order_status.replace(/_/g, ' ').toLowerCase()}`);
                }
            };

            onOrderStatusUpdate(handleStatusUpdate);

            return () => {
                untrackOrder(orderId);
                offOrderStatusUpdate(handleStatusUpdate);
            };
        }
    }, [orderId]);

    const copyOtp = () => {
        if (orderData?.delivery_otp) {
            navigator.clipboard.writeText(orderData.delivery_otp);
            setOtpCopied(true);
            toast.success('OTP copied!');
            setTimeout(() => setOtpCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Track my order',
            text: `Track my Quickart order`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied!');
                }
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied!');
        }
    };

    const getStatusSteps = () => {
        const steps = [
            { key: 'PENDING', label: 'Placed', icon: Package },
            { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
            { key: 'PROCESSING', label: 'Packing', icon: ShoppingBag },
            { key: 'OUT_FOR_DELIVERY', label: 'On the way', icon: Truck },
            { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
        ];

        const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        const currentIndex = statusOrder.indexOf(orderData?.order_status);

        return steps.map((step, index) => ({
            ...step,
            completed: index <= currentIndex,
            current: index === currentIndex
        }));
    };

    const getEstimatedTime = () => {
        if (orderData?.order_status === 'OUT_FOR_DELIVERY') {
            return '10-15 mins';
        } else if (orderData?.order_status === 'PROCESSING') {
            return '20-30 mins';
        } else if (orderData?.order_status === 'CONFIRMED') {
            return '25-35 mins';
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-green-500 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading order...</p>
                </div>
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={28} className="text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Order not found</h2>
                    <p className="text-gray-500 text-sm mb-6">{error || 'Unable to find this order'}</p>
                    <button
                        onClick={() => navigate('/dashboard/myorders')}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
                    >
                        View My Orders
                    </button>
                </div>
            </div>
        );
    }

    const isCancelled = orderData.order_status === 'CANCELLED';
    const isDelivered = orderData.order_status === 'DELIVERED';
    const isOutForDelivery = orderData.order_status === 'OUT_FOR_DELIVERY';
    const isPending = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(orderData.order_status);
    const steps = getStatusSteps();
    const estimatedTime = getEstimatedTime();

    const allItems = groupedItems || (orderData.product_details ? [{ ...orderData, product_details: orderData.product_details }] : []);
    const displayItems = showAllItems ? allItems : allItems.slice(0, 2);
    const hasMoreItems = allItems.length > 2;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-base font-semibold text-gray-900">Track Order</h1>
                            <p className="text-xs text-gray-500">#{orderData.orderId}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleShare}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Share2 size={18} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Status Banner with ETA */}
                {isCancelled ? (
                    <div className="bg-red-50 border-b border-red-100 px-4 py-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle size={24} className="text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-red-700 text-lg">Order Cancelled</p>
                                <p className="text-sm text-red-600">
                                    {orderData.cancellation_reason || 'Your order has been cancelled'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : isDelivered ? (
                    <div className="bg-green-50 border-b border-green-100 px-4 py-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={24} className="text-green-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-green-700 text-lg">Delivered Successfully</p>
                                <p className="text-sm text-green-600">Thank you for ordering with Quickart!</p>
                            </div>
                        </div>
                    </div>
                ) : isOutForDelivery ? (
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                                    <Truck size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-lg">On the way!</p>
                                    <p className="text-sm text-blue-100">Arriving in {estimatedTime}</p>
                                </div>
                            </div>
                            {orderData.delivery_partner?.phone && (
                                <a
                                    href={`tel:${orderData.delivery_partner.phone}`}
                                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <Phone size={20} className="text-blue-600" />
                                </a>
                            )}
                        </div>
                    </div>
                ) : isPending && estimatedTime ? (
                    <div className="bg-white border-b border-gray-100 px-4 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Clock size={20} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Estimated delivery</p>
                                <p className="font-semibold text-gray-900">{estimatedTime}</p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Live Map - Only when out for delivery */}
                {isOutForDelivery && orderData.delivery_address && (
                    <div className="bg-white border-b border-gray-100">
                        <LiveTrackingMap
                            orderId={orderData._id}
                            deliveryAddress={orderData.delivery_address}
                            storeLocation={orderData.store_location}
                            initialRiderLocation={orderData.agent_location}
                            riderInfo={{
                                name: orderData.delivery_partner?.name,
                                phone: orderData.delivery_partner?.phone,
                                vehicleNumber: orderData.delivery_partner?.vehicle_number
                            }}
                            orderStatus={orderData.order_status}
                            onCall={(phone) => window.open(`tel:${phone}`, '_self')}
                            variant="customer"
                            showRiderCard={false}
                            showStatusBar={false}
                            height="220px"
                        />
                    </div>
                )}

                {/* OTP Section */}
                {orderData.delivery_otp && isOutForDelivery && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-700 font-medium mb-1">DELIVERY OTP</p>
                                <p className="text-3xl font-bold tracking-[0.2em] text-green-800">{orderData.delivery_otp}</p>
                            </div>
                            <button
                                onClick={copyOtp}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium text-white transition-colors"
                            >
                                {otpCopied ? <Check size={16} /> : <Copy size={16} />}
                                {otpCopied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-xs text-green-600 mt-2">Share this with your delivery partner</p>
                    </div>
                )}

                {/* Progress Steps */}
                {!isCancelled && (
                    <div className="bg-white px-4 py-6 border-b border-gray-100">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
                                <div
                                    className="h-full bg-green-500 transition-all duration-500"
                                    style={{
                                        width: `${(steps.filter(s => s.completed).length - 1) / (steps.length - 1) * 100}%`
                                    }}
                                />
                            </div>

                            {steps.map((step) => (
                                <div key={step.key} className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        step.completed
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                    }`}>
                                        <step.icon size={14} />
                                    </div>
                                    <span className={`text-[10px] mt-2 text-center max-w-[50px] leading-tight ${
                                        step.completed ? 'text-green-600 font-medium' : 'text-gray-400'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivery Address */}
                {orderData.delivery_address && (
                    <div className="bg-white px-4 py-4 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <MapPin size={18} className="text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-0.5">Delivering to</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {orderData.delivery_address.address_line}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {orderData.delivery_address.city}, {orderData.delivery_address.state} - {orderData.delivery_address.pincode}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-white px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Order Summary
                        </h3>
                        <span className="text-xs text-gray-500">
                            {allItems.length} item{allItems.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {displayItems.map((item, index) => (
                            <div key={item._id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                {item.product_details?.image?.[0] && (
                                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-white">
                                        <img
                                            src={item.product_details.image[0]}
                                            alt={item.product_details.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 font-medium line-clamp-1">
                                        {item.product_details?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Qty: 1 {item.product_details?.unit && `• ${item.product_details.unit}`}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 flex items-center">
                                    <IndianRupee size={12} />
                                    {(item.totalAmt || item.subTotalAmt || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                        ))}
                    </div>

                    {hasMoreItems && (
                        <button
                            onClick={() => setShowAllItems(!showAllItems)}
                            className="w-full mt-3 py-2 text-sm text-green-600 font-medium flex items-center justify-center gap-1"
                        >
                            {showAllItems ? 'Show less' : `View all ${allItems.length} items`}
                            <ChevronRight size={16} className={`transition-transform ${showAllItems ? 'rotate-90' : ''}`} />
                        </button>
                    )}

                    {/* Bill Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Item total</span>
                            <span>{DisplayPriceInRupees(groupTotalAmount || orderData.subTotalAmt)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Delivery fee</span>
                            <span className="text-green-600 font-medium">FREE</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-dashed border-gray-200">
                            <span>Grand Total</span>
                            <span className="flex items-center">
                                <IndianRupee size={14} />
                                {(groupTotalAmount || orderData.totalAmt || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Payment Badge */}
                    <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                <IndianRupee size={14} className="text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Payment</p>
                                <p className="text-sm font-medium text-gray-900">{orderData.payment_method}</p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            orderData.payment_status === 'PAID'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {orderData.payment_status}
                        </span>
                    </div>
                </div>

                {/* Promotional Banner */}
                {isDelivered && (
                    <div className="mx-4 mt-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Gift size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">Enjoyed your order?</p>
                                <p className="text-sm text-green-100">Get 10% off on your next order!</p>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 bg-white text-green-600 font-semibold rounded-xl text-sm hover:bg-green-50 transition-colors"
                            >
                                Shop Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Help Section */}
                <div className="px-4 py-6">
                    <div className="bg-gray-100 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <HelpCircle size={20} className="text-gray-500" />
                            <p className="font-semibold text-gray-900">Need help with your order?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href="tel:+911234567890"
                                className="flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <Phone size={16} />
                                Call Support
                            </a>
                            <button className="flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors border border-gray-200">
                                <MessageCircle size={16} />
                                Live Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackOrderPage;
