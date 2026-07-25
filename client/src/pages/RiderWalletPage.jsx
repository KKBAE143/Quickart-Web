import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    TrendingUp,
    Package,
    Clock,
    Wallet,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
    Gift,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Calendar,
    BarChart3
} from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

/**
 * Rider Wallet Page
 *
 * Shows:
 * - Current wallet balance
 * - Today's earnings and cash collected
 * - Transaction history
 * - Earnings summary by period
 *
 * Note: Cash settlement is done at store at end of day
 */
export default function RiderWalletPage() {

    // State
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [earningsSummary, setEarningsSummary] = useState(null);
    const [period, setPeriod] = useState('week');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch wallet data
    const fetchWallet = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delivery.wallet,
                params: { page }
            });

            if (response.data.success) {
                setWallet(response.data.data.wallet);
                setTransactions(response.data.data.transactions);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Fetch wallet error:', error);
            toast.error('Failed to load wallet');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page]);

    // Fetch earnings summary
    const fetchEarnings = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delivery.earnings,
                params: { period }
            });

            if (response.data.success) {
                setEarningsSummary(response.data.data);
            }
        } catch (error) {
            console.error('Fetch earnings error:', error);
        }
    }, [period]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);

    // Refresh handler
    const handleRefresh = () => {
        setRefreshing(true);
        fetchWallet();
        fetchEarnings();
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get transaction icon and color
    const getTransactionStyle = (type) => {
        switch (type) {
            case 'earning':
                return { icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
            case 'bonus':
                return { icon: Gift, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
            case 'settlement':
                return { icon: Banknote, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
            case 'penalty':
                return { icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
            default:
                return { icon: IndianRupee, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <Loader2 size={40} className="animate-spin text-gray-400" />
                <p className="text-gray-500 text-sm">Loading wallet...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="text-red-500" size={28} />
                            My Wallet
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Track your earnings and transactions
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Balance Card */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl h-full p-8 text-white shadow-xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-gray-400 font-medium mb-2 flex items-center gap-2">
                                <Wallet size={16} />
                                Current Balance
                            </p>
                            <h2 className="text-5xl font-bold mb-4">{DisplayPriceInRupees(wallet?.currentBalance || 0)}</h2>
                            <p className="text-sm text-gray-400 bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                                To be collected from store
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 border-t border-white/10 pt-6 sm:pt-8">
                            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{DisplayPriceInRupees(wallet?.todayEarnings || 0)}</p>
                                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                    <TrendingUp size={12} />
                                    Today's Earn
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{wallet?.todayDeliveries || 0}</p>
                                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                    <Package size={12} />
                                    Deliveries
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{DisplayPriceInRupees(wallet?.todayCashCollected || 0)}</p>
                                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                    <Banknote size={12} />
                                    Cash in Hand
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-600" />
                        Lifetime Analytics
                    </h3>
                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Total Earnings</span>
                                <span className="font-bold text-gray-900">{DisplayPriceInRupees(wallet?.totalEarnings || 0)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                {/* Dynamic progress based on total earnings - scales up to 100k as reference */}
                                {(wallet?.totalEarnings || 0) > 0 ? (
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, ((wallet?.totalEarnings || 0) / 100000) * 100)}%` }}
                                    ></div>
                                ) : (
                                    <div className="h-2.5 rounded-full"></div>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Total Settled</span>
                                <span className="font-bold text-gray-900">{DisplayPriceInRupees(wallet?.totalSettled || 0)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                {/* Dynamic progress - settled as percentage of total earnings */}
                                {(wallet?.totalSettled || 0) > 0 && (wallet?.totalEarnings || 0) > 0 ? (
                                    <div
                                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, ((wallet?.totalSettled || 0) / (wallet?.totalEarnings || 1)) * 100)}%` }}
                                    ></div>
                                ) : (
                                    <div className="h-2.5 rounded-full"></div>
                                )}
                            </div>
                        </div>
                        {wallet?.lastSettlementDate && (
                            <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-center gap-2 border border-gray-100">
                                <Calendar size={14} className="text-gray-400" />
                                Last settlement: <span className="font-medium text-gray-900">{formatDate(wallet.lastSettlementDate)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Earnings Chart / Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <BarChart3 size={20} className="text-gray-400" />
                        Performance
                    </h3>
                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl">
                        <Calendar size={14} className="text-gray-400 ml-2" />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 cursor-pointer pr-8"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                </div>

                {earningsSummary?.summary && (earningsSummary.summary.totalEarnings > 0 || earningsSummary.summary.totalDeliveries > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-green-700 font-bold text-2xl">{DisplayPriceInRupees(earningsSummary.summary.totalEarnings || 0)}</p>
                            <p className="text-green-600 text-xs font-semibold uppercase tracking-wider mt-1 flex items-center gap-1">
                                <TrendingUp size={12} />
                                Total Earnings
                            </p>
                        </div>
                        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-blue-700 font-bold text-2xl">{earningsSummary.summary.totalDeliveries || 0}</p>
                            <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mt-1 flex items-center gap-1">
                                <Package size={12} />
                                Total Deliveries
                            </p>
                        </div>
                        <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
                            <p className="text-purple-700 font-bold text-2xl">{DisplayPriceInRupees(Math.round(earningsSummary.summary.avgEarningPerDelivery || 0))}</p>
                            <p className="text-purple-600 text-xs font-semibold uppercase tracking-wider mt-1 flex items-center gap-1">
                                <IndianRupee size={12} />
                                Avg per Order
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 mb-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <BarChart3 size={28} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No earnings data for this period</p>
                        <p className="text-gray-400 text-xs mt-1">Complete deliveries to see your performance</p>
                    </div>
                )}

                {/* Daily Bar Chart Visualization */}
                {earningsSummary?.dailyBreakdown?.length > 0 && earningsSummary.dailyBreakdown.some(d => d.totalEarnings > 0) && (
                    <div className="h-48 flex items-end justify-between gap-3 px-2 pt-8 relative">
                        {earningsSummary.dailyBreakdown.slice(-7).map((day) => {
                            const max = Math.max(...earningsSummary.dailyBreakdown.map(d => d.totalEarnings), 100);
                            const height = day.totalEarnings > 0 ? Math.max(10, (day.totalEarnings / max) * 100) : 5;
                            return (
                                <div key={day._id} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className={`w-full rounded-xl transition-all relative cursor-pointer ${
                                            day.totalEarnings > 0
                                                ? 'bg-gray-200 group-hover:bg-gradient-to-t group-hover:from-red-500 group-hover:to-red-400'
                                                : 'bg-gray-100'
                                        }`}
                                        style={{ height: `${height}%` }}
                                    >
                                        {day.totalEarnings > 0 && (
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                                                {DisplayPriceInRupees(day.totalEarnings)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {new Date(day._id).toLocaleDateString('en-IN', { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <Clock size={20} className="text-gray-400" />
                        Transaction History
                    </h3>
                    {pagination && (
                        <span className="text-sm text-gray-500">{pagination.total} transactions</span>
                    )}
                </div>

                {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Wallet size={32} className="text-gray-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">No transactions found</h4>
                        <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((tx) => {
                            const style = getTransactionStyle(tx.type);
                            const Icon = style.icon;
                            return (
                                <div key={tx._id} className="p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} border ${style.border}`}>
                                        <Icon size={20} className={style.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {tx.description}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatDate(tx.createdAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount >= 0 ? '+' : ''}{DisplayPriceInRupees(Math.abs(tx.amount))}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Bal: {DisplayPriceInRupees(tx.balanceAfter)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-gray-500">
                            Page {page} of {pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                                {page} / {pagination.totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="flex items-center gap-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Settlement Info Card */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex gap-4 items-start">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={24} className="text-yellow-600" />
                </div>
                <div>
                    <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                        <Clock size={16} />
                        Important: Cash Settlement
                    </h4>
                    <p className="text-sm text-yellow-700 leading-relaxed">
                        All earnings and cash collected should be settled at the store at the end of your shift.
                        Your current balance of <span className="font-bold">{DisplayPriceInRupees(wallet?.currentBalance || 0)}</span> will be paid to you in cash.
                    </p>
                </div>
            </div>
        </div>
    );
}
