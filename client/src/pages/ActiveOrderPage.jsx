import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    Package,
    Navigation,
    MapPin,
    Phone,
    Store,
    ChevronLeft,
    Loader2,
    CheckCircle,
    IndianRupee,
    User,
    Clock,
    Banknote,
    X,
    ArrowRight,
    Bike,
    ExternalLink
} from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import RiderNavigationMap from '../components/RiderNavigationMap';

/**
 * Active Order Page - Production-level Blinkit/Zepto Style
 *
 * Clear two-phase delivery flow:
 * PHASE 1: PICKUP - Navigate to store, collect order
 * PHASE 2: DELIVERY - Navigate to customer, verify OTP, complete
 *
 * Features:
 * - Full-height navigation map with turn-by-turn directions
 * - Shows store location first, then customer location
 * - Real-time GPS tracking with smooth animation
 * - Professional UI matching industry standards
 */
export default function ActiveOrderPage() {
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);

    // Access global state from DeliveryLayout
    const {
        activeOrder: contextActiveOrder,
        setActiveOrder,
        fetchRiderStatus
    } = useOutletContext();

    // State
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [store, setStore] = useState(null);
    const [currentPhase, setCurrentPhase] = useState('pickup'); // 'pickup' | 'delivery'
    const [currentStep, setCurrentStep] = useState(1); // 1-4 for progress stepper
    const [actionLoading, setActionLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [codCollected, setCodCollected] = useState(false);

    // Step configuration for progress display
    const STEPS = [
        { num: 1, title: 'Go to Store', action: 'arrived-store', buttonText: "I've Arrived at Store", phase: 'pickup' },
        { num: 2, title: 'Collect Order', action: 'picked-up', buttonText: 'Order Collected', phase: 'pickup' },
        { num: 3, title: 'Deliver', action: 'reached', buttonText: "I've Reached Customer", phase: 'delivery' },
        { num: 4, title: 'Complete', action: null, buttonText: null, phase: 'complete' }
    ];

    // Fetch active order details
    const fetchOrderDetails = useCallback(async () => {
        if (contextActiveOrder) {
            setOrder(contextActiveOrder);

            // Determine current step and phase based on order status
            const status = contextActiveOrder.order_status;
            if (status === 'DISPATCHED') {
                setCurrentStep(1);
                setCurrentPhase('pickup');
            } else if (status === 'PACKED') {
                setCurrentStep(2);
                setCurrentPhase('pickup');
            } else if (status === 'OUT_FOR_DELIVERY') {
                setCurrentStep(3);
                setCurrentPhase('delivery');
            }

            // Fetch store details
            try {
                const response = await Axios({ ...SummaryApi.delivery.activeOrder });
                if (response.data.success && response.data.data) {
                    setStore(response.data.data.store);
                }
            } catch (error) {
                console.error('Fetch store details error:', error);
            }
            setLoading(false);
            return;
        }

        // Fallback: Try fetching directly
        try {
            const response = await Axios({ ...SummaryApi.delivery.activeOrder });
            if (response.data.success && response.data.data) {
                const orderData = response.data.data.order;
                setOrder(orderData);
                setStore(response.data.data.store);

                const status = orderData.order_status;
                if (status === 'DISPATCHED') {
                    setCurrentStep(1);
                    setCurrentPhase('pickup');
                } else if (status === 'PACKED') {
                    setCurrentStep(2);
                    setCurrentPhase('pickup');
                } else if (status === 'OUT_FOR_DELIVERY') {
                    setCurrentStep(3);
                    setCurrentPhase('delivery');
                }
            } else {
                setOrder(null);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [contextActiveOrder]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    // Handle step action
    const handleStepAction = async () => {
        if (!order) return;
        setActionLoading(true);

        try {
            const step = STEPS.find(s => s.num === currentStep);
            if (!step?.action) return;

            const response = await Axios({
                url: `/api/delivery/${step.action}/${order.orderId}`,
                method: 'POST'
            });

            if (response.data.success) {
                if (step.action === 'reached') {
                    setShowOtpModal(true);
                    toast.success('OTP sent to customer!');
                } else if (step.action === 'picked-up') {
                    toast.success('Order collected! Now deliver to customer.');
                    setCurrentStep(3);
                    setCurrentPhase('delivery');
                    fetchOrderDetails();
                    if (fetchRiderStatus) fetchRiderStatus();
                } else {
                    toast.success(response.data.message);
                    setCurrentStep(prev => prev + 1);
                    fetchOrderDetails();
                    if (fetchRiderStatus) fetchRiderStatus();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Enter valid 6-digit OTP');
            return;
        }

        setActionLoading(true);
        try {
            const response = await Axios({
                url: `/api/delivery/verify-otp/${order.orderId}`,
                method: 'POST',
                data: { otp, codCollected }
            });

            if (response.data.success) {
                toast.success(`Delivery complete! Earned ₹${response.data.data.earning.totalEarning}`);
                if (setActiveOrder) setActiveOrder(null);
                if (fetchRiderStatus) fetchRiderStatus();
                navigate('/delivery');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setActionLoading(false);
        }
    };

    // Call handlers
    const handleCallStore = () => {
        if (store?.phone) {
            window.open(`tel:${store.phone}`, '_self');
        }
    };

    const handleCallCustomer = () => {
        if (order?.userId?.mobile) {
            window.open(`tel:${order.userId.mobile}`, '_self');
        }
    };

    // Prepare location data for the map
    const storeLocationData = store ? {
        lat: store.latitude,
        lng: store.longitude,
        name: store.name,
        address: `${store.address?.addressLine || ''}, ${store.address?.city || ''}`,
        phone: store.phone
    } : null;

    const customerLocationData = order?.delivery_address ? {
        lat: order.delivery_address.latitude,
        lng: order.delivery_address.longitude,
        name: order.userId?.name || 'Customer',
        address: `${order.delivery_address.address_line}, ${order.delivery_address.city}`,
        phone: order.userId?.mobile
    } : null;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                    <p className="text-gray-500 text-sm">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <Navigation size={24} className="text-gray-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Active Order</h1>
                            <p className="text-gray-500 text-sm">Track your current delivery</p>
                        </div>
                    </div>
                </div>

                {/* No Active Order State */}
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package size={40} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Order</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        You don't have any active deliveries at the moment. Accept an order from the dashboard to start delivering.
                    </p>
                    <Link
                        to="/delivery"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
                    >
                        <ArrowRight size={18} />
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Compact Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/delivery"
                            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            <ChevronLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-gray-900">Active Delivery</h1>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                    currentPhase === 'pickup'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-green-100 text-green-700'
                                }`}>
                                    {currentPhase === 'pickup' ? 'PICKUP' : 'DELIVERY'}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm font-mono">#{order.orderId?.slice(-8)}</p>
                        </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map((step) => (
                            <div
                                key={step}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                    currentStep > step ? 'bg-green-500' :
                                    currentStep === step ? 'bg-gray-900' : 'bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Map Section - Takes most of the screen */}
            <div className="flex-1 relative min-h-0">
                <RiderNavigationMap
                    storeLocation={storeLocationData}
                    customerLocation={customerLocationData}
                    currentPhase={currentPhase}
                    height="100%"
                    showControls={true}
                    onCallStore={handleCallStore}
                    onCallCustomer={handleCallCustomer}
                    className="rounded-none"
                />
            </div>

            {/* Bottom Action Panel */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
                {/* Order Summary */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {order.product_details?.image?.[0] && (
                                <img
                                    src={order.product_details.image[0]}
                                    alt=""
                                    className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                                />
                            )}
                            <div>
                                <p className="font-medium text-gray-900 text-sm line-clamp-1">
                                    {order.product_details?.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-sm font-bold text-gray-900 flex items-center">
                                        <IndianRupee size={12} />
                                        {order.totalAmt}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        order.payment_method === 'cod'
                                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                            : 'bg-green-50 text-green-700 border border-green-200'
                                    }`}>
                                        {order.payment_method === 'cod' ? 'COD' : 'Prepaid'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {order.cod_amount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-xl border border-yellow-200">
                                <Banknote size={16} className="text-yellow-600" />
                                <span className="font-bold text-yellow-700">₹{order.cod_amount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Step Info */}
                <div className="px-4 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                            currentStep === 1 ? 'bg-amber-100' :
                            currentStep === 2 ? 'bg-yellow-100' :
                            currentStep === 3 ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                            {currentStep === 1 && <Store size={28} className="text-amber-600" />}
                            {currentStep === 2 && <Package size={28} className="text-yellow-600" />}
                            {currentStep === 3 && <MapPin size={28} className="text-green-600" />}
                            {currentStep === 4 && <CheckCircle size={28} className="text-gray-600" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">
                                {STEPS.find(s => s.num === currentStep)?.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {currentStep === 1 && 'Navigate to store and collect the order'}
                                {currentStep === 2 && 'Show order ID to store staff and collect package'}
                                {currentStep === 3 && 'Navigate to customer and deliver the order'}
                                {currentStep === 4 && 'Delivery completed successfully!'}
                            </p>
                        </div>
                    </div>

                    {/* Contextual Info Based on Step */}
                    {currentStep === 2 && (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4 text-center">
                            <p className="text-xs text-amber-600 font-medium mb-1">SHOW THIS TO STORE</p>
                            <p className="text-3xl font-bold text-amber-700 tracking-[0.3em] font-mono">
                                {order.orderId?.slice(-8)}
                            </p>
                        </div>
                    )}

                    {/* Action Button */}
                    {currentStep < 4 && (
                        <button
                            onClick={handleStepAction}
                            disabled={actionLoading}
                            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-base shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    {STEPS.find(s => s.num === currentStep)?.buttonText}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                    <CheckCircle size={32} className="text-white" />
                                </div>
                                <h2 className="text-xl font-bold">Verify Delivery</h2>
                                <p className="text-gray-400 text-sm mt-1">Ask customer for the OTP</p>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                                    Enter 6-digit OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10 outline-none transition-all"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            {order.cod_amount > 0 && (
                                <label className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl cursor-pointer border border-yellow-200 hover:bg-yellow-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={codCollected}
                                        onChange={(e) => setCodCollected(e.target.checked)}
                                        className="w-5 h-5 rounded accent-gray-900"
                                    />
                                    <span className="text-sm text-gray-700 font-medium flex items-center gap-2">
                                        <Banknote size={16} className="text-yellow-600" />
                                        Collected <span className="font-bold">₹{order.cod_amount}</span> cash
                                    </span>
                                </label>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowOtpModal(false)}
                                    className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={actionLoading || otp.length !== 6}
                                    className="flex-1 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            Complete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
