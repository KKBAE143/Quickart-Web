import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { socketService } from '../config/socket'
import {
  Package,
  Search,
  Clock,
  User,
  Phone,
  MapPin,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Eye,
  AlertCircle,
  Calendar,
  CreditCard,
  Banknote,
  Timer,
  Bike,
  Star,
  Navigation,
  X,
  ChevronRight,
  Send,
  Zap,
  Radio,
  TrendingUp,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ORDER MANAGEMENT - Zepto/Blinkit Style with Broadcast Feature
 *
 * Simple Flow:
 * 1. NEW ORDERS (Confirmed) - Need to be packed
 * 2. READY TO SHIP (Packed) - Broadcast to riders or Direct assign
 * 3. IN TRANSIT (Dispatched/Out for Delivery) - Being delivered
 * 4. COMPLETED (Delivered) - Done
 * 5. CANCELLED - Cancelled orders
 */

// Simple tab configuration
const ORDER_TABS = [
  { key: 'NEW', label: 'New Orders', statuses: ['CONFIRMED'], color: 'blue', icon: Package, action: 'Pack' },
  { key: 'READY', label: 'Ready to Ship', statuses: ['PACKED'], color: 'orange', icon: PackageCheck, action: 'Assign Rider' },
  { key: 'TRANSIT', label: 'In Transit', statuses: ['DISPATCHED', 'OUT_FOR_DELIVERY'], color: 'purple', icon: Truck, action: null },
  { key: 'COMPLETED', label: 'Completed', statuses: ['DELIVERED'], color: 'green', icon: CheckCircle2, action: null },
  { key: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED', 'REFUND_INITIATED', 'REFUND_COMPLETED'], color: 'red', icon: XCircle, action: null }
]

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('NEW')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({ NEW: 0, READY: 0, TRANSIT: 0, COMPLETED: 0, CANCELLED: 0 })

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [availableRiders, setAvailableRiders] = useState([])
  const [ridersLoading, setRidersLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Broadcast state
  const [broadcastLoading, setBroadcastLoading] = useState(null)
  const [assignmentStatuses, setAssignmentStatuses] = useState({})

  // Fetch all orders
  const fetchOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)

      const response = await Axios({
        ...SummaryApi.getAllOrders,
        url: `${SummaryApi.getAllOrders.url}?limit=200&sortBy=createdAt&sortOrder=desc`
      })

      if (response.data.success) {
        const allOrders = response.data.data || []
        setOrders(allOrders)

        // Calculate stats
        const newStats = { NEW: 0, READY: 0, TRANSIT: 0, COMPLETED: 0, CANCELLED: 0 }
        allOrders.forEach(order => {
          if (order.order_status === 'CONFIRMED') newStats.NEW++
          else if (order.order_status === 'PACKED') newStats.READY++
          else if (['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(order.order_status)) newStats.TRANSIT++
          else if (order.order_status === 'DELIVERED') newStats.COMPLETED++
          else if (['CANCELLED', 'REFUND_INITIATED', 'REFUND_COMPLETED'].includes(order.order_status)) newStats.CANCELLED++
        })
        setStats(newStats)

        // Fetch assignment statuses for PACKED orders
        const packedOrders = allOrders.filter(o => o.order_status === 'PACKED')
        if (packedOrders.length > 0) {
          fetchAssignmentStatuses(packedOrders)
        }
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Fetch assignment statuses for packed orders
  const fetchAssignmentStatuses = async (packedOrders) => {
    try {
      const response = await Axios({
        ...SummaryApi.delivery.pendingOrders
      })
      if (response.data.success) {
        const statusMap = {}
        response.data.data.forEach(order => {
          if (order.assignmentStatus) {
            statusMap[order._id] = order.assignmentStatus
          }
        })
        setAssignmentStatuses(statusMap)
      }
    } catch (error) {
      console.log('Could not fetch assignment statuses:', error)
    }
  }

  // Fetch available riders
  const fetchAvailableRiders = async () => {
    try {
      setRidersLoading(true)
      const response = await Axios({
        ...SummaryApi.delivery.availableRiders
      })
      if (response.data.success) {
        setAvailableRiders(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch riders:', error)
      setAvailableRiders([])
    } finally {
      setRidersLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Socket.io real-time updates
  useEffect(() => {
    socketService.connect()

    const joinRoom = () => {
      socketService.joinAdminTracking()
    }

    if (socketService.isConnected) {
      joinRoom()
    } else {
      const checkConnection = setInterval(() => {
        if (socketService.isConnected) {
          joinRoom()
          clearInterval(checkConnection)
        }
      }, 100)
      setTimeout(() => clearInterval(checkConnection), 5000)
    }

    // Listen for order updates
    const handleOrderUpdate = (data) => {
      toast.success(`Order ${data.orderId} - ${data.message || 'Status updated'}`)
      fetchOrders(false)
    }

    const handleOrderAssigned = (data) => {
      toast.success(`Order ${data.orderId} assigned to ${data.riderName}`)
      fetchOrders(false)
      setShowAssignModal(false)
    }

    const handleRiderStatusUpdate = (data) => {
      fetchOrders(false)
    }

    // Broadcast events
    const handleOrderBroadcasted = (data) => {
      toast.success(`Order ${data.orderId} broadcasted to ${data.ridersNotified} riders`)
      fetchOrders(false)
    }

    const handleNoRidersAvailable = (data) => {
      toast.error(`No riders available for order ${data.orderId}`)
    }

    const handleAssignmentFailed = (data) => {
      toast.error(data.message)
    }

    socketService.on('order-status-updated', handleOrderUpdate)
    socketService.on('order-assigned', handleOrderAssigned)
    socketService.on('rider-status-update', handleRiderStatusUpdate)
    socketService.on('rider-arrived-store', handleRiderStatusUpdate)
    socketService.on('order-picked-up', handleRiderStatusUpdate)
    socketService.on('rider-reached-customer', handleRiderStatusUpdate)
    socketService.on('order-delivered', handleOrderUpdate)
    socketService.on('order-broadcasted', handleOrderBroadcasted)
    socketService.on('no-riders-available', handleNoRidersAvailable)
    socketService.on('assignment-failed', handleAssignmentFailed)

    return () => {
      socketService.off('order-status-updated', handleOrderUpdate)
      socketService.off('order-assigned', handleOrderAssigned)
      socketService.off('rider-status-update', handleRiderStatusUpdate)
      socketService.off('rider-arrived-store', handleRiderStatusUpdate)
      socketService.off('order-picked-up', handleRiderStatusUpdate)
      socketService.off('rider-reached-customer', handleRiderStatusUpdate)
      socketService.off('order-delivered', handleOrderUpdate)
      socketService.off('order-broadcasted', handleOrderBroadcasted)
      socketService.off('no-riders-available', handleNoRidersAvailable)
      socketService.off('assignment-failed', handleAssignmentFailed)
      socketService.leaveAdminTracking()
    }
  }, [fetchOrders])

  // Filter orders by active tab and search
  const filteredOrders = orders.filter(order => {
    const tabConfig = ORDER_TABS.find(t => t.key === activeTab)
    const matchesTab = tabConfig?.statuses.includes(order.order_status)
    const matchesSearch = !searchTerm ||
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  // Mark order as packed
  const handleMarkPacked = async (order) => {
    try {
      const response = await Axios({
        ...SummaryApi.updateOrderStatus,
        url: `${SummaryApi.updateOrderStatus.url}/${order.orderId}`,
        data: { order_status: 'PACKED' }
      })
      if (response.data.success) {
        toast.success('Order marked as packed!')
        fetchOrders(false)
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  // Broadcast order to nearby riders
  const handleBroadcast = async (order) => {
    try {
      setBroadcastLoading(order._id)
      const response = await Axios({
        ...SummaryApi.delivery.broadcastOrder,
        url: `${SummaryApi.delivery.broadcastOrder.url}/${order.orderId}`
      })

      if (response.data.success) {
        toast.success(response.data.message || 'Order broadcasted to riders!')
        fetchOrders(false)
      } else {
        toast.error(response.data.message || 'Failed to broadcast order')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setBroadcastLoading(null)
    }
  }

  // Escalate broadcast (increase radius)
  const handleEscalate = async (order) => {
    try {
      setBroadcastLoading(order._id)
      const response = await Axios({
        ...SummaryApi.delivery.escalateBroadcast,
        url: `${SummaryApi.delivery.escalateBroadcast.url}/${order.orderId}`
      })

      if (response.data.success) {
        toast.success('Broadcast escalated with wider radius!')
        fetchOrders(false)
      } else {
        toast.error(response.data.message || 'Failed to escalate')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setBroadcastLoading(null)
    }
  }

  // Open assign rider modal
  const handleOpenAssignModal = async (order) => {
    setSelectedOrder(order)
    setShowAssignModal(true)
    await fetchAvailableRiders()
  }

  // Assign rider to order
  const handleAssignRider = async (riderId) => {
    if (!selectedOrder) return
    try {
      setAssigning(true)
      const response = await Axios({
        ...SummaryApi.delivery.directAssign,
        url: `${SummaryApi.delivery.directAssign.url}/${selectedOrder.orderId}`,
        data: { riderId }
      })
      if (response.data.success) {
        toast.success(`Order assigned to rider!`)
        setShowAssignModal(false)
        setSelectedOrder(null)
        fetchOrders(false)
      } else {
        toast.error(response.data.message || 'Failed to assign')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setAssigning(false)
    }
  }

  // Cancel order
  const handleCancelOrder = async (order) => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return
    try {
      const response = await Axios({
        ...SummaryApi.updateOrderStatus,
        url: `${SummaryApi.updateOrderStatus.url}/${order.orderId}`,
        data: { order_status: 'CANCELLED', cancellation_reason: reason }
      })
      if (response.data.success) {
        toast.success('Order cancelled')
        fetchOrders(false)
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  // Format time
  const formatTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const d = new Date(date)
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  // Get delivery status text
  const getDeliveryStatus = (order) => {
    if (order.order_status === 'DISPATCHED') {
      return { text: 'Rider assigned, going to store', color: 'text-blue-600', bg: 'bg-blue-50' }
    }
    if (order.order_status === 'OUT_FOR_DELIVERY') {
      return { text: 'Out for delivery', color: 'text-purple-600', bg: 'bg-purple-50' }
    }
    return null
  }

  // Get assignment status for an order
  const getAssignmentStatus = (order) => {
    return assignmentStatuses[order._id] || null
  }

  // Check if order is broadcasted
  const isBroadcasted = (order) => {
    const status = getAssignmentStatus(order)
    return status?.isBroadcasted || false
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-sm text-gray-500">Manage all orders in one place</p>
          </div>
          <button
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ORDER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                activeTab === tab.key
                  ? `border-${tab.color}-500 bg-${tab.color}-50`
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <tab.icon className={cn("w-5 h-5", `text-${tab.color}-600`)} />
                {stats[tab.key] > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded-full",
                    `bg-${tab.color}-100 text-${tab.color}-700`
                  )}>
                    {stats[tab.key]}
                  </span>
                )}
              </div>
              <p className="font-semibold text-gray-900">{tab.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID, product, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No orders here</h3>
            <p className="text-gray-500 text-sm">Orders will appear when available</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const deliveryStatus = getDeliveryStatus(order)
            const assignmentStatus = getAssignmentStatus(order)
            const orderIsBroadcasted = isBroadcasted(order)

            return (
              <div key={order._id} className={cn(
                "bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow",
                orderIsBroadcasted ? "border-yellow-300" : "border-gray-200"
              )}>
                <div className="p-4">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.product_details?.image?.[0]}
                        alt=""
                        className="w-14 h-14 object-cover rounded-lg border"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{order.orderId}</span>
                          <span className="text-xs text-gray-500">{formatTime(order.createdAt)}</span>
                          {/* Broadcast Status Badge */}
                          {activeTab === 'READY' && orderIsBroadcasted && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              <Radio className="w-3 h-3" />
                              Broadcasted ({assignmentStatus?.ridersNotified || 0})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{order.product_details?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {order.payment_method === 'cod' ? (
                            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                              <Banknote className="w-3 h-3" /> COD ₹{order.totalAmt}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <CreditCard className="w-3 h-3" /> Paid ₹{order.totalAmt}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {activeTab === 'NEW' && (
                        <button
                          onClick={() => handleMarkPacked(order)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Mark Packed
                        </button>
                      )}
                      {activeTab === 'READY' && (
                        <>
                          {/* Broadcast / Escalate Button */}
                          {!orderIsBroadcasted ? (
                            <button
                              onClick={() => handleBroadcast(order)}
                              disabled={broadcastLoading === order._id}
                              className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {broadcastLoading === order._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  Broadcast
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEscalate(order)}
                              disabled={broadcastLoading === order._id}
                              className="flex items-center gap-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {broadcastLoading === order._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4" />
                                  Escalate
                                </>
                              )}
                            </button>
                          )}
                          {/* Direct Assign Button */}
                          <button
                            onClick={() => handleOpenAssignModal(order)}
                            className="flex items-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Bike className="w-4 h-4" />
                            Assign
                          </button>
                        </>
                      )}
                      {activeTab === 'TRANSIT' && (
                        <Link
                          to={`/track-order/${order.orderId}`}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Navigation className="w-4 h-4" />
                          Track
                        </Link>
                      )}
                      {(activeTab === 'NEW' || activeTab === 'READY') && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer & Delivery Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {order.userId?.name || 'Customer'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {order.userId?.mobile}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {order.delivery_address?.city || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {order.delivery_slot}
                    </span>
                  </div>

                  {/* Broadcast Status Details (for READY tab) */}
                  {activeTab === 'READY' && orderIsBroadcasted && assignmentStatus && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Radio className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Broadcast Active</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-yellow-600">Rounds</p>
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
                          <p className="font-bold text-yellow-800">{formatTime(assignmentStatus.lastBroadcastAt)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Partner Info (for in-transit orders) */}
                  {order.delivery_partner?.name && activeTab === 'TRANSIT' && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Bike className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{order.delivery_partner.name}</p>
                            <p className="text-sm text-gray-600">{order.delivery_partner.phone}</p>
                          </div>
                        </div>
                        {deliveryStatus && (
                          <span className={cn("text-sm font-medium px-3 py-1 rounded-full", deliveryStatus.bg, deliveryStatus.color)}>
                            {deliveryStatus.text}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completed Order Info */}
                  {activeTab === 'COMPLETED' && order.delivered_at && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700">
                        Delivered {formatTime(order.delivered_at)}
                        {order.delivery_partner?.name && ` by ${order.delivery_partner.name}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Assign Rider Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Direct Assign Rider</h2>
                  <p className="text-sm opacity-90">Order: {selectedOrder.orderId}</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <img
                  src={selectedOrder.product_details?.image?.[0]}
                  alt=""
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 line-clamp-1">{selectedOrder.product_details?.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.payment_method === 'cod' ? `COD: ₹${selectedOrder.totalAmt}` : `Paid: ₹${selectedOrder.totalAmt}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Riders List */}
            <div className="p-4 overflow-y-auto max-h-[400px]">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Available Riders ({availableRiders.filter(r => !r.hasActiveOrder).length})
              </h3>

              {ridersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : availableRiders.filter(r => !r.hasActiveOrder).length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No riders available</p>
                  <p className="text-sm text-gray-500">All riders are offline or busy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableRiders
                    .filter(r => !r.hasActiveOrder)
                    .map(rider => (
                      <button
                        key={rider._id}
                        onClick={() => handleAssignRider(rider._id)}
                        disabled={assigning}
                        className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            {rider.avatar ? (
                              <img src={rider.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <Bike className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{rider.name}</p>
                            <p className="text-sm text-gray-500">{rider.mobile}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                          </span>
                          {rider.distance !== null && rider.distance !== undefined && (
                            <span className="text-xs text-gray-500">{rider.distance} km</span>
                          )}
                          {rider.score && (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <TrendingUp className="w-3 h-3" />
                              Score: {rider.score}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
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

export default AdminOrders
