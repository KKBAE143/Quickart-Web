import { Router } from 'express';
import ChatRoomModel from '../models/chatRoom.model.js';
import MessageModel from '../models/message.model.js';
import OrderModel from '../models/order.model.js';
import auth from '../middleware/auth.js';

const chatRouter = Router();

/**
 * POST /api/chat/create
 * Create a chat room for an order
 */
chatRouter.post('/create', auth, async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.userId;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        // Check if order exists
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Check if chat room already exists
        let chatRoom = await ChatRoomModel.findOne({ orderId });
        
        if (chatRoom) {
            return res.json({
                success: true,
                message: 'Chat room already exists',
                data: chatRoom
            });
        }
        
        // Create new chat room
        chatRoom = new ChatRoomModel({
            orderId,
            userId: order.userId,
            deliveryAgentId: order.delivery_partner?.agentId || null,
            status: 'active'
        });
        
        await chatRoom.save();
        
        res.status(201).json({
            success: true,
            message: 'Chat room created successfully',
            data: chatRoom
        });
    } catch (error) {
        console.error('Create chat room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create chat room',
            error: error.message
        });
    }
});

/**
 * GET /api/chat/messages/:orderId
 * Get chat history for an order
 */
chatRouter.get('/messages/:orderId', auth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { limit = 50, before } = req.query;
        
        // Find chat room
        const chatRoom = await ChatRoomModel.findOne({ orderId });
        
        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }
        
        // Build query
        let query = { roomId: chatRoom._id };
        if (before) {
            query.time = { $lt: new Date(before) };
        }
        
        // Get messages
        const messages = await MessageModel.find(query)
            .sort({ time: -1 })
            .limit(parseInt(limit))
            .populate('sender', 'name avatar role');
        
        // Reverse to chronological order
        messages.reverse();
        
        res.json({
            success: true,
            data: {
                chatRoom,
                messages,
                hasMore: messages.length === parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get chat messages',
            error: error.message
        });
    }
});

/**
 * POST /api/chat/save
 * Save a chat message (called after socket emission)
 */
chatRouter.post('/save', auth, async (req, res) => {
    try {
        const { orderId, message, messageType = 'text', location, imageUrl } = req.body;
        const userId = req.userId;
        
        if (!orderId || !message) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and message are required'
            });
        }
        
        // Find or create chat room
        let chatRoom = await ChatRoomModel.findOne({ orderId });
        
        if (!chatRoom) {
            const order = await OrderModel.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            
            chatRoom = new ChatRoomModel({
                orderId,
                userId: order.userId,
                deliveryAgentId: order.delivery_partner?.agentId || null,
                status: 'active'
            });
            await chatRoom.save();
        }
        
        // Create message
        const newMessage = new MessageModel({
            roomId: chatRoom._id,
            sender: userId,
            message,
            messageType,
            location,
            imageUrl,
            time: new Date()
        });
        
        await newMessage.save();
        
        // Update chat room
        chatRoom.messages.push(newMessage._id);
        chatRoom.lastMessage = {
            text: message,
            senderId: userId,
            timestamp: newMessage.time
        };
        
        // Update unread count for the other participant
        const isCustomer = userId.toString() === chatRoom.userId.toString();
        if (isCustomer) {
            chatRoom.unreadCount.agent += 1;
        } else {
            chatRoom.unreadCount.customer += 1;
        }
        
        await chatRoom.save();
        
        // Populate sender info
        await newMessage.populate('sender', 'name avatar role');
        
        res.status(201).json({
            success: true,
            message: 'Message saved successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Save chat message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save message',
            error: error.message
        });
    }
});

/**
 * PUT /api/chat/read/:orderId
 * Mark messages as read
 */
chatRouter.put('/read/:orderId', auth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;
        
        const chatRoom = await ChatRoomModel.findOne({ orderId });
        
        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }
        
        // Mark all messages as read
        await MessageModel.updateMany(
            { 
                roomId: chatRoom._id, 
                sender: { $ne: userId },
                isRead: false 
            },
            { 
                isRead: true,
                readAt: new Date()
            }
        );
        
        // Reset unread count
        const isCustomer = userId.toString() === chatRoom.userId.toString();
        if (isCustomer) {
            chatRoom.unreadCount.customer = 0;
        } else {
            chatRoom.unreadCount.agent = 0;
        }
        
        await chatRoom.save();
        
        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark messages read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
            error: error.message
        });
    }
});

/**
 * GET /api/chat/room/:orderId
 * Get chat room details
 */
chatRouter.get('/room/:orderId', auth, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const chatRoom = await ChatRoomModel.findOne({ orderId })
            .populate('userId', 'name avatar mobile')
            .populate('deliveryAgentId', 'name avatar mobile');
        
        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }
        
        res.json({
            success: true,
            data: chatRoom
        });
    } catch (error) {
        console.error('Get chat room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get chat room',
            error: error.message
        });
    }
});

export default chatRouter;

