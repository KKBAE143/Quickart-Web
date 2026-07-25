import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../config/socket';

/**
 * useRiderTracking Hook
 *
 * Provides isolated real-time location tracking for a specific rider.
 * Each hook instance subscribes only to updates for the specified rider,
 * similar to how leading quick commerce platforms track individual delivery partners.
 *
 * Features:
 * - Isolated socket subscription per rider
 * - Heading calculation from movement
 * - Path history tracking
 * - Connection status monitoring
 * - Automatic reconnection handling
 */
export function useRiderTracking(riderId, options = {}) {
    const {
        enablePathHistory = true,
        maxPathPoints = 100,
        onLocationUpdate = null,
        onStatusChange = null
    } = options;

    // State
    const [location, setLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const [pathHistory, setPathHistory] = useState([]);
    const [isOnline, setIsOnline] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [riderMeta, setRiderMeta] = useState(null);

    // Refs for calculations
    const previousLocation = useRef(null);
    const subscriptionActive = useRef(false);

    /**
     * Calculate heading/bearing between two points
     */
    const calculateHeading = useCallback((from, to) => {
        if (!from || !to) return 0;

        const lat1 = from.lat * Math.PI / 180;
        const lat2 = to.lat * Math.PI / 180;
        const dLng = (to.lng - from.lng) * Math.PI / 180;

        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }, []);

    /**
     * Handle incoming location update
     */
    const handleLocationUpdate = useCallback((data) => {
        // Only process updates for our specific rider
        if (data.riderId !== riderId && data.agentId !== riderId) return;

        const newLocation = data.location || {
            lat: data.lat,
            lng: data.lng
        };

        if (!newLocation?.lat || !newLocation?.lng) return;

        // Calculate heading from movement
        if (previousLocation.current) {
            const newHeading = calculateHeading(previousLocation.current, newLocation);
            setHeading(newHeading);
        }

        previousLocation.current = newLocation;
        setLocation(newLocation);
        setLastUpdate(new Date());
        setIsOnline(true);

        // Update path history
        if (enablePathHistory) {
            setPathHistory(prev => {
                const updated = [...prev, newLocation];
                // Keep only last N points for performance
                return updated.slice(-maxPathPoints);
            });
        }

        // Update meta info if provided
        if (data.riderName || data.vehicleNumber || data.activeOrderId) {
            setRiderMeta(prev => ({
                ...prev,
                name: data.riderName || prev?.name,
                vehicle: data.vehicleNumber || prev?.vehicle,
                activeOrderId: data.activeOrderId || prev?.activeOrderId,
                speed: data.speed || prev?.speed
            }));
        }

        // Callback for external handling
        if (onLocationUpdate) {
            onLocationUpdate({
                riderId,
                location: newLocation,
                heading,
                timestamp: new Date()
            });
        }
    }, [riderId, calculateHeading, enablePathHistory, maxPathPoints, onLocationUpdate, heading]);

    /**
     * Handle rider online/offline status
     */
    const handleRiderStatus = useCallback((data, isOnlineStatus) => {
        if (data.riderId !== riderId) return;

        setIsOnline(isOnlineStatus);
        if (onStatusChange) {
            onStatusChange({ riderId, isOnline: isOnlineStatus });
        }

        if (!isOnlineStatus) {
            // Rider went offline - clear location after a delay
            setTimeout(() => {
                if (!subscriptionActive.current) return;
                setLocation(null);
            }, 5000);
        }
    }, [riderId, onStatusChange]);

    /**
     * Subscribe to rider's location updates
     */
    const subscribe = useCallback(() => {
        if (!riderId || subscriptionActive.current) return;

        // Ensure socket is connected
        if (!socketService.socket?.connected) {
            socketService.connect();
        }

        subscriptionActive.current = true;
        setConnectionStatus('connecting');

        // Join rider-specific tracking room
        socketService.socket?.emit('admin:track-rider', { riderId });

        // Setup listeners
        socketService.on('rider-location-update', handleLocationUpdate);
        socketService.on('order:location-update', handleLocationUpdate);
        socketService.on('rider-online', (data) => handleRiderStatus(data, true));
        socketService.on('rider-offline', (data) => handleRiderStatus(data, false));

        setConnectionStatus('connected');

        console.log(`[useRiderTracking] Subscribed to rider: ${riderId}`);
    }, [riderId, handleLocationUpdate, handleRiderStatus]);

    /**
     * Unsubscribe from rider's location updates
     */
    const unsubscribe = useCallback(() => {
        if (!riderId || !subscriptionActive.current) return;

        subscriptionActive.current = false;

        // Leave rider-specific tracking room
        socketService.socket?.emit('admin:untrack-rider', { riderId });

        // Remove listeners
        socketService.off('rider-location-update', handleLocationUpdate);
        socketService.off('order:location-update', handleLocationUpdate);
        socketService.off('rider-online');
        socketService.off('rider-offline');

        setConnectionStatus('disconnected');

        console.log(`[useRiderTracking] Unsubscribed from rider: ${riderId}`);
    }, [riderId, handleLocationUpdate]);

    /**
     * Clear path history
     */
    const clearPathHistory = useCallback(() => {
        setPathHistory([]);
    }, []);

    /**
     * Force refresh - request current location
     */
    const refresh = useCallback(() => {
        if (!riderId) return;
        socketService.socket?.emit('admin:request-rider-location', { riderId });
    }, [riderId]);

    // Setup subscription on mount
    useEffect(() => {
        subscribe();
        return () => unsubscribe();
    }, [subscribe, unsubscribe]);

    // Monitor socket connection status
    useEffect(() => {
        const checkConnection = () => {
            if (socketService.socket?.connected) {
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('disconnected');
            }
        };

        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    return {
        // Location data
        location,
        heading,
        pathHistory,

        // Status
        isOnline,
        lastUpdate,
        connectionStatus,

        // Meta info
        riderMeta,

        // Actions
        subscribe,
        unsubscribe,
        refresh,
        clearPathHistory
    };
}

/**
 * useMultiRiderTracking Hook
 *
 * Manages tracking for multiple riders simultaneously.
 * Used for the master map view.
 */
export function useMultiRiderTracking(riderIds = []) {
    const [ridersData, setRidersData] = useState({});
    const subscriptionsRef = useRef(new Set());

    const handleLocationUpdate = useCallback((data) => {
        const riderId = data.riderId || data.agentId;
        if (!riderId) return;

        setRidersData(prev => ({
            ...prev,
            [riderId]: {
                ...prev[riderId],
                location: data.location || { lat: data.lat, lng: data.lng },
                lastUpdate: new Date(),
                isOnline: true
            }
        }));
    }, []);

    const handleRiderOnline = useCallback((data) => {
        setRidersData(prev => ({
            ...prev,
            [data.riderId]: {
                ...prev[data.riderId],
                isOnline: true
            }
        }));
    }, []);

    const handleRiderOffline = useCallback((data) => {
        setRidersData(prev => ({
            ...prev,
            [data.riderId]: {
                ...prev[data.riderId],
                isOnline: false
            }
        }));
    }, []);

    useEffect(() => {
        if (!socketService.socket?.connected) {
            socketService.connect();
        }

        // Join admin tracking room
        socketService.socket?.emit('admin:join-tracking');

        // Setup listeners
        socketService.on('rider-location-update', handleLocationUpdate);
        socketService.on('rider-online', handleRiderOnline);
        socketService.on('rider-offline', handleRiderOffline);

        return () => {
            socketService.socket?.emit('admin:leave-tracking');
            socketService.off('rider-location-update', handleLocationUpdate);
            socketService.off('rider-online', handleRiderOnline);
            socketService.off('rider-offline', handleRiderOffline);
        };
    }, [handleLocationUpdate, handleRiderOnline, handleRiderOffline]);

    return {
        ridersData,
        getRiderLocation: (id) => ridersData[id]?.location,
        isRiderOnline: (id) => ridersData[id]?.isOnline ?? false
    };
}

export default useRiderTracking;
