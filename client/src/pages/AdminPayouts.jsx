import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import {
    Wallet,
    Search,
    Bike,
    CheckCircle,
    Clock,
    Phone,
    RefreshCw,
    Loader2,
    X,
    Banknote,
    Users,
    TrendingUp,
    CreditCard,
    ArrowRight,
    IndianRupee
} from 'lucide-react'

const AdminPayouts = () => {
    const [riders, setRiders] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedRider, setSelectedRider] = useState(null)
    const [showPayoutModal, setShowPayoutModal] = useState(false)
    const [payoutAmount, setPayoutAmount] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [processing, setProcessing] = useState(false)

    // Fetch all delivery agents with wallet info
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

    // Filter riders based on search
    const filteredRiders = riders.filter(rider => {
        return !searchTerm ||
            rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rider.mobile?.includes(searchTerm)
    })

    // Open payout modal
    const openPayoutModal = (rider) => {
        setSelectedRider(rider)
        setPayoutAmount('')
        setShowPayoutModal(true)
    }

    // Process payout
    const handlePayout = async () => {
        if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        if (parseFloat(payoutAmount) > (selectedRider.wallet?.balance || 0)) {
            toast.error('Amount exceeds available balance')
            return
        }

        try {
            setProcessing(true)
            // API call to process payout would go here
            toast.success(`Payout of ${DisplayPriceInRupees(parseFloat(payoutAmount))} processed for ${selectedRider.name}!`)
            setShowPayoutModal(false)
            fetchRiders()
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setProcessing(false)
        }
    }

    // Calculate stats
    const stats = {
        totalRiders: riders.length,
        activeNow: riders.filter(r => r.isOnline).length,
        pendingPayouts: riders.filter(r => (r.wallet?.balance || 0) > 0).length,
        totalPending: riders.reduce((sum, rider) => sum + (rider.wallet?.balance || 0), 0),
        totalEarnings: riders.reduce((sum, rider) => sum + (rider.wallet?.totalEarnings || 0), 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="text-red-500" size={28} />
                            Rider Payouts
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manage delivery agent payments and earnings
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
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

                {/* Stats Cards */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total Riders</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalRiders}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-sm text-green-600">Active Now</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.activeNow}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-yellow-500" />
                            <span className="text-sm text-yellow-600">Pending Payouts</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">{stats.pendingPayouts}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Banknote size={16} className="text-red-500" />
                            <span className="text-sm text-red-600">Total Pending</span>
                        </div>
                        <p className="text-xl font-bold text-red-700">{DisplayPriceInRupees(stats.totalPending)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={16} className="text-blue-500" />
                            <span className="text-sm text-blue-600">Total Earnings</span>
                        </div>
                        <p className="text-xl font-bold text-blue-700">{DisplayPriceInRupees(stats.totalEarnings)}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by rider name or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading riders...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredRiders.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wallet size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Riders Found</h3>
                    <p className="text-gray-500 text-sm">
                        {riders.length === 0
                            ? 'No delivery agents have registered yet'
                            : 'Try adjusting your search terms'}
                    </p>
                </div>
            )}

            {/* Riders Table */}
            {!loading && filteredRiders.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet Balance</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Earnings</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRiders.map((rider) => (
                                    <tr key={rider._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                                    {rider.avatar ? (
                                                        <img src={rider.avatar} alt={rider.name} className="w-10 h-10 rounded-xl object-cover" />
                                                    ) : (
                                                        <Bike size={18} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{rider.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {rider._id?.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone size={14} className="text-gray-400" />
                                                <span>{rider.mobile || 'N/A'}</span>
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
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-semibold ${(rider.wallet?.balance || 0) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                                {DisplayPriceInRupees(rider.wallet?.balance || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-gray-700 font-medium">
                                                {DisplayPriceInRupees(rider.wallet?.totalEarnings || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => openPayoutModal(rider)}
                                                disabled={(rider.wallet?.balance || 0) === 0}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                                    (rider.wallet?.balance || 0) > 0
                                                        ? 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <CreditCard size={14} />
                                                Pay Now
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                                Showing {filteredRiders.length} of {riders.length} riders
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Total Pending:</span>
                                <span className="font-bold text-gray-900">{DisplayPriceInRupees(stats.totalPending)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {showPayoutModal && selectedRider && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Process Payout</h2>
                                <p className="text-sm opacity-80 mt-0.5">{selectedRider.name}</p>
                            </div>
                            <button
                                onClick={() => setShowPayoutModal(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Balance Info */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600 font-medium">Available Balance</p>
                                        <p className="text-2xl font-bold text-green-700 mt-1">
                                            {DisplayPriceInRupees(selectedRider.wallet?.balance || 0)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <Wallet size={24} className="text-green-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Payout Amount Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Payout Amount
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <IndianRupee size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        max={selectedRider.wallet?.balance || 0}
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900"
                                    />
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPayoutAmount(String(selectedRider.wallet?.balance || 0))}
                                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowRight size={14} />
                                    Pay Full Balance
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowPayoutModal(false)}
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePayout}
                                    disabled={processing || !payoutAmount || parseFloat(payoutAmount) <= 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {processing ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <CreditCard size={16} />
                                            Process Payout
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminPayouts
