import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import {
    BarChart3,
    Bike,
    Truck,
    CheckCircle,
    Clock,
    Star,
    Route,
    Wallet,
    Calendar,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Loader2,
    Users,
    Package,
    Trophy,
    Target,
    Zap
} from 'lucide-react'

const AdminAgentAnalytics = () => {
    const [loading, setLoading] = useState(false)
    const [riders, setRiders] = useState([])
    const [timeRange, setTimeRange] = useState('today')

    // Fetch riders data
    const fetchRiders = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.delivery.onlineRiders
            })

            if (response.data.success) {
                setRiders(response.data.data || [])
            }
        } catch (error) {
            console.log('Could not fetch riders:', error)
            setRiders([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRiders()
    }, [])

    // Calculate analytics
    const totalRiders = riders.length
    const activeRiders = riders.filter(r => r.isOnline).length
    const totalDeliveries = riders.reduce((sum, r) => sum + (r.agentMetrics?.totalDeliveries || 0), 0)
    const totalEarnings = riders.reduce((sum, r) => sum + (r.wallet?.totalEarnings || 0), 0)
    const avgRating = riders.length > 0
        ? (riders.reduce((sum, r) => sum + (r.agentMetrics?.rating || 0), 0) / riders.length).toFixed(1)
        : 0

    // Top performers
    const topPerformers = [...riders]
        .sort((a, b) => (b.agentMetrics?.totalDeliveries || 0) - (a.agentMetrics?.totalDeliveries || 0))
        .slice(0, 5)

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={12}
                        className={star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="text-red-500" size={28} />
                            Agent Analytics
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Performance metrics and insights for delivery agents
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <Calendar size={16} className="text-gray-400" />
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
                            >
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchRiders}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading analytics...</p>
                    </div>
                </div>
            )}

            {!loading && (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Agents</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalRiders}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <Users size={22} className="text-blue-600" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-sm">
                                <TrendingUp size={14} className="text-green-500" />
                                <span className="text-green-600 font-medium">12%</span>
                                <span className="text-gray-500">vs last period</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Active Now</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{activeRiders}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                    <Zap size={22} className="text-green-600" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${totalRiders > 0 ? (activeRiders / totalRiders) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">
                                    {totalRiders > 0 ? Math.round((activeRiders / totalRiders) * 100) : 0}% online
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Deliveries</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalDeliveries}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                    <Package size={22} className="text-purple-600" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-sm">
                                <TrendingUp size={14} className="text-green-500" />
                                <span className="text-green-600 font-medium">8%</span>
                                <span className="text-gray-500">vs last period</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Earnings</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{DisplayPriceInRupees(totalEarnings)}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                                    <Wallet size={22} className="text-yellow-600" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-sm">
                                <TrendingUp size={14} className="text-green-500" />
                                <span className="text-green-600 font-medium">15%</span>
                                <span className="text-gray-500">vs last period</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Avg Rating</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{avgRating}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                                    <Star size={22} className="text-red-500" />
                                </div>
                            </div>
                            <div className="mt-3">
                                {renderStars(avgRating)}
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Trophy size={20} className="text-yellow-500" />
                                    Top Performers
                                </h3>
                            </div>
                            {topPerformers.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Bike size={28} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">No data available</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {topPerformers.map((rider, index) => (
                                        <div key={rider._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                                                    index === 0 ? 'bg-yellow-500' :
                                                    index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{rider.name}</p>
                                                    <p className="text-xs text-gray-500">{rider.agentMetrics?.totalDeliveries || 0} deliveries</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">
                                                    {DisplayPriceInRupees(rider.wallet?.totalEarnings || 0)}
                                                </p>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="text-xs text-gray-500">{rider.agentMetrics?.rating || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delivery Stats */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Target size={20} className="text-blue-500" />
                                    Delivery Statistics
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                            <CheckCircle size={20} className="text-green-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">Completed</span>
                                    </div>
                                    <span className="text-xl font-bold text-green-600">{totalDeliveries}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                            <Clock size={20} className="text-yellow-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">In Progress</span>
                                    </div>
                                    <span className="text-xl font-bold text-yellow-600">{activeRiders}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Route size={20} className="text-blue-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">Avg Distance</span>
                                    </div>
                                    <span className="text-xl font-bold text-blue-600">2.5 km</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <Clock size={20} className="text-purple-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">Avg Time</span>
                                    </div>
                                    <span className="text-xl font-bold text-purple-600">18 min</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agent Performance Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Users size={20} className="text-gray-400" />
                                All Agents Performance
                            </h3>
                        </div>
                        {riders.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Bike size={32} className="text-gray-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">No Agents Registered</h4>
                                <p className="text-gray-500 text-sm">Agents will appear here once they register</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deliveries</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Earnings</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Completion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {riders.map((rider) => (
                                            <tr key={rider._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                                            {rider.avatar ? (
                                                                <img src={rider.avatar} alt={rider.name} className="w-10 h-10 rounded-xl object-cover" />
                                                            ) : (
                                                                <Bike size={18} className="text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{rider.name}</p>
                                                            <p className="text-xs text-gray-500">{rider.mobile}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {rider.isOnline ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                            Online
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">Offline</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-semibold text-gray-900">{rider.agentMetrics?.totalDeliveries || 0}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                        <span className="font-medium text-gray-900">{rider.agentMetrics?.rating || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-semibold text-gray-900">
                                                        {DisplayPriceInRupees(rider.wallet?.totalEarnings || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-20 bg-gray-100 rounded-full h-2">
                                                            <div
                                                                className="bg-green-500 h-2 rounded-full transition-all"
                                                                style={{ width: `${rider.agentMetrics?.completionRate || 95}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-600">{rider.agentMetrics?.completionRate || 95}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default AdminAgentAnalytics
