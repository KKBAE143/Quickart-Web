import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    RefreshCw,
    Power,
    MapPin,
    Package,
    IndianRupee,
    Clock,
    Navigation,
    AlertCircle,
    Wallet,
    Loader2,
    Bike,
    CheckCircle,
    X,
    Banknote,
    TrendingUp,
    CircleDot
} from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { socketService } from '../config/socket';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

/**
 * Delivery Dashboard
 *
 * Main dashboard for delivery partners.
 * Uses DeliveryLayout context for global state (isOnline, activeOrder, etc.)
 */
export default function DeliveryDashboard() {
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);

    // Access global state from DeliveryLayout
    const {
        isOnline,
        toggleOnlineStatus,
        activeOrder,
        setActiveOrder,
        accountStatus
    } = useOutletContext();

    // Local Dashboard state (Stats & Available Orders)
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Check if user is a delivery agent
    useEffect(() => {
        if (user?._id && user?.role !== 'DELIVERY_AGENT') {
            toast.error('Access denied. Delivery agent account required.');
            navigate('/');
        }
    }, [user, navigate]);

    // Fetch dashboard data (Stats & Orders)
    const fetchDashboard = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delivery.dashboard,
            });

            if (response.data.success) {
                const data = response.data.data;
                setDashboardData(data);
                setAvailableOrders(data.availableOrders || []);

                // Sync active order with global state if changed
                if (data.activeOrder && (!activeOrder || activeOrder.orderId !== data.activeOrder.orderId)) {
                    setActiveOrder(data.activeOrder);
                }
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [setActiveOrder, activeOrder]);

    // Initial load
    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Refresh dashboard
    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    // Accept order
    const handleAcceptOrder = async (orderId) => {
        try {
            const response = await Axios({
                url: `/api/delivery/accept/${orderId}`,
                method: 'POST'
            });

            if (response.data.success) {
                toast.success('Order accepted!');
                setActiveOrder(response.data.data.order);
                setAvailableOrders([]);
                navigate(`/delivery/active-order`);
            }
        } catch (error) {
            console.error('Accept order error:', error);
            toast.error(error.response?.data?.message || 'Failed to accept order');
        }
    };

    // Decline order
    const handleDeclineOrder = async (orderId) => {
        try {
            await Axios({
                url: `/api/delivery/decline/${orderId}`,
                method: 'POST'
            });
            setAvailableOrders(prev => prev.filter(o => o.orderId !== orderId));
            toast.success('Order declined');
        } catch (error) {
            console.error('Decline order error:', error);
        }
    };

    // Listen for new orders via socket
    useEffect(() => {
        const handleNewOrder = (data) => {
            if (!isOnline) return; // Ignore if offline
            toast('New order available!', { icon: '📦' });
            setAvailableOrders(prev => {
                // Prevent duplicates
                if (prev.find(o => o.orderId === data.order.orderId)) return prev;
                return [data.order, ...prev];
            });
        };

        socketService.socket?.on('new-delivery-available', handleNewOrder);

        return () => {
            socketService.socket?.off('new-delivery-available', handleNewOrder);
        };
    }, [isOnline]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <Loader2 size={40} className="animate-spin text-gray-400" />
                <p className="text-gray-500 text-sm">Loading dashboard...</p>
            </div>
        );
    }

    // Show pending approval / rejected / suspended screen
    if (accountStatus && accountStatus !== 'VERIFIED') {
        const isPendingApproval = accountStatus === 'PENDING';
        const isRejected = accountStatus === 'REJECTED';
        const isSuspended = accountStatus === 'SUSPENDED';

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
                    {/* Icon based on status */}
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                        isPendingApproval ? 'bg-yellow-50' :
                        isRejected ? 'bg-red-50' : 'bg-orange-50'
                    }`}>
                        {isPendingApproval && (
                            <Clock size={40} className="text-yellow-600" />
                        )}
                        {isRejected && (
                            <X size={40} className="text-red-600" />
                        )}
                        {isSuspended && (
                            <AlertCircle size={40} className="text-orange-600" />
                        )}
                    </div>

                    {/* Status Title */}
                    <h2 className={`text-2xl font-bold mb-3 ${
                        isPendingApproval ? 'text-yellow-700' :
                        isRejected ? 'text-red-700' : 'text-orange-700'
                    }`}>
                        {isPendingApproval && 'Account Pending Approval'}
                        {isRejected && 'Application Rejected'}
                        {isSuspended && 'Account Suspended'}
                    </h2>

                    {/* Status Message */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {dashboardData?.message || 'Please contact support for more details.'}
                    </p>

                    {/* Additional info for pending */}
                    {isPendingApproval && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
                            <p className="text-sm text-yellow-800">
                                <strong className="flex items-center gap-2 mb-2">
                                    <Clock size={14} />
                                    What happens next?
                                </strong>
                                Our team will verify your documents and background check.
                                This usually takes 24-48 hours. We'll notify you once approved.
                            </p>
                        </div>
                    )}

                    {/* Refresh button */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        Check Status
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status & Actions Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Bike className="text-red-500" size={28} />
                            Dashboard
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {isOnline ? 'You are online and receiving orders' : 'Go online to start earning'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <button
                            onClick={toggleOnlineStatus}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all ${
                                isOnline
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                        >
                            <Power size={18} />
                            {isOnline ? 'On Duty' : 'Go Online'}
                        </button>
                    </div>
                </div>

                {/* Online Status Indicator */}
                <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isOnline
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                    <CircleDot size={16} className={isOnline ? 'text-green-500 animate-pulse' : 'text-gray-400'} />
                    {isOnline ? 'Active and ready to receive orders' : 'Currently offline - not receiving orders'}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <TrendingUp size={22} />
                        </div>
                        <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">Today</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{DisplayPriceInRupees(dashboardData?.wallet?.todayEarnings || 0)}</p>
                    <p className="text-blue-100 text-sm font-medium">Today's Earnings</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Package size={22} className="text-orange-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.wallet?.todayDeliveries || 0}</p>
                    <p className="text-gray-500 text-sm font-medium">Deliveries Completed</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <Wallet size={22} className="text-green-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{DisplayPriceInRupees(dashboardData?.wallet?.currentBalance || 0)}</p>
                    <p className="text-gray-500 text-sm font-medium">Wallet Balance</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Banknote size={22} className="text-purple-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{DisplayPriceInRupees(dashboardData?.wallet?.todayCashCollected || 0)}</p>
                    <p className="text-gray-500 text-sm font-medium">Cash Collected</p>
                </div>
            </div>

            {/* Active Order Card */}
            {activeOrder && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                                <h3 className="font-bold text-gray-900 text-lg">Active Delivery</h3>
                            </div>
                            <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg uppercase tracking-wide border border-red-200">
                                {activeOrder.order_status}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                                    <p className="font-mono font-semibold text-gray-900">#{activeOrder.orderId?.slice(-8)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Customer Order</p>
                                    <h4 className="font-bold text-gray-900 text-lg">{activeOrder.product_details?.name}</h4>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => navigate('/delivery/active-order')}
                                    className="w-full md:w-auto px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <span>View Details & Navigate</span>
                                    <Navigation size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Orders Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <Package size={20} className="text-gray-400" />
                            New Requests
                        </h3>
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                            {availableOrders.length} orders nearby
                        </span>
                    </div>
                </div>

                <div className="p-5">
                    {/* Offline State */}
                    {!isOnline && (
                        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Power size={32} className="text-gray-400" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">You are currently offline</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                Go online to start receiving delivery requests from nearby stores.
                            </p>
                            <button
                                onClick={toggleOnlineStatus}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                            >
                                Go Online Now
                            </button>
                        </div>
                    )}

                    {/* Online but no orders */}
                    {isOnline && !activeOrder && availableOrders.length === 0 && (
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Package size={40} className="text-blue-500 animate-bounce" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-xl mb-2">Searching for orders...</h3>
                            <p className="text-gray-500">
                                We're looking for delivery requests near your location.
                                <br />Please stay on this screen.
                            </p>
                        </div>
                    )}

                    {/* Orders List */}
                    {isOnline && availableOrders.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {availableOrders.map((order) => (
                                <div key={order._id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:bg-white transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-gray-200 group-hover:border-red-200 group-hover:bg-red-50 transition-colors">
                                                <Package size={20} className="text-gray-500 group-hover:text-red-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{order.product_details?.name}</h4>
                                                <p className="text-xs text-gray-500 font-mono">#{order.orderId?.slice(-8)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600 text-lg">{DisplayPriceInRupees(order.estimatedEarning || 25)}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Earning</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                            <MapPin size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-600 font-medium">
                                                {order.delivery_address?.address_line}, {order.delivery_address?.city}
                                            </span>
                                        </div>
                                        {order.distance && (
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg w-fit border border-blue-100">
                                                <Navigation size={12} />
                                                <span>{order.distance.toFixed(1)} km away</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleDeclineOrder(order.orderId)}
                                            className="py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                                        >
                                            Ignore
                                        </button>
                                        <button
                                            onClick={() => handleAcceptOrder(order.orderId)}
                                            className="py-3 px-4 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
