import { useState, memo } from 'react';
import {
    Phone,
    Package,
    User,
    Maximize2,
    Minimize2,
    ExternalLink,
    Star,
    Bike,
    RefreshCw
} from 'lucide-react';
import RiderMapWidget from './RiderMapWidget';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

/**
 * RiderTrackingCard Component
 *
 * Individual rider tracking card with its own Google Map instance.
 * Uses RiderMapWidget for smooth real-time tracking with Uber/Zomato style animations.
 *
 * Production-level features like Blinkit/Zepto/Instamart:
 * - Isolated real-time location subscription via RiderMapWidget
 * - Smooth marker animation
 * - ETA and distance calculations
 * - Path trail showing rider movement
 * - Expandable/collapsible view
 */
const RiderTrackingCard = memo(function RiderTrackingCard({
    rider,
    onExpand,
    onCall,
    onViewOrder,
    isExpanded = false
}) {
    const [isOnline, setIsOnline] = useState(true);

    // Handle location update from widget
    const handleLocationUpdate = (data) => {
        if (data.location) {
            setIsOnline(true);
        }
    };

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${
            isExpanded ? 'col-span-2 row-span-2' : ''
        }`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                            {rider.avatar ? (
                                <img
                                    src={rider.avatar}
                                    alt={rider.name}
                                    className="w-10 h-10 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <User size={18} className="text-gray-500" />
                                </div>
                            )}
                            {/* Online indicator */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                isOnline || rider.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{rider.name}</h3>
                            <p className="text-xs text-gray-500">{rider.mobile}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Active order badge */}
                        {rider.activeOrderId && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100">
                                Active
                            </span>
                        )}

                        {/* Expand button */}
                        <button
                            onClick={() => onExpand?.(rider._id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? (
                                <Minimize2 size={16} className="text-gray-500" />
                            ) : (
                                <Maximize2 size={16} className="text-gray-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Vehicle info */}
                {rider.vehicle && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <Bike size={12} />
                        <span>{rider.vehicle.type} - {rider.vehicle.number}</span>
                    </div>
                )}
            </div>

            {/* Map Widget - Uses smooth animation */}
            <RiderMapWidget
                riderId={rider._id}
                initialLocation={rider.location}
                customerLocation={rider.activeOrder?.customerLocation}
                storeLocation={rider.activeOrder?.storeLocation}
                height={isExpanded ? '300px' : '180px'}
                showStats={true}
                onLocationUpdate={handleLocationUpdate}
            />

            {/* Footer - Active Order Info */}
            {rider.activeOrder && (
                <div className="p-3 bg-green-50 border-t border-green-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package size={14} className="text-green-600" />
                            <span className="text-xs font-medium text-green-800">
                                Order #{rider.activeOrder.orderId?.slice(-8)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600">
                                {rider.activeOrder.status?.replace(/_/g, ' ')}
                            </span>
                            {onViewOrder && (
                                <button
                                    onClick={() => onViewOrder(rider.activeOrder._id)}
                                    className="p-1 hover:bg-green-100 rounded transition-colors"
                                >
                                    <ExternalLink size={12} className="text-green-600" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer - Stats & Actions */}
            <div className="p-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    {/* Stats */}
                    <div className="flex items-center gap-4">
                        {rider.metrics && (
                            <>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900">{rider.metrics.totalDeliveries || 0}</p>
                                    <p className="text-[10px] text-gray-500">Deliveries</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-0.5">
                                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                        <p className="text-sm font-bold text-gray-900">
                                            {rider.metrics.averageRating?.toFixed(1) || '-'}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Rating</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onCall?.(rider.mobile)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                            <Phone size={12} />
                            Call
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default RiderTrackingCard;
