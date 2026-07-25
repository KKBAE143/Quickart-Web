import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import {
    Users,
    Search,
    Filter,
    Bike,
    CheckCircle,
    Clock,
    Ban,
    Phone,
    Mail,
    IdCard,
    MapPin,
    Eye,
    RotateCcw,
    Calendar,
    Camera,
    FileText,
    XCircle,
    AlertTriangle,
    Expand,
    X,
    RefreshCw,
    Loader2,
    User,
    Car,
    Shield,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react'

const AdminAgents = () => {
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAgent, setSelectedAgent] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showSuspendModal, setShowSuspendModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showImageModal, setShowImageModal] = useState(false)
    const [enlargedImage, setEnlargedImage] = useState(null)
    const [suspendReason, setSuspendReason] = useState('')
    const [rejectReason, setRejectReason] = useState('')

    const statusOptions = [
        { value: 'ALL', label: 'All Agents', color: 'gray' },
        { value: 'Active', label: 'Active', color: 'green' },
        { value: 'Inactive', label: 'Pending Approval', color: 'yellow' },
        { value: 'Suspended', label: 'Suspended', color: 'red' },
        { value: 'Rejected', label: 'Rejected', color: 'red' }
    ]

    // Fetch delivery agents
    const fetchAgents = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.delivery.allAgents
            })

            if (response.data.success) {
                setAgents(response.data.data || [])
            }
        } catch (error) {
            console.log('Could not fetch agents:', error)
            AxiosToastError(error)
            setAgents([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAgents()
    }, [])

    // Filter agents based on status and search
    const filteredAgents = agents.filter(agent => {
        const matchesStatus = selectedStatus === 'ALL' || agent.status === selectedStatus
        const matchesSearch = !searchTerm ||
            agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.mobile?.includes(searchTerm)
        return matchesStatus && matchesSearch
    })

    // Stats calculation
    const stats = {
        total: agents.length,
        active: agents.filter(a => a.status === 'Active').length,
        pending: agents.filter(a => a.status === 'Inactive').length,
        suspended: agents.filter(a => a.status === 'Suspended').length,
        online: agents.filter(a => a.isOnline).length
    }

    // Open detail modal
    const openDetailModal = (agent) => {
        setSelectedAgent(agent)
        setShowDetailModal(true)
    }

    // Open suspend modal
    const openSuspendModal = (agent) => {
        setSelectedAgent(agent)
        setSuspendReason('')
        setShowSuspendModal(true)
    }

    // Open reject modal
    const openRejectModal = (agent) => {
        setSelectedAgent(agent)
        setRejectReason('')
        setShowRejectModal(true)
    }

    // Enlarge image for viewing
    const openImageModal = (imageUrl) => {
        setEnlargedImage(imageUrl)
        setShowImageModal(true)
    }

    // Update agent status (generic function)
    const updateAgentStatus = async (agentId, status, reason = '') => {
        try {
            setActionLoading(true)
            const response = await Axios({
                ...SummaryApi.delivery.updateAgentStatus,
                url: `${SummaryApi.delivery.updateAgentStatus.url}/${agentId}/status`,
                data: { status, reason }
            })

            if (response.data.success) {
                toast.success(response.data.message)
                fetchAgents()
                return true
            } else {
                toast.error(response.data.message || 'Failed to update status')
                return false
            }
        } catch (error) {
            AxiosToastError(error)
            return false
        } finally {
            setActionLoading(false)
        }
    }

    // Approve agent
    const handleApprove = async (agentId) => {
        const success = await updateAgentStatus(agentId, 'Active')
        if (success) {
            setShowDetailModal(false)
        }
    }

    // Suspend agent
    const handleSuspend = async () => {
        if (!selectedAgent) return

        if (!suspendReason.trim()) {
            toast.error('Please provide a reason for suspension')
            return
        }

        const success = await updateAgentStatus(selectedAgent._id, 'Suspended', suspendReason)
        if (success) {
            setShowSuspendModal(false)
            setShowDetailModal(false)
            setSuspendReason('')
        }
    }

    // Reject agent application
    const handleReject = async () => {
        if (!selectedAgent) return

        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        const success = await updateAgentStatus(selectedAgent._id, 'Rejected', rejectReason)
        if (success) {
            setShowRejectModal(false)
            setShowDetailModal(false)
            setRejectReason('')
        }
    }

    // Reactivate agent
    const handleReactivate = async (agentId) => {
        const success = await updateAgentStatus(agentId, 'Active')
        if (success) {
            setShowDetailModal(false)
        }
    }

    // Get status badge styles
    const getStatusStyles = (status) => {
        switch (status) {
            case 'Active':
                return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle }
            case 'Inactive':
                return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock }
            case 'Suspended':
                return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: Ban }
            case 'Rejected':
                return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: XCircle }
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Clock }
        }
    }

    // Get verification status styles
    const getVerificationStyles = (status) => {
        switch (status) {
            case 'VERIFIED':
                return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle }
            case 'PENDING':
                return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock }
            case 'REJECTED':
                return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle }
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: AlertTriangle }
        }
    }

    // Get ID type label
    const getIdTypeLabel = (idType) => {
        const labels = {
            'AADHAAR': 'Aadhaar Card',
            'PAN': 'PAN Card',
            'DRIVING_LICENSE': 'Driving License',
            'VOTER_ID': 'Voter ID'
        }
        return labels[idType] || idType
    }

    // Format date
    const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusBadge = (status) => {
        const styles = getStatusStyles(status)
        const Icon = styles.icon
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${styles.bg} ${styles.text} ${styles.border}`}>
                <Icon size={12} /> {status || 'Pending'}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="text-red-500" size={28} />
                            Delivery Agents
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manage and verify delivery partners
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAgents}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-sm text-green-600">Active</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-yellow-500" />
                            <span className="text-sm text-yellow-600">Pending</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Ban size={16} className="text-red-500" />
                            <span className="text-sm text-red-600">Suspended</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{stats.suspended}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-sm text-blue-600">Online</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{stats.online}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or mobile..."
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

                    {/* Status Filter */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all min-w-[180px]"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading agents...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredAgents.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bike size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Delivery Agents Found</h3>
                    <p className="text-gray-500 text-sm">
                        {agents.length === 0
                            ? 'No delivery agents have registered yet'
                            : 'Try adjusting your filters or search terms'}
                    </p>
                </div>
            )}

            {/* Agents Grid */}
            {!loading && filteredAgents.length > 0 && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredAgents.map((agent) => (
                        <div
                            key={agent._id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Agent Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                        {agent.avatar ? (
                                            <img src={agent.avatar} alt={agent.name} className="w-12 h-12 object-cover" />
                                        ) : (
                                            <Bike size={24} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{agent.name || 'Unnamed Agent'}</p>
                                        {getStatusBadge(agent.status)}
                                    </div>
                                    {agent.isOnline && (
                                        <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Online
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Agent Details */}
                            <div className="p-4 space-y-2.5">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{agent.mobile || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail size={14} className="text-gray-400" />
                                    <span className="truncate">{agent.email || 'N/A'}</span>
                                </div>
                                {agent.agentProfile?.vehicle && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Car size={14} className="text-gray-400" />
                                        <span>{agent.agentProfile.vehicle.type} - {agent.agentProfile.vehicle.number}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>Registered: {formatDate(agent.createdAt)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 pt-0 flex gap-2">
                                <button
                                    onClick={() => openDetailModal(agent)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
                                >
                                    <Eye size={14} /> View
                                </button>
                                {agent.status === 'Inactive' && (
                                    <button
                                        onClick={() => handleApprove(agent._id)}
                                        disabled={actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all text-sm font-medium disabled:opacity-50"
                                    >
                                        <ThumbsUp size={14} /> Approve
                                    </button>
                                )}
                                {agent.status === 'Active' && (
                                    <button
                                        onClick={() => openSuspendModal(agent)}
                                        disabled={actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all text-sm font-medium disabled:opacity-50"
                                    >
                                        <Ban size={14} /> Suspend
                                    </button>
                                )}
                                {agent.status === 'Suspended' && (
                                    <button
                                        onClick={() => handleReactivate(agent._id)}
                                        disabled={actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-medium disabled:opacity-50"
                                    >
                                        <RotateCcw size={14} /> Reactivate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Agent Detail Modal */}
            {showDetailModal && selectedAgent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gray-900 text-white p-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Agent Details</h2>
                                <p className="text-sm opacity-80 mt-0.5">{selectedAgent.name}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Status Banner */}
                            {selectedAgent.status === 'Inactive' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-yellow-700">
                                        <Clock size={18} />
                                        <span className="font-semibold">Pending Approval</span>
                                    </div>
                                    <p className="text-sm text-yellow-600 mt-1">
                                        This agent is waiting for admin approval to start accepting deliveries.
                                    </p>
                                </div>
                            )}
                            {selectedAgent.status === 'Suspended' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <Ban size={18} />
                                        <span className="font-semibold">Account Suspended</span>
                                    </div>
                                    {selectedAgent.agentProfile?.suspensionReason && (
                                        <p className="text-sm text-red-600 mt-1">
                                            Reason: {selectedAgent.agentProfile.suspensionReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Personal Info */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User size={18} className="text-gray-400" /> Personal Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                                        <p className="font-medium text-gray-900">{selectedAgent.name || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-500 mb-1">Email</p>
                                        <p className="font-medium text-gray-900">{selectedAgent.email || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-500 mb-1">Mobile</p>
                                        <p className="font-medium text-gray-900">{selectedAgent.mobile || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-500 mb-1">Status</p>
                                        {getStatusBadge(selectedAgent.status)}
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-500 mb-1">Registered On</p>
                                        <p className="font-medium text-gray-900">{formatDate(selectedAgent.createdAt)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-500 mb-1">Online Status</p>
                                        <p className="font-medium text-gray-900">
                                            {selectedAgent.isOnline ? (
                                                <span className="text-green-600 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                                                </span>
                                            ) : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            {selectedAgent.agentProfile?.vehicle && (
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Car size={18} className="text-gray-400" /> Vehicle Information
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">Type</p>
                                            <p className="font-medium text-gray-900">{selectedAgent.agentProfile.vehicle.type || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">Number</p>
                                            <p className="font-medium text-gray-900">{selectedAgent.agentProfile.vehicle.number || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">Model</p>
                                            <p className="font-medium text-gray-900">{selectedAgent.agentProfile.vehicle.model || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Documents & Verification */}
                            {selectedAgent.agentProfile?.documents && (
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield size={18} className="text-gray-400" /> Documents & Verification
                                    </h3>

                                    {/* Verification Status Banner */}
                                    {selectedAgent.agentProfile.documents.verificationStatus && (
                                        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 border ${getVerificationStyles(selectedAgent.agentProfile.documents.verificationStatus).bg} ${getVerificationStyles(selectedAgent.agentProfile.documents.verificationStatus).border}`}>
                                            {React.createElement(getVerificationStyles(selectedAgent.agentProfile.documents.verificationStatus).icon, {
                                                size: 16,
                                                className: getVerificationStyles(selectedAgent.agentProfile.documents.verificationStatus).text
                                            })}
                                            <span className={`font-medium text-sm ${getVerificationStyles(selectedAgent.agentProfile.documents.verificationStatus).text}`}>
                                                Document Status: {selectedAgent.agentProfile.documents.verificationStatus}
                                            </span>
                                            {selectedAgent.agentProfile.documents.submittedAt && (
                                                <span className="text-xs text-gray-500 ml-auto">
                                                    Submitted: {formatDate(selectedAgent.agentProfile.documents.submittedAt)}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* ID Details */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">ID Type</p>
                                            <p className="font-medium text-gray-900">{getIdTypeLabel(selectedAgent.agentProfile.documents.idType) || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">ID Number</p>
                                            <p className="font-medium text-gray-900 font-mono">{selectedAgent.agentProfile.documents.idNumber || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Document Images */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* ID Document Image */}
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
                                                <FileText size={14} className="text-blue-600" />
                                                <span className="font-medium text-gray-700 text-sm">ID Document Photo</span>
                                            </div>
                                            {selectedAgent.agentProfile.documents.idDocumentImage ? (
                                                <div
                                                    className="relative cursor-pointer group"
                                                    onClick={() => openImageModal(selectedAgent.agentProfile.documents.idDocumentImage)}
                                                >
                                                    <img
                                                        src={selectedAgent.agentProfile.documents.idDocumentImage}
                                                        alt="ID Document"
                                                        className="w-full h-48 object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                        <Expand size={24} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-48 flex items-center justify-center bg-gray-50">
                                                    <p className="text-gray-400 text-sm">No image uploaded</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Selfie Image */}
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
                                                <Camera size={14} className="text-green-600" />
                                                <span className="font-medium text-gray-700 text-sm">Selfie (Face Verification)</span>
                                            </div>
                                            {selectedAgent.agentProfile.documents.selfieImage ? (
                                                <div
                                                    className="relative cursor-pointer group"
                                                    onClick={() => openImageModal(selectedAgent.agentProfile.documents.selfieImage)}
                                                >
                                                    <img
                                                        src={selectedAgent.agentProfile.documents.selfieImage}
                                                        alt="Selfie"
                                                        className="w-full h-48 object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                        <Expand size={24} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-48 flex items-center justify-center bg-gray-50">
                                                    <p className="text-gray-400 text-sm">No selfie uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Verification Hint for Pending */}
                                    {selectedAgent.status === 'Inactive' && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                            <p className="text-sm text-blue-700 flex items-start gap-2">
                                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                                <span>Please verify that the ID document matches the selfie before approving this rider. Click on images to enlarge.</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                                {selectedAgent.status === 'Inactive' && (
                                    <>
                                        <button
                                            onClick={() => handleApprove(selectedAgent._id)}
                                            disabled={actionLoading}
                                            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <ThumbsUp size={16} /> Approve
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false)
                                                openRejectModal(selectedAgent)
                                            }}
                                            disabled={actionLoading}
                                            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                        >
                                            <ThumbsDown size={16} /> Reject
                                        </button>
                                    </>
                                )}
                                {selectedAgent.status === 'Active' && (
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false)
                                            openSuspendModal(selectedAgent)
                                        }}
                                        disabled={actionLoading}
                                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                    >
                                        <Ban size={16} /> Suspend Agent
                                    </button>
                                )}
                                {selectedAgent.status === 'Suspended' && (
                                    <button
                                        onClick={() => handleReactivate(selectedAgent._id)}
                                        disabled={actionLoading}
                                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <RotateCcw size={16} /> Reactivate Agent
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 min-w-[150px] px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Agent Modal */}
            {showSuspendModal && selectedAgent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-red-600 text-white p-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Suspend Agent</h2>
                                <p className="text-sm opacity-80 mt-0.5">{selectedAgent.name}</p>
                            </div>
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <p className="text-sm text-red-700">
                                    <strong>Warning:</strong> Suspending this agent will prevent them from accepting new deliveries and set them offline immediately.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Suspension *
                                </label>
                                <textarea
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="Enter the reason for suspension..."
                                    rows={4}
                                    className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowSuspendModal(false)}
                                    disabled={actionLoading}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSuspend}
                                    disabled={actionLoading || !suspendReason.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Ban size={16} /> Suspend
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Agent Modal */}
            {showRejectModal && selectedAgent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-orange-600 text-white p-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Reject Application</h2>
                                <p className="text-sm opacity-80 mt-0.5">{selectedAgent.name}</p>
                            </div>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <p className="text-sm text-orange-700">
                                    <strong>Note:</strong> Rejecting this application will notify the rider. They may reapply with corrected documents.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Rejection *
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g., ID document is unclear, selfie does not match ID photo, incomplete documents..."
                                    rows={4}
                                    className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    disabled={actionLoading}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading || !rejectReason.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <ThumbsDown size={16} /> Reject
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Enlargement Modal */}
            {showImageModal && enlargedImage && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    <button
                        onClick={() => setShowImageModal(false)}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 p-3 rounded-xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={enlargedImage}
                        alt="Enlarged document"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}

export default AdminAgents
