import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { socketService } from '../config/socket'
import {
  Package,
  Search,
  Truck,
  Clock,
  User,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  Radio,
  AlertCircle,
  Calendar,
  CreditCard,
  Banknote,
  ArrowLeft,
  Users,
  Star,
  Bike,
  Timer,
  Send,
  UserCheck,
  X,
  Zap,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Assignment Status Tabs
const ASSIGNMENT_TABS = [
  { key: 'NEEDS_ASSIGNMENT', label: 'Needs Assignment', icon: AlertCircle, description: 'Orders ready for rider assignment' },
  { key: 'BROADCASTED', label: 'Broadcasted', icon: Radio, description: 'Awaiting rider acceptance' },
  { key: 'ALL', label: 'All Pending', icon: Package, description: 'All unassigned orders' }
]

const AdminOrderAssignment = () => {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [availableRiders, setAvailableRiders] = useState([])
  const [loading, setLoading] = useState(false)
  const [ridersLoading, setRidersLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState(new Set())
  const [activeTab, setActiveTab] = useState('NEEDS_ASSIGNMENT')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Stats
  const [stats, setStats] = useState({
    needsAssignment: 0,
    broadcasted: 0,
    onlineRiders: 0,
    availableRiders: 0
  })

  // Fetch pending orders that need assignment
  const fetchPendingOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)

      const response = await Axios({
        ...SummaryApi.delivery.pendingOrders
      })

      if (response.data.success) {
        const ordersData = response.data.data || []
        setOrders(ordersData)
        setLastRefresh(new Date())

        // Calculate stats
        const needsAssignment = ordersData.filter(o => !o.assignmentStatus?.isBroadcasted).length
        const broadcasted = ordersData.filter(o => o.assignmentStatus?.isBroadcasted).length
        setStats(prev => ({ ...prev, needsAssignment, broadcasted }))
      }
    } catch (error) {
      console.log('Could not fetch orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Fetch available riders
  const fetchAvailableRiders = useCallback(async () => {
    try {
      setRidersLoading(true)
      const response = await Axios({
        ...SummaryApi.delivery.availableRiders
      })

      if (response.data.success) {
        const ridersData = response.data.data || []
        setAvailableRiders(ridersData)

        // Calculate rider stats
        const available = ridersData.filter(r => !r.hasActiveOrder).length
        setStats(prev => ({ ...prev, onlineRiders: ridersData.length, availableRiders: available }))
      }
    } catch (error) {
      console.log('Could not fetch riders:', error)
      setAvailableRiders([])
    } finally {
      setRidersLoading(false)
    }
  }, [])

  // Filter orders based on active tab and search
  useEffect(() => {
    let filtered = [...orders]

    // Apply tab filter
    if (activeTab === 'NEEDS_ASSIGNMENT') {
      filtered = filtered.filter(o => !o.assignmentStatus?.isBroadcasted)
    } else if (activeTab === 'BROADCASTED') {
      filtered = filtered.filter(o => o.assignmentStatus?.isBroadcasted)
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(o =>
        o.orderId?.toLowerCase().includes(search) ||
        o.product_details?.name?.toLowerCase().includes(search) ||
        o.userId?.name?.toLowerCase().includes(search)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, activeTab, searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchPendingOrders()
    fetchAvailableRiders()
  }, [fetchPendingOrders, fetchAvailableRiders])

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchPendingOrders(false)
      fetchAvailableRiders()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchPendingOrders, fetchAvailableRiders])

  // Socket.io real-time updates
  useEffect(() => {
    socketService.connect()

    const joinTrackingRoom = () => {
      socketService.joinAdminTracking()
    }

    if (socketService.isConnected) {
      joinTrackingRoom()
    } else {
      const checkConnection = setInterval(() => {
        if (socketService.isConnected) {
          joinTrackingRoom()
          clearInterval(checkConnection)
        }
      }, 100)
      setTimeout(() => clearInterval(checkConnection), 5000)
    }

    const handleOrderBroadcasted = (data) => {
      toast.success(`Order ${data.orderId} broadcasted to ${data.ridersNotified} riders`)
      fetchPendingOrders(false)
    }

    const handleOrderAssigned = (data) => {
      toast.success(`Order ${data.orderId} assigned to ${data.riderName}`)
      fetchPendingOrders(false)
      fetchAvailableRiders()
    }

    const handleNoRidersAvailable = (data) => {
      toast.error(`No riders available for order ${data.orderId}`)
    }

    const handleAssignmentFailed = (data) => {
      toast.error(data.message)
    }

    const handleAssignmentCancelled = (data) => {
      toast(`Assignment cancelled for order ${data.orderId}: ${data.reason}`, { icon: '⚠️' })
      fetchPendingOrders(false)
      fetchAvailableRiders()
    }

    const handleBroadcastExpired = (data) => {
      toast.error(`Broadcast expired for order ${data.orderId}. Manual assignment required.`)
      fetchPendingOrders(false)
    }

    socketService.on('order-broadcasted', handleOrderBroadcasted)
    socketService.on('order-assigned', handleOrderAssigned)
    socketService.on('no-riders-available', handleNoRidersAvailable)
    socketService.on('assignment-failed', handleAssignmentFailed)
    socketService.on('assignment-cancelled', handleAssignmentCancelled)
    socketService.on('broadcast-expired', handleBroadcastExpired)

    return () => {
      socketService.off('order-broadcasted', handleOrderBroadcasted)
      socketService.off('order-assigned', handleOrderAssigned)
      socketService.off('no-riders-available', handleNoRidersAvailable)
      socketService.off('assignment-failed', handleAssignmentFailed)
      socketService.off('assignment-cancelled', handleAssignmentCancelled)
      socketService.off('broadcast-expired', handleBroadcastExpired)
      socketService.leaveAdminTracking()
    }
  }, [fetchPendingOrders, fetchAvailableRiders])

  // Open assignment modal
  const openAssignModal = async (order) => {
    setSelectedOrder(order)
    setShowAssignModal(true)
    await fetchAvailableRiders()
  }

  // Broadcast order to riders
  const handleBroadcast = async (order) => {
    try {
      setActionLoading(order._id)
      const response = await Axios({
        ...SummaryApi.delivery.broadcastOrder,
        url: `${SummaryApi.delivery.broadcastOrder.url}/${order.orderId}`
      })

      if (response.data.success) {
        toast.success(response.data.message || 'Order broadcasted to riders!')
        fetchPendingOrders(false)
      } else {
        toast.error(response.data.message || 'Failed to broadcast order')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setActionLoading(null)
    }
  }

  // Escalate broadcast (increase radius)
  const handleEscalate = async (order) => {
    try {
      setActionLoading(order._id)
      const response = await Axios({
        ...SummaryApi.delivery.broadcastOrder,
        url: `${SummaryApi.delivery.broadcastOrder.url}/${order.orderId}`
      })

      if (response.data.success) {
        toast.success('Broadcast escalated with wider radius!')
        fetchPendingOrders(false)
      } else {
        toast.error(response.data.message || 'Failed to escalate')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setActionLoading(null)
    }
  }

  // Direct assign to rider
  const handleDirectAssign = async (riderId) => {
    if (!selectedOrder) return

    try {
      setActionLoading(selectedOrder._id)
      const response = await Axios({
        ...SummaryApi.delivery.directAssign,
        url: `${SummaryApi.delivery.directAssign.url}/${selectedOrder.orderId}`,
        data: { riderId }
      })

      if (response.data.success) {
        toast.success(response.data.message || 'Order assigned successfully!')
        setShowAssignModal(false)
        setSelectedOrder(null)
        fetchPendingOrders(false)
        fetchAvailableRiders()
      } else {
        toast.error(response.data.message || 'Failed to assign order')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setActionLoading(null)
    }
  }

  // Toggle order expansion
  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return ''
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  // Get status badge
  const getStatusBadge = (order) => {
    const assignmentStatus = order.assignmentStatus || {}
    if (assignmentStatus.isBroadcasted) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          <Radio className="w-3 h-3" />
          Broadcasted ({assignmentStatus.ridersNotified || 0})
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
        <AlertCircle className="w-3 h-3" />
        Needs Assignment
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard/admin-orders"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Assignment</h1>
              <p className="text-sm text-gray-500 mt-1">
                Assign riders to packed orders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => {
                fetchPendingOrders(false)
                fetchAvailableRiders()
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Refresh
            </button>
            <Link
              to="/dashboard/admin-orders"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Package className="w-4 h-4" />
              All Orders
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.needsAssignment}</p>
                <p className="text-xs text-orange-600">Needs Assignment</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Radio className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.broadcasted}</p>
                <p className="text-xs text-yellow-600">Broadcasted</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bike className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.availableRiders}</p>
                <p className="text-xs text-green-600">Available Riders</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.onlineRiders}</p>
                <p className="text-xs text-blue-600">Online Riders</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Last updated: {formatDate(lastRefresh)}
        </p>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        {/* Assignment Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ASSIGNMENT_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'NEEDS_ASSIGNMENT' && stats.needsAssignment > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 text-xs font-bold rounded-full",
                  activeTab === tab.key ? "bg-white text-red-600" : "bg-red-600 text-white"
                )}>
                  {stats.needsAssignment}
                </span>
              )}
              {tab.key === 'BROADCASTED' && stats.broadcasted > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 text-xs font-bold rounded-full",
                  activeTab === tab.key ? "bg-white text-red-600" : "bg-yellow-500 text-white"
                )}>
                  {stats.broadcasted}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order ID, Product, or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {activeTab === 'NEEDS_ASSIGNMENT'
                ? 'All Orders Broadcasted!'
                : activeTab === 'BROADCASTED'
                  ? 'No Broadcasted Orders'
                  : 'All Orders Assigned!'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'NEEDS_ASSIGNMENT'
                ? 'All packed orders have been broadcasted to riders.'
                : activeTab === 'BROADCASTED'
                  ? 'No orders are currently waiting for rider acceptance.'
                  : 'All orders have been assigned to delivery agents.'}
            </p>
            {orders.length === 0 && (
              <Link
                to="/dashboard/admin-orders"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Package className="w-4 h-4" />
                View All Orders
              </Link>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order._id)
            const assignmentStatus = order.assignmentStatus || {}
            const isBroadcasted = assignmentStatus.isBroadcasted

            return (
              <div
                key={order._id}
                className={cn(
                  "bg-white rounded-xl shadow-sm border overflow-hidden transition-all",
                  isBroadcasted ? "border-yellow-200" : "border-orange-200"
                )}
              >
                {/* Order Header */}
                <div
                  className={cn(
                    "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                    isBroadcasted ? "bg-yellow-50" : "bg-orange-50"
                  )}
                  onClick={() => toggleExpand(order._id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      {/* Product Image */}
                      <img
                        src={order.product_details?.image?.[0]}
                        alt={order.product_details?.name}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                      />

                      {/* Order Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900">{order.orderId}</p>
                          {getStatusBadge(order)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {order.product_details?.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            {order.payment_method === 'cod' ? (
                              <><Banknote className="w-3 h-3" /> COD</>
                            ) : (
                              <><CreditCard className="w-3 h-3" /> Paid</>
                            )}
                          </span>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            <Package className="w-3 h-3" />
                            {order.order_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                      {/* Amount */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {DisplayPriceInRupees(order.totalAmt)}
                        </p>
                        {order.cod_amount > 0 && (
                          <p className="text-xs text-orange-600">
                            COD: {DisplayPriceInRupees(order.cod_amount)}
                          </p>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {!isBroadcasted ? (
                          <button
                            onClick={() => handleBroadcast(order)}
                            disabled={actionLoading === order._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                Broadcast
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEscalate(order)}
                            disabled={actionLoading === order._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                Escalate
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => openAssignModal(order)}
                          className="flex items-center gap-1 px-3 py-1.5 border-2 border-red-600 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                        >
                          <UserCheck className="w-3 h-3" />
                          Assign
                        </button>
                      </div>

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Customer
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium text-gray-900">{order.userId?.name || 'Customer'}</p>
                          <p className="text-gray-600 flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {order.userId?.mobile || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h4>
                        {order.delivery_address ? (
                          <div className="text-sm text-gray-600">
                            <p>{order.delivery_address.address_line}</p>
                            <p>{order.delivery_address.city}, {order.delivery_address.state}</p>
                            <p>PIN: {order.delivery_address.pincode}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No address available</p>
                        )}
                      </div>

                      {/* Delivery Schedule */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Delivery Schedule
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><span className="text-gray-500">Slot:</span> {order.delivery_slot}</p>
                          <p><span className="text-gray-500">Date:</span> {formatDate(order.delivery_date)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Broadcast Status */}
                    {isBroadcasted && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                          <Radio className="w-4 h-4" />
                          Broadcast Status
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-yellow-600">Broadcast Rounds</p>
                            <p className="font-bold text-yellow-800">{assignmentStatus.broadcastCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-yellow-600">Riders Notified</p>
                            <p className="font-bold text-yellow-800">{assignmentStatus.ridersNotified || 0}</p>
                          </div>
                          <div>
                            <p className="text-yellow-600">Radius</p>
                            <p className="font-bold text-yellow-800">{assignmentStatus.broadcastRadius || 0} km</p>
                          </div>
                          <div>
                            <p className="text-yellow-600">Last Broadcast</p>
                            <p className="font-bold text-yellow-800">{formatTimeAgo(assignmentStatus.lastBroadcastAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                      {!isBroadcasted ? (
                        <button
                          onClick={() => handleBroadcast(order)}
                          disabled={actionLoading === order._id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          Broadcast to Riders
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEscalate(order)}
                          disabled={actionLoading === order._id}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Zap className="w-4 h-4" />
                          Escalate Broadcast
                        </button>
                      )}
                      <button
                        onClick={() => openAssignModal(order)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        Direct Assign to Rider
                      </button>
                      <Link
                        to={`/track-order/${order.orderId}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Track Order
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Assign Delivery Agent
                </h2>
                <p className="text-sm opacity-90 mt-1">Order: {selectedOrder.orderId}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedOrder(null)
                }}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex gap-4">
                  <img
                    src={selectedOrder.product_details?.image?.[0]}
                    alt={selectedOrder.product_details?.name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 line-clamp-1">{selectedOrder.product_details?.name}</p>
                    <p className="text-lg font-bold text-red-600">{DisplayPriceInRupees(selectedOrder.totalAmt)}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedOrder.delivery_address?.city}, {selectedOrder.delivery_address?.state}</span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Bike className="w-5 h-5 text-green-600" />
                Available Riders ({availableRiders.filter(r => !r.hasActiveOrder).length})
              </h3>

              {ridersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : availableRiders.filter(r => !r.hasActiveOrder).length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No riders available</p>
                  <p className="text-sm text-gray-500 mt-1">All riders are either offline or have active orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRiders
                    .filter(r => !r.hasActiveOrder)
                    .map((rider) => (
                      <div
                        key={rider._id}
                        className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer group"
                        onClick={() => handleDirectAssign(rider._id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            {rider.avatar ? (
                              <img src={rider.avatar} alt={rider.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <Bike className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{rider.name}</p>
                            <p className="text-sm text-gray-500">{rider.mobile}</p>
                            {rider.vehicle && (
                              <p className="text-xs text-gray-400 mt-1">
                                {rider.vehicle.type} • {rider.vehicle.number}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="flex items-center justify-end gap-1 text-green-600 text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                          </span>
                          {rider.distance !== null && rider.distance !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">{rider.distance} km away</p>
                          )}
                          {rider.metrics?.averageRating > 0 && (
                            <p className="flex items-center justify-end gap-1 text-xs text-yellow-600 mt-1">
                              <Star className="w-3 h-3 fill-yellow-500" /> {rider.metrics.averageRating.toFixed(1)}
                            </p>
                          )}
                          {rider.score && (
                            <p className="text-xs text-blue-600 font-medium mt-1 flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Score: {rider.score}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedOrder(null)
                }}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrderAssignment
