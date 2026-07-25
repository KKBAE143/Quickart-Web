import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    RefreshCw,
    MapPin,
    Phone,
    Eye,
    User,
    Package,
    Bike,
    Wallet,
    Truck,
    Star,
    Loader2,
    Navigation,
    Circle,
    Clock,
    TrendingUp,
    CheckCircle,
    MapPinned,
    PhoneCall,
    X,
    Grid3X3,
    List,
    Map,
    Search,
    Filter,
    ChevronDown,
    Maximize2,
    LayoutGrid
} from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { socketService } from '../config/socket';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import RiderTrackingCard from '../components/RiderTrackingCard';

/**
 * Admin Rider Tracking Dashboard
 *
 * Production-level multi-rider tracking system for delivery fleet management.
 *
 * Features:
 * - Multiple view modes: Grid (individual maps), List, Master Map
 * - Each rider card has isolated real-time location subscription
 * - Search and filter capabilities
 * - Expandable rider cards for detailed view
 * - Master map shows all riders at once
 */
export default function AdminRiderTracking() {
    const navigate = useNavigate();

    // Refs for master map
    const masterMapRef = useRef(null);
    const masterMapInstanceRef = useRef(null);
    const markersRef = useRef({});

    // State
    const [loading, setLoading] = useState(true);
    const [riders, setRiders] = useState([]);
    const [selectedRider, setSelectedRider] = useState(null);
    const [riderDetails, setRiderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // View controls
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'masterMap'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'available'
    const [expandedRider, setExpandedRider] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Calculate stats
    const stats = useMemo(() => ({
        total: riders.length,
        active: riders.filter(r => r.activeOrderId).length,
        available: riders.filter(r => !r.activeOrderId).length
    }), [riders]);

    // Filter riders based on search and status
    const filteredRiders = useMemo(() => {
        return riders.filter(rider => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    rider.name?.toLowerCase().includes(query) ||
                    rider.mobile?.includes(query) ||
                    rider.vehicle?.number?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (filterStatus === 'active' && !rider.activeOrderId) return false;
            if (filterStatus === 'available' && rider.activeOrderId) return false;

            return true;
        });
    }, [riders, searchQuery, filterStatus]);

    // Fetch online riders
    const fetchRiders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.delivery.onlineRiders
            });

            if (response.data.success) {
                setRiders(response.data.data);
            }
        } catch (error) {
            console.error('Fetch riders error:', error);
            toast.error('Failed to fetch riders');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch rider details
    const fetchRiderDetails = async (riderId) => {
        try {
            setLoadingDetails(true);
            const response = await Axios({
                url: `/api/delivery/admin/rider/${riderId}`,
                method: 'get'
            });

            if (response.data.success) {
                setRiderDetails(response.data.data);
            }
        } catch (error) {
            console.error('Fetch rider details error:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchRiders();
    }, [fetchRiders]);

    // Initialize Master Map (only when in masterMap mode)
    useEffect(() => {
        if (viewMode !== 'masterMap' || !window.google || !masterMapRef.current) return;

        if (masterMapInstanceRef.current) return; // Already initialized

        const map = new window.google.maps.Map(masterMapRef.current, {
            center: { lat: 28.6139, lng: 77.2090 },
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            styles: [
                {
                    featureType: 'poi',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        masterMapInstanceRef.current = map;

        return () => {
            Object.values(markersRef.current).forEach(marker => marker.setMap(null));
            markersRef.current = {};
        };
    }, [viewMode]);

    // Update master map markers when riders change
    useEffect(() => {
        if (viewMode !== 'masterMap' || !masterMapInstanceRef.current) return;

        const map = masterMapInstanceRef.current;

        // Update or create markers for each rider
        filteredRiders.forEach(rider => {
            if (!rider.location?.lat || !rider.location?.lng) return;

            const position = { lat: rider.location.lat, lng: rider.location.lng };

            if (markersRef.current[rider._id]) {
                markersRef.current[rider._id].setPosition(position);
            } else {
                const marker = new window.google.maps.Marker({
                    position,
                    map,
                    icon: {
                        url: rider.activeOrderId
                            ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40)
                    },
                    title: rider.name
                });

                marker.addListener('click', () => {
                    setSelectedRider(rider._id);
                    fetchRiderDetails(rider._id);
                });

                markersRef.current[rider._id] = marker;
            }
        });

        // Remove markers for filtered out riders
        const currentRiderIds = new Set(filteredRiders.map(r => r._id));
        Object.keys(markersRef.current).forEach(riderId => {
            if (!currentRiderIds.has(riderId)) {
                markersRef.current[riderId].setMap(null);
                delete markersRef.current[riderId];
            }
        });
    }, [filteredRiders, viewMode]);

    // Listen for real-time location updates
    useEffect(() => {
        socketService.socket?.emit('admin:join-tracking');

        const handleLocationUpdate = (data) => {
            setRiders(prev => prev.map(rider => {
                if (rider._id === data.riderId) {
                    return {
                        ...rider,
                        location: data.location
                    };
                }
                return rider;
            }));
        };

        const handleRiderOnline = (data) => {
            fetchRiders();
            toast.success(`Rider is now online`, { icon: '🟢' });
        };

        const handleRiderOffline = (data) => {
            setRiders(prev => prev.filter(r => r._id !== data.riderId));
            if (selectedRider === data.riderId) {
                setSelectedRider(null);
                setRiderDetails(null);
            }
            toast(`Rider went offline`, { icon: '🔴' });
        };

        socketService.socket?.on('rider-location-update', handleLocationUpdate);
        socketService.socket?.on('rider-online', handleRiderOnline);
        socketService.socket?.on('rider-offline', handleRiderOffline);

        return () => {
            socketService.socket?.emit('admin:leave-tracking');
            socketService.socket?.off('rider-location-update', handleLocationUpdate);
            socketService.socket?.off('rider-online', handleRiderOnline);
            socketService.socket?.off('rider-offline', handleRiderOffline);
        };
    }, [selectedRider, fetchRiders]);

    // Focus master map on selected rider
    useEffect(() => {
        if (viewMode !== 'masterMap' || !selectedRider || !masterMapInstanceRef.current) return;

        const rider = riders.find(r => r._id === selectedRider);
        if (rider?.location?.lat && rider?.location?.lng) {
            masterMapInstanceRef.current.panTo({
                lat: rider.location.lat,
                lng: rider.location.lng
            });
            masterMapInstanceRef.current.setZoom(15);
        }
    }, [selectedRider, riders, viewMode]);

    // Handle rider expand
    const handleExpandRider = useCallback((riderId) => {
        setExpandedRider(prev => prev === riderId ? null : riderId);
    }, []);

    // Handle call rider
    const handleCallRider = useCallback((mobile) => {
        window.open(`tel:${mobile}`, '_self');
    }, []);

    // Handle view order
    const handleViewOrder = useCallback((orderId) => {
        navigate(`/dashboard/admin-orders?orderId=${orderId}`);
    }, [navigate]);

    // Close details panel
    const closeDetails = () => {
        setSelectedRider(null);
        setRiderDetails(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <MapPinned className="text-red-500" size={28} />
                            Live Rider Tracking
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Real-time location monitoring for delivery agents
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <LayoutGrid size={16} />
                                <span className="hidden sm:inline">Grid</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <List size={16} />
                                <span className="hidden sm:inline">List</span>
                            </button>
                            <button
                                onClick={() => setViewMode('masterMap')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'masterMap'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Map size={16} />
                                <span className="hidden sm:inline">Map</span>
                            </button>
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

                {/* Stats Cards */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`rounded-xl p-4 border transition-colors ${
                            filterStatus === 'all'
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-100 hover:border-blue-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Circle size={16} className="text-blue-500 fill-blue-500" />
                            <span className="text-sm text-blue-600">Total Online</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`rounded-xl p-4 border transition-colors ${
                            filterStatus === 'active'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-100 hover:border-green-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Navigation size={16} className="text-green-500" />
                            <span className="text-sm text-green-600">Active Delivery</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                    </button>
                    <button
                        onClick={() => setFilterStatus('available')}
                        className={`rounded-xl p-4 border transition-colors ${
                            filterStatus === 'available'
                                ? 'bg-gray-100 border-gray-300'
                                : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-600">Available</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-700">{stats.available}</p>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or vehicle..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                        />
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-gray-400 mb-3" />
                        <p className="text-gray-500">Loading riders...</p>
                    </div>
                </div>
            ) : filteredRiders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <Bike size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No riders found</h3>
                        <p className="text-gray-500 text-sm text-center">
                            {searchQuery || filterStatus !== 'all'
                                ? 'Try adjusting your search or filter'
                                : 'No riders are currently online'}
                        </p>
                        {(searchQuery || filterStatus !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterStatus('all');
                                }}
                                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View - Individual Map Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredRiders.map((rider) => (
                        <RiderTrackingCard
                            key={rider._id}
                            rider={rider}
                            isExpanded={expandedRider === rider._id}
                            onExpand={handleExpandRider}
                            onCall={handleCallRider}
                            onViewOrder={handleViewOrder}
                        />
                    ))}
                </div>
            ) : viewMode === 'list' ? (
                /* List View */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredRiders.map((rider) => (
                            <div
                                key={rider._id}
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setSelectedRider(rider._id);
                                    fetchRiderDetails(rider._id);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {rider.avatar ? (
                                                <img
                                                    src={rider.avatar}
                                                    alt={rider.name}
                                                    className="w-12 h-12 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                                                    <User size={20} className="text-gray-500" />
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                                rider.activeOrderId ? 'bg-green-500' : 'bg-blue-500'
                                            }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{rider.name}</h3>
                                            <p className="text-sm text-gray-500">{rider.mobile}</p>
                                            {rider.vehicle && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {rider.vehicle.type} - {rider.vehicle.number}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {rider.activeOrderId && (
                                            <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-100">
                                                Active Delivery
                                            </span>
                                        )}

                                        {rider.metrics && (
                                            <div className="hidden md:flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-gray-900">{rider.metrics.totalDeliveries || 0}</p>
                                                    <p className="text-xs text-gray-500">Deliveries</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-green-600">{DisplayPriceInRupees(rider.metrics.totalEarnings || 0)}</p>
                                                    <p className="text-xs text-gray-500">Earnings</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                    <p className="text-sm font-bold text-gray-900">{rider.metrics.averageRating?.toFixed(1) || '-'}</p>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCallRider(rider.mobile);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Phone size={18} className="text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Master Map View */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
                        {/* Map */}
                        <div className="flex-1 relative">
                            <div
                                ref={masterMapRef}
                                className="w-full h-full bg-gray-100"
                            >
                                {!window.google && (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <Loader2 size={32} className="animate-spin mb-3" />
                                        <span>Loading map...</span>
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Legend</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-gray-700">Active Delivery</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span className="text-gray-700">Available</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Riders List */}
                        <div className="w-full lg:w-96 bg-gray-50 border-l border-gray-100 flex flex-col">
                            <div className="p-4 bg-white border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Bike size={18} className="text-gray-400" />
                                    Online Riders
                                    <span className="ml-auto text-sm font-normal text-gray-500">{filteredRiders.length} online</span>
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="divide-y divide-gray-100">
                                    {filteredRiders.map((rider) => (
                                        <div
                                            key={rider._id}
                                            onClick={() => {
                                                setSelectedRider(rider._id);
                                                fetchRiderDetails(rider._id);
                                            }}
                                            className={`p-4 cursor-pointer transition-colors ${
                                                selectedRider === rider._id
                                                    ? 'bg-white border-l-4 border-gray-900'
                                                    : 'hover:bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {rider.avatar ? (
                                                        <img
                                                            src={rider.avatar}
                                                            alt={rider.name}
                                                            className="w-10 h-10 rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                                                            <User size={18} className="text-gray-500" />
                                                        </div>
                                                    )}
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                                        rider.activeOrderId ? 'bg-green-500' : 'bg-blue-500'
                                                    }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{rider.name}</p>
                                                    <p className="text-xs text-gray-500">{rider.mobile}</p>
                                                </div>
                                                {rider.activeOrderId && (
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Rider Details */}
                            {selectedRider && (
                                <div className="border-t border-gray-200 bg-white p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Eye size={16} className="text-gray-400" />
                                            Rider Details
                                        </h3>
                                        <button
                                            onClick={closeDetails}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <X size={16} className="text-gray-400" />
                                        </button>
                                    </div>

                                    {loadingDetails ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 size={24} className="animate-spin text-gray-400" />
                                        </div>
                                    ) : riderDetails ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Status</span>
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                    riderDetails.rider?.agentProfile?.backgroundCheck?.status === 'APPROVED'
                                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                                        : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                                }`}>
                                                    {riderDetails.rider?.agentProfile?.backgroundCheck?.status || 'PENDING'}
                                                </span>
                                            </div>

                                            {riderDetails.wallet && (
                                                <>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                        <span className="text-sm text-gray-600 flex items-center gap-2">
                                                            <Wallet size={14} className="text-gray-400" />
                                                            Wallet Balance
                                                        </span>
                                                        <span className="font-semibold text-green-600">
                                                            {DisplayPriceInRupees(riderDetails.wallet.currentBalance || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                        <span className="text-sm text-gray-600 flex items-center gap-2">
                                                            <TrendingUp size={14} className="text-gray-400" />
                                                            Today's Earnings
                                                        </span>
                                                        <span className="font-semibold text-gray-900">
                                                            {DisplayPriceInRupees(riderDetails.wallet.todayEarnings || 0)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {riderDetails.recentOrders?.length > 0 && (
                                                <div className="pt-3 border-t border-gray-100">
                                                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                        <Package size={14} className="text-gray-400" />
                                                        Recent Orders
                                                    </p>
                                                    <div className="space-y-2">
                                                        {riderDetails.recentOrders.slice(0, 3).map(order => (
                                                            <div key={order._id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                                                                <span className="text-gray-600 font-mono">#{order.orderId?.slice(-8)}</span>
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                    order.order_status === 'DELIVERED'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                    {order.order_status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => window.open(`tel:${riderDetails.rider?.mobile}`, '_self')}
                                                className="w-full mt-2 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
                                            >
                                                <PhoneCall size={16} />
                                                Call Rider
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">Select a rider to view details</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
