import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/connectDB.js'
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js'
import uploadRouter from './route/upload.router.js'
import subCategoryRouter from './route/subCategory.route.js'
import productRouter from './route/product.route.js'
import cartRouter from './route/cart.route.js'
import addressRouter from './route/address.route.js'
import orderRouter from './route/order.route.js'
import reviewRouter from './route/review.route.js'
import wishlistRouter from './route/wishlist.route.js'
import recommendationRouter from './route/recommendation.route.js'
import callRouter from './route/call.route.js'
import socketRouter from './route/socket.route.js'
import chatRouter from './route/chat.route.js'
import deliveryRouter from './route/delivery.route.js'
import redis from './config/upstash.js'
import { startBroadcastEscalationJob } from './jobs/broadcastEscalation.job.js'

const app = express()

// Create HTTP server
const httpServer = createServer(app)

// Setup Socket.io with CORS
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            // Allow localhost, ngrok, and configured frontend URL
            const allowedPatterns = [
                /^http:\/\/localhost(:\d+)?$/,
                /^https?:\/\/.*\.ngrok-free\.app$/,
                /^https?:\/\/.*\.ngrok\.io$/,
                process.env.FRONTEND_URL
            ];
            if (!origin || allowedPatterns.some(p => p instanceof RegExp ? p.test(origin) : p === origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS not allowed'));
            }
        },
        credentials: true,
        methods: ["GET", "POST"]
    }
})

