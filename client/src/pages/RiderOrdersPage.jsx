import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    Package,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    History,
    TrendingUp,
    IndianRupee,
    Calendar
} from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

/**
 * Rider Order History Page
 *
 * Shows completed and failed deliveries with:
 * - Order details
 * - Earnings per order
 * - Filter by status
 * - Pagination
 */
export default function RiderOrdersPage() {

    // State
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.delivery.orderHistory,
                params: { page, status: status || undefined }
            });

            if (response.data.success) {
                setOrders(response.data.data.orders);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Fetch orders error:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, status]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Refresh handler
    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge
    const getStatusBadge = (orderStatus) => {
        switch (orderStatus) {
            case 'DELIVERED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">
                        <CheckCircle size={12} /> Delivered
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                        <XCircle size={12} /> Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-lg border border-yellow-200">
                        <Clock size={12} /> {orderStatus}
                    </span>
                );
        }
    };

    // Calculate stats
    const stats = {
        total: orders.length,
        delivered: orders.filter(o => o.order_status === 'DELIVERED').length,
        totalEarnings: orders.reduce((sum, o) => sum + (o.agent_earning?.totalEarning || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <History className="text-red-500" size={28} />
                            Order History
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Track your past deliveries and earnings
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing || loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total Orders</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{pagination?.total || stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-sm text-green-600">Delivered</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={16} className="text-blue-500" />
                            <span className="text-sm text-blue-600">Page Earnings</span>
                        </div>
                        <p className="text-xl font-bold text-blue-700">{DisplayPriceInRupees(stats.totalEarnings)}</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mt-6 flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
                    {[
                        { value: '', label: 'All Orders', icon: Package },
                        { value: 'DELIVERED', label: 'Completed', icon: CheckCircle },
                        { value: 'CANCELLED', label: 'Failed', icon: XCircle }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setStatus(tab.value);
                                    setPage(1);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    status === tab.value
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Orders List */}
            <div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">No orders found</h3>
                        <p className="text-gray-500">
                            {status
                                ? `You have no ${status.toLowerCase()} orders.`
                                : 'You haven\'t completed any deliveries yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group flex flex-col h-full">
                                {/* Order Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">#{order.orderId?.slice(-8)}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1" title={order.product_details?.name}>
                                            {order.product_details?.name}
                                        </h3>
                                    </div>
                                    {getStatusBadge(order.order_status)}
                                </div>

                                {/* Order Details */}
                                <div className="flex-1 space-y-3 mb-4">
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                                        <span className="text-sm text-gray-600 line-clamp-2">
                                            {order.delivery_address?.address_line}, {order.delivery_address?.city}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span>{formatDate(order.delivered_at || order.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Financials */}
                                <div className="pt-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white -mx-5 -mb-5 px-5 py-4 rounded-b-2xl mt-auto">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                            <IndianRupee size={12} />
                                            Earning
                                        </span>
                                        {order.agent_earning && (
                                            <span className="font-bold text-green-600 text-lg">
                                                +{DisplayPriceInRupees(order.agent_earning.totalEarning || 0)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Detailed Breakdown */}
                                    {order.agent_earning && order.order_status === 'DELIVERED' && (
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            <span className="bg-white px-2 py-1 rounded border border-gray-100">
                                                Base: {DisplayPriceInRupees(order.agent_earning.baseAmount)}
                                            </span>
                                            <span className="bg-white px-2 py-1 rounded border border-gray-100">
                                                Dist: {DisplayPriceInRupees(order.agent_earning.distanceBonus)}
                                            </span>
                                            {order.agent_earning.tipAmount > 0 && (
                                                <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-100 font-medium">
                                                    Tip: {DisplayPriceInRupees(order.agent_earning.tipAmount)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <span className="text-sm text-gray-500">
                            Page {page} of {pagination.totalPages} • {pagination.total} total orders
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <div className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-700">
                                {page} / {pagination.totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
