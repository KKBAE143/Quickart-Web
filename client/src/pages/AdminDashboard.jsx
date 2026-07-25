import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Package,
    ShoppingCart,
    Users,
    Truck,
    TrendingUp,
    IndianRupee,
    Star,
    AlertCircle,
    RefreshCw,
    ArrowRight,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Tags,
    Box,
    Wallet
} from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import isAdmin from '../utils/isAdmin';

/**
 * Admin Dashboard
 *
 * Overview page showing key metrics and quick stats for admin users.
 */
export default function AdminDashboard() {
    const user = useSelector((state) => state.user);
    const userIsAdmin = isAdmin(user?.role);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalCategories: 0,
        totalAgents: 0,
        activeAgents: 0,
        totalReviews: 0,
        recentOrders: []
    });

    // Fetch dashboard stats
    const fetchStats = async () => {
        try {
            setRefreshing(true);

            // Fetch orders
            const ordersResponse = await Axios({
                ...SummaryApi.getAllOrders
            });

            // Fetch products count
            const productsResponse = await Axios({
                ...SummaryApi.getProduct,
                data: { page: 1, limit: 1 }
            });

            // Fetch categories
            const categoriesResponse = await Axios({
                ...SummaryApi.getCategory
            });

            // Fetch agents
            let agents = [];
            try {
                const agentsResponse = await Axios({
                    ...SummaryApi.delivery.allAgents
                });
                agents = agentsResponse.data?.data || [];
            } catch (e) {
                console.log('Could not fetch agents:', e);
            }

            // HIDDEN: Reviews feature temporarily disabled
            // let reviews = [];
            // try {
            //     const reviewsResponse = await Axios({
            //         ...SummaryApi.adminGetAllReviews
            //     });
            //     reviews = reviewsResponse.data?.data || [];
            // } catch (e) {
            //     console.log('Could not fetch reviews:', e);
            // }

            // Process orders data
            const orders = ordersResponse.data?.data || [];
            const pendingOrders = orders.filter(o =>
                ['pending', 'processing', 'confirmed'].includes(o.order_status)
            );
            const completedOrders = orders.filter(o => o.order_status === 'delivered');
            const cancelledOrders = orders.filter(o => o.order_status === 'cancelled');
            const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmt || 0), 0);

            // Get active agents count
            const activeAgents = agents.filter(a => a.isOnline).length;

            setStats({
                totalOrders: orders.length,
                pendingOrders: pendingOrders.length,
                completedOrders: completedOrders.length,
                cancelledOrders: cancelledOrders.length,
                totalRevenue,
                totalProducts: productsResponse.data?.totalCount || 0,
                totalCategories: categoriesResponse.data?.data?.length || 0,
                totalAgents: agents.length,
                activeAgents,
                totalReviews: 0, // HIDDEN: Reviews feature temporarily disabled
                recentOrders: orders.slice(0, 5)
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userIsAdmin) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [userIsAdmin]);

    // If not admin, show user-friendly message
    if (!userIsAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Your Dashboard</h2>
                <p className="text-gray-500 mb-6 max-w-md">
                    Access your orders, saved addresses, and profile settings from the sidebar menu.
                </p>
                <div className="flex gap-3">
                    <Link
                        to="/dashboard/myorders"
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                    >
                        View My Orders
                    </Link>
                    <Link
                        to="/dashboard/profile"
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Edit Profile
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                    <p className="text-gray-500 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name || 'Admin'}</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Orders */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={20} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>

                {/* Revenue */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <IndianRupee size={20} className="text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{DisplayPriceInRupees(stats.totalRevenue)}</p>
                </div>

                {/* Products */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Box size={20} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Products</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Tags size={20} className="text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Categories</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                </div>
            </div>

            {/* Order Status & Agents */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Order Status */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-gray-900">Order Status</h3>
                        <Link
                            to="/dashboard/admin-orders"
                            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                        >
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-amber-600" />
                                <span className="font-medium text-amber-800">Pending</span>
                            </div>
                            <span className="text-lg font-bold text-amber-700">{stats.pendingOrders}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={18} className="text-green-600" />
                                <span className="font-medium text-green-800">Completed</span>
                            </div>
                            <span className="text-lg font-bold text-green-700">{stats.completedOrders}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <XCircle size={18} className="text-red-600" />
                                <span className="font-medium text-red-800">Cancelled</span>
                            </div>
                            <span className="text-lg font-bold text-red-700">{stats.cancelledOrders}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Agents */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-gray-900">Delivery Team</h3>
                        <Link
                            to="/dashboard/agents"
                            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                        >
                            Manage <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Truck size={18} className="text-gray-600" />
                                <span className="font-medium text-gray-700">Total Agents</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">{stats.totalAgents}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="font-medium text-green-800">Online Now</span>
                            </div>
                            <span className="text-lg font-bold text-green-700">{stats.activeAgents}</span>
                        </div>
                        {/* HIDDEN: Reviews feature temporarily disabled */}
                        {/* <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Star size={18} className="text-purple-600" />
                                <span className="font-medium text-purple-800">Total Reviews</span>
                            </div>
                            <span className="text-lg font-bold text-purple-700">{stats.totalReviews}</span>
                        </div> */}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link
                        to="/dashboard/upload-product"
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 group-hover:border-gray-300">
                            <Package size={20} className="text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Add Product</span>
                    </Link>
                    <Link
                        to="/dashboard/admin-orders"
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 group-hover:border-gray-300">
                            <ShoppingCart size={20} className="text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">View Orders</span>
                    </Link>
                    <Link
                        to="/dashboard/agents"
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 group-hover:border-gray-300">
                            <Truck size={20} className="text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Manage Agents</span>
                    </Link>
                    <Link
                        to="/dashboard/payouts"
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 group-hover:border-gray-300">
                            <Wallet size={20} className="text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Payouts</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