// Make io accessible to controllers
app.set('io', io)

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    
    // Identity event - Map userId to socketId
    socket.on('identity', async ({ userId }) => {
        try {
            if (!userId) return;
            
            // Store userId with this socket
            socket.userId = userId;
            
            // Join user-specific room
            socket.join(`user-${userId}`);
            
            console.log(`User ${userId} identified with socket ${socket.id}`);
            
            // Optionally update in database (can be done via API endpoint)
            socket.emit('identity:confirmed', { userId, socketId: socket.id });
        } catch (error) {
            console.error('Error handling identity:', error);
        }
    });
    
    // Join order-specific room for tracking
    socket.on('track-order', (orderId) => {
        socket.join(`order-${orderId}`)
        console.log(`Client ${socket.id} tracking order: ${orderId}`)
    })
    
    // Leave order room
    socket.on('untrack-order', (orderId) => {
        socket.leave(`order-${orderId}`)
        console.log(`Client ${socket.id} stopped tracking order: ${orderId}`)
    })
    
    // Agent-specific rooms
    socket.on('agent:join', (agentId) => {
        socket.join(`agent-${agentId}`)
        console.log(`Agent ${agentId} joined room`)
    })
    
    socket.on('agent:leave', (agentId) => {
        socket.leave(`agent-${agentId}`)
        console.log(`Agent ${agentId} left room`)
    })
    
    // Real-time location update (broadcast to relevant rooms)
    socket.on('updateLocation', async ({ userId, lat, lng, accuracy, orderId }) => {
        try {
            // Broadcast location to customer tracking this order
            if (orderId) {
                io.to(`order-${orderId}`).emit('update-delivery-location', {
                    orderId,
                    location: { lat, lng },
                    updatedAt: new Date(),
                    accuracy
                })
            }
            
            // Also broadcast to agent room for admin monitoring
            if (userId) {
                io.to(`agent-${userId}`).emit('location-updated', {
                    agentId: userId,
                    location: { lat, lng },
                    updatedAt: new Date(),
                    accuracy
                })
            }
            
            console.log(`Location updated for ${userId || 'unknown'}:`, { lat, lng })
        } catch (error) {
            console.error('Error updating location:', error)
        }
    })
    
    // Agent location update (legacy support)
    socket.on('agent:location:update', async ({ agentId, lat, lng, accuracy, orderId }) => {
        try {
            // Broadcast location to customer tracking this order
            if (orderId) {
                io.to(`order-${orderId}`).emit('agent:location', {
                    orderId,
                    location: { lat, lng },
                    updatedAt: new Date(),
                    accuracy
                })
                
                // Also emit the new event name
                io.to(`order-${orderId}`).emit('update-delivery-location', {
                    orderId,
                    location: { lat, lng },
                    updatedAt: new Date(),
                    accuracy
                })
            }
            
            // Also update in database (handled by API endpoint for persistence)
            console.log(`Agent ${agentId} location updated:`, { lat, lng })
        } catch (error) {
            console.error('Error updating agent location:', error)
        }
    })
    
    // Delivery assignment broadcast to nearby agents
    socket.on('delivery-assignment', ({ agentIds, orderData }) => {
        try {
            if (!agentIds || !Array.isArray(agentIds)) return;
            
            // Broadcast to each agent
            agentIds.forEach(agentId => {
                io.to(`agent-${agentId}`).emit('new-delivery-available', {
                    order: orderData,
                    notifiedAt: new Date()
                })
            })
            
            console.log(`Delivery assignment broadcasted to ${agentIds.length} agents`)
        } catch (error) {
            console.error('Error broadcasting delivery assignment:', error)
        }
    })
    
    // Order assignment notification
    socket.on('order:assigned', ({ orderId, agentId }) => {
        io.to(`agent-${agentId}`).emit('order:new-assignment', { orderId })
        // Also emit new event name for consistency
        io.to(`agent-${agentId}`).emit('order-assigned', { orderId })
    })
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
    })

    // ============================================================================
    // ENHANCED RIDER TRACKING EVENTS
    // ============================================================================

    // Admin joins tracking room to monitor all riders
    socket.on('admin:join-tracking', () => {
        socket.join('admin-tracking')
        console.log(`Admin ${socket.id} joined tracking room`)
    })

    // Admin leaves tracking room
    socket.on('admin:leave-tracking', () => {
        socket.leave('admin-tracking')
        console.log(`Admin ${socket.id} left tracking room`)
    })

    // Rider goes online - notify admin
    socket.on('rider:online', ({ riderId, location }) => {
        io.to('admin-tracking').emit('rider-online', {
            riderId,
            location,
            timestamp: new Date()
        })
    })

    // Rider goes offline - notify admin
    socket.on('rider:offline', ({ riderId }) => {
        io.to('admin-tracking').emit('rider-offline', {
            riderId,
            timestamp: new Date()
        })
    })

    // Real-time rider location for admin dashboard
    socket.on('rider:location', ({ riderId, lat, lng, accuracy, orderId, activityType }) => {
        try {
            const locationData = {
                riderId,
                location: { lat, lng },
                accuracy,
                orderId,
                activityType,
                timestamp: new Date()
            }

            // Broadcast to admin tracking room (master map view)
            io.to('admin-tracking').emit('rider-location-update', locationData)

            // Broadcast to individual rider room (grid view - per-rider maps)
            io.to(`rider-${riderId}`).emit('rider-location-update', locationData)

            // If there's an active order, broadcast to order room
            if (orderId) {
                io.to(`order-${orderId}`).emit('update-delivery-location', {
                    orderId,
                    location: { lat, lng },
                    updatedAt: new Date(),
                    accuracy
                })

                // Also emit with order-specific event
                io.to(`order-${orderId}`).emit('order:location-update', locationData)
            }
        } catch (error) {
            console.error('Error broadcasting rider location:', error)
        }
    })

    // Customer joins order tracking room
    socket.on('customer:track-order', ({ orderId }) => {
        socket.join(`order-${orderId}`)
        console.log(`Customer tracking order: ${orderId}`)
    })

    // Customer leaves order tracking room
    socket.on('customer:untrack-order', ({ orderId }) => {
        socket.leave(`order-${orderId}`)
    })

    // ============================================================================
    // INDIVIDUAL RIDER TRACKING (For admin grid view with per-rider maps)
    // Similar to Blinkit/Zepto/Instamart fleet management
    // ============================================================================

    // Admin subscribes to track a specific rider
    socket.on('admin:track-rider', ({ riderId }) => {
        if (!riderId) return
        socket.join(`rider-${riderId}`)
        console.log(`Admin ${socket.id} subscribed to rider: ${riderId}`)
    })

    // Admin unsubscribes from a specific rider
    socket.on('admin:untrack-rider', ({ riderId }) => {
        if (!riderId) return
        socket.leave(`rider-${riderId}`)
        console.log(`Admin ${socket.id} unsubscribed from rider: ${riderId}`)
    })

    // Admin requests current location for a specific rider
    socket.on('admin:request-rider-location', ({ riderId }) => {
        if (!riderId) return
        // Emit to the rider asking for their current location
        io.to(`agent-${riderId}`).emit('location:request', { requestedBy: socket.id })
        console.log(`Location request sent to rider: ${riderId}`)
    })

    socket.on('call:join', async ({ roomId, orderId }) => {
        try {
            if (!roomId && orderId) roomId = `call-${orderId}`
            if (!roomId) return
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                const existing = await redis.get(`activeCall:${orderId || roomId}`)
                if (existing && existing.startedAt) {
                    socket.emit('call:busy', { roomId })
                    return
                }
                await redis.set(`activeCall:${orderId || roomId}`, { startedAt: Date.now() }, { ex: 15 * 60 })
            }
            socket.join(roomId)
            io.to(roomId).emit('call:user-joined', { id: socket.id })
        } catch (e) {
            console.error('call:join error', e.message)
        }
    })

    socket.on('call:leave', async ({ roomId, orderId }) => {
        try {
            socket.leave(roomId)
            io.to(roomId).emit('call:user-left', { id: socket.id })
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                await redis.del(`activeCall:${orderId || roomId}`)
            }
        } catch (e) {
            console.error('call:leave error', e.message)
        }
    })

    socket.on('call:signal', ({ roomId, type, data }) => {
        try {
            socket.to(roomId).emit('call:signal', { from: socket.id, type, data })
        } catch (e) {
            console.error('call:signal error', e.message)
        }
    })

    socket.on('call:end', async ({ roomId, orderId }) => {
        try {
            io.to(roomId).emit('call:ended', { id: socket.id })
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                await redis.del(`activeCall:${orderId || roomId}`)
            }
        } catch (e) {
            console.error('call:end error', e.message)
        }
    })

    socket.on('chat:join', ({ roomId }) => {
        try { socket.join(roomId) } catch (e) { console.error('chat:join error', e.message) }
    })
    socket.on('chat:leave', ({ roomId }) => {
        try { socket.leave(roomId) } catch (e) { console.error('chat:leave error', e.message) }
    })
    socket.on('chat:message', ({ roomId, message }) => {
        try { io.to(roomId).emit('chat:message', { id: socket.id, message, ts: Date.now() }) } catch (e) { console.error('chat:message error', e.message) }
    })
    socket.on('chat:typing', ({ roomId, isTyping }) => {
        try { socket.to(roomId).emit('chat:typing', { id: socket.id, isTyping }) } catch (e) { console.error('chat:typing error', e.message) }
    })
    socket.on('chat:seen', ({ roomId, messageId }) => {
        try { socket.to(roomId).emit('chat:seen', { id: socket.id, messageId }) } catch (e) { console.error('chat:seen error', e.message) }
    })
})

app.use(cors({
    credentials : true,
    origin : (origin, callback) => {
        // Allow localhost, ngrok, and configured frontend URL
        const allowedPatterns = [
            /^http:\/\/localhost(:\d+)?$/,
            /^https?:\/\/.*\.ngrok-free\.app$/,
            /^https?:\/\/.*\.ngrok\.io$/,
            process.env.FRONTEND_URL
        ];
        if (!origin || allowedPatterns.some(p => p instanceof RegExp ? p.test(origin) : p === origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    }
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev')) // 'dev' format for colored, concise output
app.use(helmet({
    crossOriginResourcePolicy : false
}))

const PORT = process.env.PORT || 5000 

app.get("/",(request,response)=>{
    ///server to client
    response.json({
        message : "Server is running " + PORT
    })
})

// HTTP endpoint for backend-to-socket communication
app.post('/notify', (req, res) => {
    try {
        const { socketId, event, data } = req.body;
        
        if (!event) {
            return res.status(400).json({ 
                success: false, 
                message: 'Event name is required' 
            });
        }
        
        // If socketId provided, emit to specific socket
        if (socketId) {
            io.to(socketId).emit(event, data);
            console.log(`Event '${event}' emitted to socket ${socketId}`);
        } else {
            // Broadcast to all connected clients
            io.emit(event, data);
            console.log(`Event '${event}' broadcasted to all clients`);
        }
        
        res.json({ 
            success: true, 
            message: 'Event emitted successfully' 
        });
    } catch (error) {
        console.error('Error emitting socket event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to emit event',
            error: error.message 
        });
    }
});

app.use('/api/user',userRouter)
app.use("/api/category",categoryRouter)
app.use("/api/file",uploadRouter)
app.use("/api/subcategory",subCategoryRouter)
app.use("/api/product",productRouter)
app.use("/api/cart",cartRouter)
app.use("/api/address",addressRouter)
app.use('/api/order',orderRouter)
app.use('/api/review',reviewRouter)
app.use('/api/wishlist',wishlistRouter)
app.use('/api/recommendation',recommendationRouter)
app.use('/api/call',callRouter)
app.use('/api/socket',socketRouter)
app.use('/api/chat',chatRouter)
app.use('/api/delivery',deliveryRouter)

connectDB().then(()=>{
    httpServer.listen(PORT,()=>{
        console.log("Server is running on port:", PORT)
        console.log("Socket.io enabled for real-time updates")

        // Start background jobs
        startBroadcastEscalationJob(io)
        console.log("Broadcast escalation job started")
    })
})

