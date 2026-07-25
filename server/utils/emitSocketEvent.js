import axios from 'axios';

/**
 * Utility function to emit socket events from API routes via HTTP
 * This allows API controllers to send real-time updates without direct socket access
 * 
 * @param {string} event - The socket event name to emit
 * @param {object} data - The data payload to send with the event
 * @param {string|null} socketId - Optional specific socket ID to target (null = broadcast to all)
 * @returns {Promise<boolean>} - Success status
 */
export async function emitSocketEvent(event, data, socketId = null) {
    try {
        const socketServerUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:5000';
        
        const response = await axios.post(`${socketServerUrl}/notify`, {
            event,
            data,
            socketId
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
        });
        
        if (response.data.success) {
            console.log(`Socket event '${event}' emitted successfully`);
            return true;
        } else {
            console.error(`Failed to emit socket event '${event}':`, response.data.message);
            return false;
        }
    } catch (error) {
        console.error(`Error emitting socket event '${event}':`, error.message);
        return false;
    }
}

/**
 * Emit event to specific user room
 * @param {string} userId - The user ID
 * @param {string} event - The event name
 * @param {object} data - The data payload
 */
export async function emitToUser(userId, event, data) {
    return emitSocketEvent(event, data, `user-${userId}`);
}

/**
 * Emit event to specific agent room
 * @param {string} agentId - The agent ID
 * @param {string} event - The event name
 * @param {object} data - The data payload
 */
export async function emitToAgent(agentId, event, data) {
    return emitSocketEvent(event, data, `agent-${agentId}`);
}

/**
 * Emit event to specific order room
 * @param {string} orderId - The order ID
 * @param {string} event - The event name
 * @param {object} data - The data payload
 */
export async function emitToOrder(orderId, event, data) {
    return emitSocketEvent(event, data, `order-${orderId}`);
}

/**
 * Broadcast event to all connected clients
 * @param {string} event - The event name
 * @param {object} data - The data payload
 */
export async function broadcastEvent(event, data) {
    return emitSocketEvent(event, data, null);
}

export default emitSocketEvent;

