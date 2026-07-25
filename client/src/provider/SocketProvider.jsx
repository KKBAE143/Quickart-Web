import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        // Connect directly to backend for Socket.io
        // Vite proxy doesn't handle WebSocket upgrades well for Socket.io
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true
        });

        // Connection event listeners
        newSocket.on('connect', () => {
            console.log('Socket.io connected:', newSocket.id);
            setConnected(true);
            
            // Re-send identity if we were connected before
            if (userId) {
                newSocket.emit('identity', { userId });
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket.io disconnected:', reason);
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket.io connection error:', error);
            setConnected(false);
        });
        
        // Listen for identity confirmation
        newSocket.on('identity:confirmed', (data) => {
            console.log('Identity confirmed:', data);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            console.log('Cleaning up Socket.io connection');
            newSocket.disconnect();
        };
    }, [userId]);

    // Helper functions for order tracking
    const trackOrder = (orderId) => {
        if (socket && connected) {
            socket.emit('track-order', orderId);
            console.log('Tracking order:', orderId);
        }
    };

    const untrackOrder = (orderId) => {
        if (socket && connected) {
            socket.emit('untrack-order', orderId);
            console.log('Stopped tracking order:', orderId);
        }
    };

    const onOrderStatusUpdate = (callback) => {
        if (socket) {
            socket.on('order-status-updated', callback);
        }
    };

    const offOrderStatusUpdate = (callback) => {
        if (socket) {
            socket.off('order-status-updated', callback);
        }
    };

    const joinCall = (roomId, payload = {}) => {
        if (socket && connected) {
            socket.emit('call:join', { roomId, ...payload });
        }
    };

    const leaveCall = (roomId, payload = {}) => {
        if (socket && connected) {
            socket.emit('call:leave', { roomId, ...payload });
        }
    };

    const sendCallSignal = (roomId, type, data) => {
        if (socket && connected) {
            socket.emit('call:signal', { roomId, type, data });
        }
    };

    const onCallSignal = (callback) => {
        if (socket) {
            socket.on('call:signal', callback);
        }
    };

    const offCallSignal = (callback) => {
        if (socket) {
            socket.off('call:signal', callback);
        }
    };

    const onCallEnded = (callback) => {
        if (socket) {
            socket.on('call:ended', callback);
        }
    };

    const offCallEnded = (callback) => {
        if (socket) {
            socket.off('call:ended', callback);
        }
    };

    const joinChat = (roomId, payload = {}) => {
        if (socket && connected) {
            socket.emit('chat:join', { roomId, ...payload });
        }
    };

    const leaveChat = (roomId) => {
        if (socket && connected) {
            socket.emit('chat:leave', { roomId });
        }
    };

    const sendChatMessage = (roomId, message) => {
        if (socket && connected) {
            socket.emit('chat:message', { roomId, message });
        }
    };

    const onChatMessage = (callback) => {
        if (socket) {
            socket.on('chat:message', callback);
        }
    };

    const offChatMessage = (callback) => {
        if (socket) {
            socket.off('chat:message', callback);
        }
    };

    const onChatTyping = (callback) => {
        if (socket) {
            socket.on('chat:typing', callback);
        }
    };

    const offChatTyping = (callback) => {
        if (socket) {
            socket.off('chat:typing', callback);
        }
    };
    
    // NEW: Send identity event
    const emitIdentity = (newUserId) => {
        if (socket && connected && newUserId) {
            setUserId(newUserId);
            socket.emit('identity', { userId: newUserId });
            console.log('Identity sent:', newUserId);
        }
    };
    
    // NEW: Send location update
    const emitLocation = (userId, lat, lng, accuracy, orderId) => {
        if (socket && connected) {
            socket.emit('updateLocation', {
                userId,
                lat,
                lng,
                accuracy,
                orderId
            });
            console.log('Location updated:', { lat, lng });
        }
    };
    
    // NEW: Listen for delivery assignment broadcasts
    const onDeliveryAssignment = (callback) => {
        if (socket) {
            socket.on('new-delivery-available', callback);
        }
    };
    
    const offDeliveryAssignment = (callback) => {
        if (socket) {
            socket.off('new-delivery-available', callback);
        }
    };
    
    // NEW: Listen for location updates
    const onLocationUpdate = (callback) => {
        if (socket) {
            socket.on('update-delivery-location', callback);
            socket.on('agent:location', callback); // Legacy support
        }
    };
    
    const offLocationUpdate = (callback) => {
        if (socket) {
            socket.off('update-delivery-location', callback);
            socket.off('agent:location', callback);
        }
    };
    
    // NEW: Listen for order assignment
    const onOrderAssigned = (callback) => {
        if (socket) {
            socket.on('order-assigned', callback);
        }
    };
    
    const offOrderAssigned = (callback) => {
        if (socket) {
            socket.off('order-assigned', callback);
        }
    };
    
    // NEW: Join agent room
    const joinAgentRoom = (agentId) => {
        if (socket && connected) {
            socket.emit('agent:join', agentId);
            console.log(`Joined agent room: ${agentId}`);
        }
    };
    
    const leaveAgentRoom = (agentId) => {
        if (socket && connected) {
            socket.emit('agent:leave', agentId);
            console.log(`Left agent room: ${agentId}`);
        }
    };
    
    // Listen for order accepted (remove from queue)
    const onOrderAccepted = (callback) => {
        if (socket) {
            socket.on('order-accepted', callback);
        }
    };
    
    const offOrderAccepted = (callback) => {
        if (socket) {
            socket.off('order-accepted', callback);
        }
    };

    const value = {
        socket,
        connected,
        trackOrder,
        untrackOrder,
        onOrderStatusUpdate,
        offOrderStatusUpdate,
        joinCall,
        leaveCall,
        sendCallSignal,
        onCallSignal,
        offCallSignal,
        onCallEnded,
        offCallEnded,
        joinChat,
        leaveChat,
        sendChatMessage,
        onChatMessage,
        offChatMessage,
        onChatTyping,
        offChatTyping,
        // NEW helpers
        emitIdentity,
        emitLocation,
        onDeliveryAssignment,
        offDeliveryAssignment,
        onLocationUpdate,
        offLocationUpdate,
        onOrderAssigned,
        offOrderAssigned,
        joinAgentRoom,
        leaveAgentRoom,
        onOrderAccepted,
        offOrderAccepted
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

