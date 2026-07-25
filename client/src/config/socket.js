import { io } from 'socket.io-client';

/**
 * Socket Service
 *
 * Centralized socket.io connection management for:
 * - Real-time order tracking
 * - Rider location updates
 * - Admin live monitoring
 * - Chat and calls
 */
class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = new Map();
    }

    /**
     * Connect to socket server
     */
    connect(serverUrl) {
        if (this.socket && this.isConnected) {
            console.log('Socket already connected');
            return;
        }

        const url = serverUrl || (import.meta.env.DEV
            ? 'http://localhost:5000'
            : import.meta.env.VITE_API_URL);

        console.log('Connecting to socket server:', url);

        this.socket = io(url, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true
        });

        this.setupListeners();
    }

    /**
     * Setup core event listeners
     */
    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
            }
        });

        this.socket.on('identity:confirmed', (data) => {
            console.log('Socket identity confirmed:', data);
        });
    }

    /**
     * Identify user to socket server
     */
    identify(userId) {
        if (!this.socket || !this.isConnected) {
            console.warn('Socket not connected, cannot identify');
            return;
        }
        this.socket.emit('identity', { userId });
    }

    /**
     * Join agent room (for delivery partners)
     */
    joinAgentRoom(agentId) {
        if (!this.socket) return;
        this.socket.emit('agent:join', agentId);
    }

    /**
     * Leave agent room
     */
    leaveAgentRoom(agentId) {
        if (!this.socket) return;
        this.socket.emit('agent:leave', agentId);
    }

    /**
     * Track an order (join order room)
     */
    trackOrder(orderId) {
        if (!this.socket) return;
        this.socket.emit('customer:track-order', { orderId });
    }

    /**
     * Stop tracking order (leave order room)
     */
    untrackOrder(orderId) {
        if (!this.socket) return;
        this.socket.emit('customer:untrack-order', { orderId });
    }

    /**
     * Update rider location
     */
    updateRiderLocation(data) {
        if (!this.socket) return;
        this.socket.emit('rider:location', data);
    }

    /**
     * Rider goes online
     */
    riderOnline(riderId, location) {
        if (!this.socket) return;
        this.socket.emit('rider:online', { riderId, location });
    }

    /**
     * Rider goes offline
     */
    riderOffline(riderId) {
        if (!this.socket) return;
        this.socket.emit('rider:offline', { riderId });
    }

    /**
     * Admin joins tracking room
     */
    joinAdminTracking() {
        if (!this.socket) return;
        this.socket.emit('admin:join-tracking');
    }

    /**
     * Admin leaves tracking room
     */
    leaveAdminTracking() {
        if (!this.socket) return;
        this.socket.emit('admin:leave-tracking');
    }

    /**
     * Subscribe to an event
     */
    on(event, callback) {
        if (!this.socket) return;
        this.socket.on(event, callback);
        this.listeners.set(event, callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.socket) return;
        if (callback) {
            this.socket.off(event, callback);
        } else {
            this.socket.off(event);
        }
        this.listeners.delete(event);
    }

    /**
     * Emit an event
     */
    emit(event, data) {
        if (!this.socket || !this.isConnected) {
            console.warn('Socket not connected, cannot emit:', event);
            return;
        }
        this.socket.emit(event, data);
    }

    /**
     * Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            socketId: this.socket?.id,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Export singleton instance
export const socketService = new SocketService();

export default SocketService;
