import { Router } from 'express';
import UserModel from '../models/user.model.js';
import auth from '../middleware/auth.js';

const socketRouter = Router();

/**
 * POST /api/socket/connect
 * Update user's socketId when they connect
 */
socketRouter.post('/connect', auth, async (req, res) => {
    try {
        const { socketId } = req.body;
        const userId = req.userId; // From auth middleware
        
        if (!socketId) {
            return res.status(400).json({
                success: false,
                message: 'Socket ID is required'
            });
        }
        
        // Update user's socket connection info
        await UserModel.findByIdAndUpdate(userId, {
            socketId: socketId,
            isOnline: true,
            lastSeenAt: new Date()
        });
        
        console.log(`User ${userId} connected with socket ${socketId}`);
        
        res.json({
            success: true,
            message: 'Socket connection registered',
            data: {
                userId,
                socketId,
                connectedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Socket connect error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register socket connection',
            error: error.message
        });
    }
});

/**
 * POST /api/socket/disconnect
 * Clear user's socketId when they disconnect
 */
socketRouter.post('/disconnect', auth, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Update user's socket connection info
        await UserModel.findByIdAndUpdate(userId, {
            socketId: null,
            isOnline: false,
            lastSeenAt: new Date()
        });
        
        console.log(`User ${userId} disconnected`);
        
        res.json({
            success: true,
            message: 'Socket disconnection registered',
            data: {
                userId,
                disconnectedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Socket disconnect error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register socket disconnection',
            error: error.message
        });
    }
});

/**
 * GET /api/socket/status/:userId
 * Get online status of a user
 */
socketRouter.get('/status/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await UserModel.findById(userId).select('isOnline lastSeenAt socketId');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                userId,
                isOnline: user.isOnline,
                lastSeenAt: user.lastSeenAt,
                hasActiveConnection: !!user.socketId
            }
        });
    } catch (error) {
        console.error('Socket status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get socket status',
            error: error.message
        });
    }
});

export default socketRouter;

