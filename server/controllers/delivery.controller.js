import mongoose from "mongoose";
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";
import DeliveryAssignmentModel from "../models/deliveryAssignment.model.js";
import RiderWalletModel from "../models/riderWallet.model.js";
import WalletTransactionModel from "../models/walletTransaction.model.js";
import RiderLocationHistoryModel from "../models/riderLocationHistory.model.js";
import StoreLocationModel from "../models/storeLocation.model.js";
import AddressModel from "../models/address.model.js";
import generatedOtp from "../utils/generatedOtp.js";
import smsProvider from "../services/sms/index.js";

/**
 * Delivery Controller
 *
 * Comprehensive delivery management system based on:
 * - Leading quick commerce delivery patterns
 *
 * Flow:
 * 1. Rider logs in and goes online
 * 2. System broadcasts new orders to nearby riders
 * 3. Rider accepts order (generates delivery ID)
 * 4. Rider sees store location on Google Maps
 * 5. Rider navigates to store, picks up order
 * 6. System notifies customer "Order being collected"
 * 7. Rider sees customer location on map
 * 8. Admin & customer track rider's live location
 * 9. Rider reaches customer, presses "Reached" button
 * 10. Customer gets OTP, tells rider
 * 11. Rider enters OTP to complete delivery
 * 12. Earnings added to wallet in real-time
 * 13. Cash collected from store at end of day
 */

// ============================================================================
// RIDER AUTHENTICATION & PROFILE
// ============================================================================

/**
 * Get rider dashboard data
 * Returns: current status, active order, today's stats, wallet balance
 */
export async function getRiderDashboardController(request, response) {
    try {
        const riderId = request.userId;

        // Get rider details
        const rider = await UserModel.findById(riderId).select(
            'name mobile avatar agentProfile agentStatus agentMetrics isOnline role status'
        );

        if (!rider || rider.role !== 'DELIVERY_AGENT') {
            return response.status(403).json({
                success: false,
                error: true,
                message: "Access denied. Delivery agent account required."
            });
        }

        // Check if rider account is pending approval
        const isPendingApproval = rider.status === 'Inactive';
        const isRejected = rider.status === 'Rejected';
        const isSuspended = rider.status === 'Suspended';

        // For pending/rejected/suspended riders, return limited data with status info
        if (isPendingApproval || isRejected || isSuspended) {
            return response.json({
                success: true,
                error: false,
                data: {
                    rider: {
                        _id: rider._id,
                        name: rider.name,
                        mobile: rider.mobile,
                        avatar: rider.avatar,
                        vehicle: rider.agentProfile?.vehicle,
                        documents: rider.agentProfile?.documents,
                        backgroundCheck: rider.agentProfile?.backgroundCheck?.status,
                        isOnline: false,
                        isAvailable: false
                    },
                    accountStatus: rider.status,
                    isPendingApproval,
                    isRejected,
                    isSuspended,
                    rejectionReason: rider.agentProfile?.documents?.rejectionReason || null,
                    message: isPendingApproval
                        ? "Your account is pending approval. Our team will review your documents and approve your account soon."
                        : isRejected
                        ? `Your application was rejected. Reason: ${rider.agentProfile?.documents?.rejectionReason || 'Please contact support for more details.'}`
                        : "Your account has been suspended. Please contact support.",
                    wallet: {
                        currentBalance: 0,
                        todayEarnings: 0,
                        todayCashCollected: 0,
                        todayDeliveries: 0,
                        totalEarnings: 0
                    },
                    activeOrder: null,
                    todayOrders: [],
                    availableOrders: []
                }
            });
        }

        // Get or create wallet
        const wallet = await RiderWalletModel.getOrCreateWallet(riderId);

        // Get active order if any
        let activeOrder = null;
        if (rider.agentStatus?.activeOrderId) {
            activeOrder = await OrderModel.findById(rider.agentStatus.activeOrderId)
                .populate('delivery_address')
                .populate('userId', 'name mobile');

            // If order doesn't exist or is already completed/cancelled, clear the stale reference
            if (!activeOrder || ['DELIVERED', 'CANCELLED'].includes(activeOrder?.order_status)) {
                await UserModel.findByIdAndUpdate(riderId, {
                    'agentStatus.activeOrderId': null
                });
                activeOrder = null;
            }
        }

        // Get today's completed orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await OrderModel.find({
            'delivery_partner.agentId': riderId,
            delivered_at: { $gte: today },
            order_status: 'DELIVERED'
        }).select('orderId totalAmt agent_earning delivered_at');

        // Get pending orders available for acceptance
        const pendingAssignments = await DeliveryAssignmentModel.find({
            'broadcastedTo.agentId': riderId,
            status: 'broadcasted'
        }).populate({
            path: 'order',
            populate: {
                path: 'delivery_address'
            }
        }).limit(10).sort({ createdAt: -1 });

        return response.json({
            success: true,
            error: false,
            data: {
                rider: {
                    _id: rider._id,
                    name: rider.name,
                    mobile: rider.mobile,
                    avatar: rider.avatar,
                    vehicle: rider.agentProfile?.vehicle,
                    backgroundCheck: rider.agentProfile?.backgroundCheck?.status,
                    isOnline: rider.isOnline,
                    isAvailable: rider.agentStatus?.available
                },
                agentStatus: rider.agentStatus,
                metrics: rider.agentMetrics,
                wallet: {
                    currentBalance: wallet.currentBalance,
                    todayEarnings: wallet.todayEarnings,
                    todayCashCollected: wallet.todayCashCollected,
                    todayDeliveries: wallet.todayDeliveries,
                    totalEarnings: wallet.totalEarnings
                },
                activeOrder: activeOrder,
                todayOrders: todayOrders,
                availableOrders: pendingAssignments.map(a => a.order).filter(Boolean)
            }
        });
    } catch (error) {
        console.error("Get rider dashboard error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get rider dashboard"
        });
    }
}

/**
 * Toggle rider online/offline status
 */
export async function toggleRiderOnlineStatusController(request, response) {
    try {
        const riderId = request.userId;
        const { isOnline, lat, lng } = request.body;

        const rider = await UserModel.findById(riderId);
        if (!rider || rider.role !== 'DELIVERY_AGENT') {
            return response.status(403).json({
                success: false,
                error: true,
                message: "Access denied. Delivery agent account required."
            });
        }

        // Check if rider has active order
        if (!isOnline && rider.agentStatus?.activeOrderId) {
            // Verify the order actually exists before blocking
            const activeOrder = await OrderModel.findById(rider.agentStatus.activeOrderId);
            if (activeOrder && !['DELIVERED', 'CANCELLED'].includes(activeOrder.order_status)) {
                return response.status(400).json({
                    success: false,
                    error: true,
                    message: "Cannot go offline while having an active order"
                });
            } else {
                // Order doesn't exist or is already completed/cancelled - clear the stale reference
                await UserModel.findByIdAndUpdate(riderId, {
                    'agentStatus.activeOrderId': null
                });
            }
        }

        // Update rider status
        const updateData = {
            isOnline: isOnline,
            'agentStatus.available': isOnline,
            lastSeenAt: new Date()
        };

        if (isOnline) {
            updateData['agentStatus.onlineAt'] = new Date();
            if (lat && lng) {
                updateData['agentStatus.current_location'] = {
                    lat,
                    lng,
                    updatedAt: new Date()
                };
            }
        } else {
            updateData['agentStatus.offlineAt'] = new Date();
        }

        await UserModel.findByIdAndUpdate(riderId, updateData);

        // Emit socket event for admin tracking
        const io = request.app.get('io');
        if (io) {
            io.emit('rider-status-changed', {
                riderId,
                isOnline,
                timestamp: new Date()
            });
        }

        return response.json({
            success: true,
            error: false,
            message: isOnline ? "You are now online and available for deliveries" : "You are now offline",
            data: { isOnline }
        });
    } catch (error) {
        console.error("Toggle rider status error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to update status"
        });
    }
}

// ============================================================================
// LOCATION TRACKING
// ============================================================================

/**
 * Update rider's current location
 * Called frequently from mobile app (every 10-30 seconds when active)
 */
export async function updateRiderLocationController(request, response) {
    try {
        const riderId = request.userId;
        const { lat, lng, accuracy, speed, heading, altitude, batteryLevel, activityType } = request.body;

        if (!lat || !lng) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Latitude and longitude are required"
            });
        }

        // Update rider's current location in user model
        await UserModel.findByIdAndUpdate(riderId, {
            'agentStatus.current_location': {
                lat,
                lng,
                updatedAt: new Date(),
                accuracy
            }
        });

        // Get active order
        const rider = await UserModel.findById(riderId).select('agentStatus.activeOrderId');
        const activeOrderId = rider?.agentStatus?.activeOrderId;

        // Save to location history
        const locationHistory = new RiderLocationHistoryModel({
            rider: riderId,
            order: activeOrderId,
            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            latitude: lat,
            longitude: lng,
            accuracy,
            speed,
            heading,
            altitude,
            batteryLevel,
            activityType
        });
        await locationHistory.save();

        // Emit real-time location update via Socket.io
        const io = request.app.get('io');
        if (io) {
            const locationData = {
                riderId,
                location: { lat, lng },
                accuracy,
                speed,
                heading,
                timestamp: new Date()
            };

            // Broadcast to admin room
            io.emit('rider-location-update', locationData);

            // If there's an active order, broadcast to order tracking room
            if (activeOrderId) {
                const order = await OrderModel.findById(activeOrderId).select('orderId');
                if (order) {
                    io.to(`order-${order.orderId}`).emit('update-delivery-location', {
                        orderId: order.orderId,
                        location: { lat, lng },
                        updatedAt: new Date(),
                        accuracy
                    });

                    // Update order's agent_location field
                    await OrderModel.findByIdAndUpdate(activeOrderId, {
                        agent_location: {
                            lat,
                            lng,
                            updated_at: new Date(),
                            accuracy
                        }
                    });
                }
            }
        }

        return response.json({
            success: true,
            error: false,
            message: "Location updated"
        });
    } catch (error) {
        console.error("Update rider location error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to update location"
        });
    }
}

/**
 * Get rider's location history for an order
 */
export async function getRiderLocationHistoryController(request, response) {
    try {
        const { orderId } = request.params;

        const order = await OrderModel.findOne({ orderId });
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const locationHistory = await RiderLocationHistoryModel.find({
            order: order._id
        }).sort({ createdAt: 1 }).select('latitude longitude accuracy speed createdAt activityType');

        return response.json({
            success: true,
            error: false,
            data: locationHistory
        });
    } catch (error) {
        console.error("Get location history error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get location history"
        });
    }
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

/**
 * Get available orders for rider
 * Shows orders that have been broadcasted to this rider
 */
export async function getAvailableOrdersController(request, response) {
    try {
        const riderId = request.userId;

        // Get pending assignments for this rider
        const assignments = await DeliveryAssignmentModel.find({
            'broadcastedTo.agentId': riderId,
            'broadcastedTo.responded': false,
            status: 'broadcasted'
        }).populate({
            path: 'order',
            match: { order_status: { $in: ['CONFIRMED', 'PACKED'] } },
            populate: [
                { path: 'delivery_address' },
                { path: 'userId', select: 'name' }
            ]
        }).sort({ createdAt: -1 });

        // Get store location
        const store = await StoreLocationModel.findOne({ isActive: true });

        const availableOrders = assignments
            .filter(a => a.order)
            .map(a => {
                const order = a.order;
                const broadcast = a.broadcastedTo.find(b => b.agentId.toString() === riderId);

                return {
                    _id: order._id,
                    orderId: order.orderId,
                    product_details: order.product_details,
                    totalAmt: order.totalAmt,
                    payment_method: order.payment_method,
                    cod_amount: order.cod_amount || 0,
                    delivery_address: order.delivery_address,
                    delivery_slot: order.delivery_slot,
                    delivery_date: order.delivery_date,
                    customerName: order.userId?.name,
                    distance: broadcast?.distance,
                    notifiedAt: broadcast?.notifiedAt,
                    store: store ? {
                        name: store.name,
                        latitude: store.latitude,
                        longitude: store.longitude,
                        address: store.address
                    } : null,
                    estimatedEarning: calculateEstimatedEarning(order.totalAmt, broadcast?.distance)
                };
            });

        return response.json({
            success: true,
            error: false,
            data: availableOrders
        });
    } catch (error) {
        console.error("Get available orders error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get available orders"
        });
    }
}

/**
 * Accept an order
 * Generates delivery ID and assigns order to rider
 */
export async function acceptOrderController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;

        // Check if rider is available
        const rider = await UserModel.findById(riderId);
        if (!rider || rider.role !== 'DELIVERY_AGENT') {
            return response.status(403).json({
                success: false,
                error: true,
                message: "Access denied"
            });
        }

        if (!rider.agentStatus?.available || !rider.isOnline) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "You must be online to accept orders"
            });
        }

        if (rider.agentStatus?.activeOrderId) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "You already have an active order. Complete it first."
            });
        }

        // Find the order
        const order = await OrderModel.findOne({ orderId }).populate('delivery_address');
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Check if order is already assigned
        if (order.delivery_partner?.agentId) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Order has already been assigned to another rider"
            });
        }

        // Generate delivery ID
        const deliveryId = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Get store location
        const store = await StoreLocationModel.findOne({ isActive: true });

        // Update order with delivery partner info
        const now = new Date();
        await OrderModel.findByIdAndUpdate(order._id, {
            delivery_partner: {
                agentId: riderId,
                name: rider.name,
                phone: rider.mobile,
                vehicle_number: rider.agentProfile?.vehicle?.number || '',
                assignedAt: now,
                acceptedAt: now
            },
            order_status: 'DISPATCHED',
            dispatched_at: now,
            tracking_url: `/track-order/${orderId}`
        });

        // Update rider's active order
        await UserModel.findByIdAndUpdate(riderId, {
            'agentStatus.activeOrderId': order._id,
            'agentStatus.available': false
        });

        // Update delivery assignment
        await DeliveryAssignmentModel.findOneAndUpdate(
            { order: order._id },
            {
                status: 'assigned',
                assignedTo: riderId,
                acceptedAt: now,
                $set: { 'broadcastedTo.$[elem].responded': true, 'broadcastedTo.$[elem].responseAt': now }
            },
            { arrayFilters: [{ 'elem.agentId': riderId }] }
        );

        // Emit socket events
        const io = request.app.get('io');
        if (io) {
            // Notify customer
            io.to(`order-${orderId}`).emit('order-status-updated', {
                orderId,
                order_status: 'DISPATCHED',
                delivery_partner: {
                    name: rider.name,
                    phone: rider.mobile,
                    vehicle_number: rider.agentProfile?.vehicle?.number
                },
                message: "Your order has been accepted by a delivery partner"
            });

            // Notify admin dashboard - emit to admin-tracking room
            io.to('admin-tracking').emit('order-assigned', {
                orderId,
                riderId,
                riderName: rider.name,
                assignedAt: now,
                assignmentType: 'rider_accepted'
            });
        }

        return response.json({
            success: true,
            error: false,
            message: "Order accepted successfully",
            data: {
                deliveryId,
                order: {
                    _id: order._id,
                    orderId: order.orderId,
                    product_details: order.product_details,
                    totalAmt: order.totalAmt,
                    cod_amount: order.cod_amount || 0,
                    delivery_address: order.delivery_address
                },
                store: store ? {
                    name: store.name,
                    address: store.address,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    phone: store.phone
                } : null,
                nextStep: 'GO_TO_STORE'
            }
        });
    } catch (error) {
        console.error("Accept order error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to accept order"
        });
    }
}

/**
 * Decline an order
 */
export async function declineOrderController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;
        const { reason } = request.body;

        // Mark as responded in the assignment
        await DeliveryAssignmentModel.updateOne(
            {
                'order': mongoose.Types.ObjectId(orderId),
                'broadcastedTo.agentId': riderId
            },
            {
                $set: {
                    'broadcastedTo.$.responded': true,
                    'broadcastedTo.$.responseAt': new Date()
                }
            }
        );

        return response.json({
            success: true,
            error: false,
            message: "Order declined"
        });
    } catch (error) {
        console.error("Decline order error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to decline order"
        });
    }
}

/**
 * Mark arrived at store
 * Notifies customer that order is being collected
 */
export async function arrivedAtStoreController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;

        const order = await OrderModel.findOne({ orderId }).populate('userId', 'name mobile');
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Verify rider is assigned to this order
        if (order.delivery_partner?.agentId?.toString() !== riderId) {
            return response.status(403).json({
                success: false,
                error: true,
                message: "You are not assigned to this order"
            });
        }

        // Update order status
        await OrderModel.findByIdAndUpdate(order._id, {
            order_status: 'PACKED'
        });

        // Send SMS to customer
        if (order.userId?.mobile) {
            try {
                const message = `Your Quickart order ${orderId} is being collected! Your delivery partner is at the store picking up your order.`;
                await smsProvider.sendOtp(order.userId.mobile, message);
            } catch (smsError) {
                console.error("SMS send error:", smsError);
            }
        }

        // Emit socket event
        const io = request.app.get('io');
        if (io) {
            io.to(`order-${orderId}`).emit('order-status-updated', {
                orderId,
                order_status: 'PACKED',
                message: "Your order is being collected!"
            });
            // Notify admin dashboard
            io.to('admin-tracking').emit('rider-arrived-store', {
                orderId,
                order_status: 'PACKED',
                riderName: order.delivery_partner?.name,
                message: 'Rider arrived at store'
            });
        }

        return response.json({
            success: true,
            error: false,
            message: "Arrived at store. Customer has been notified.",
            data: {
                nextStep: 'COLLECT_ORDER'
            }
        });
    } catch (error) {
        console.error("Arrived at store error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to update status"
        });
    }
}

/**
 * Mark order picked up from store
 * Shows customer location on map
 */
export async function orderPickedUpController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;

        const order = await OrderModel.findOne({ orderId })
            .populate('delivery_address')
            .populate('userId', 'name mobile');

        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Verify rider is assigned
        if (order.delivery_partner?.agentId?.toString() !== riderId) {
            return response.status(403).json({
                success: false,
                error: true,
                message: "You are not assigned to this order"
            });
        }

        // Update order status
        const now = new Date();
        await OrderModel.findByIdAndUpdate(order._id, {
            order_status: 'OUT_FOR_DELIVERY',
            out_for_delivery_at: now
        });

        // Send SMS to customer
        if (order.userId?.mobile) {
            try {
                const message = `Your Quickart order ${orderId} is out for delivery! Your delivery partner is on the way.`;
                await smsProvider.sendOtp(order.userId.mobile, message);
            } catch (smsError) {
                console.error("SMS send error:", smsError);
            }
        }

        // Emit socket event
        const io = request.app.get('io');
        if (io) {
            io.to(`order-${orderId}`).emit('order-status-updated', {
                orderId,
                order_status: 'OUT_FOR_DELIVERY',
                message: "Your order is out for delivery!"
            });
            // Notify admin dashboard
            io.to('admin-tracking').emit('order-picked-up', {
                orderId,
                order_status: 'OUT_FOR_DELIVERY',
                riderName: order.delivery_partner?.name,
                message: 'Order picked up, out for delivery'
            });
        }

        return response.json({
            success: true,
            error: false,
            message: "Order picked up. Navigate to customer location.",
            data: {
                customerLocation: {
                    latitude: order.delivery_address?.latitude,
                    longitude: order.delivery_address?.longitude,
                    address: order.delivery_address?.address_line,
                    landmark: order.delivery_address?.landmark,
                    flatNo: order.delivery_address?.flatNo,
                    floor: order.delivery_address?.floor,
                    deliveryInstructions: order.delivery_address?.deliveryInstructions
                },
                customer: {
                    name: order.userId?.name,
                    phone: order.userId?.mobile
                },
                nextStep: 'NAVIGATE_TO_CUSTOMER'
            }
        });
    } catch (error) {
        console.error("Order picked up error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to update status"
        });
    }
}

/**
 * Mark reached customer location
 * Generates OTP for customer verification
 */
export async function reachedCustomerController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;

        const order = await OrderModel.findOne({ orderId }).populate('userId', 'name mobile');
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Verify rider is assigned
        if (order.delivery_partner?.agentId?.toString() !== riderId) {
            return response.status(403).json({
                success: false,
                error: true,
                message: "You are not assigned to this order"
            });
        }

        // Generate OTP
        const otp = generatedOtp();
        const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await OrderModel.findByIdAndUpdate(order._id, {
            otp_code: String(otp),
            otp_expires_at: otpExpiry,
            otp_attempts: 0
        });

        // Send OTP to customer via SMS
        if (order.userId?.mobile) {
            try {
                const message = `Your Quickart delivery OTP is ${otp}. Share this with your delivery partner to receive your order. Valid for 30 minutes.`;
                await smsProvider.sendOtp(order.userId.mobile, message);
            } catch (smsError) {
                console.error("SMS send error:", smsError);
            }
        }

        // Emit socket event
        const io = request.app.get('io');
        if (io) {
            io.to(`order-${orderId}`).emit('rider-reached', {
                orderId,
                message: "Your delivery partner has arrived! Please share the OTP with them."
            });

            // Also send to user's personal room
            if (order.userId?._id) {
                io.to(`user-${order.userId._id}`).emit('delivery-otp-generated', {
                    orderId,
                    message: "Your delivery partner has arrived! OTP has been sent to your phone."
                });
            }

            // Notify admin dashboard
            io.to('admin-tracking').emit('rider-reached-customer', {
                orderId,
                riderName: order.delivery_partner?.name,
                message: 'Rider reached customer location'
            });
        }

        return response.json({
            success: true,
            error: false,
            message: "Location reached. OTP sent to customer.",
            data: {
                nextStep: 'VERIFY_OTP',
                otpSentTo: order.userId?.mobile ? `****${order.userId.mobile.slice(-4)}` : 'customer'
            }
        });
    } catch (error) {
        console.error("Reached customer error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to send OTP"
        });
    }
}

/**
 * Verify delivery OTP and complete order
 */
export async function verifyDeliveryOtpController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;
        const { otp, codCollected } = request.body;

        if (!otp) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "OTP is required"
            });
        }

        const order = await OrderModel.findOne({ orderId }).populate('userId', 'name mobile');
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Verify rider is assigned
        if (order.delivery_partner?.agentId?.toString() !== riderId) {
            return response.status(403).json({
                success: false,
                error: true,
                message: "You are not assigned to this order"
            });
        }

        // Check OTP expiry
        const now = new Date();
        if (!order.otp_code || !order.otp_expires_at || order.otp_expires_at < now) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Check attempts
        if (order.otp_attempts >= 5) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Too many failed attempts. Please contact support."
            });
        }

        // Verify OTP
        if (String(order.otp_code) !== String(otp)) {
            await OrderModel.findByIdAndUpdate(order._id, {
                $inc: { otp_attempts: 1 }
            });
            return response.status(400).json({
                success: false,
                error: true,
                message: "Invalid OTP. Please try again."
            });
        }

        // OTP verified - Complete delivery
        const deliveredAt = new Date();

        // Calculate earnings
        const baseAmount = 20; // Base delivery fee
        const distanceBonus = order.distance_to_customer ? Math.round(order.distance_to_customer * 5) : 0; // ₹5 per km
        const tipAmount = 0; // Can be added later
        const totalEarning = baseAmount + distanceBonus + tipAmount;

        // Update order
        await OrderModel.findByIdAndUpdate(order._id, {
            order_status: 'DELIVERED',
            delivered_at: deliveredAt,
            otp_verified_at: deliveredAt,
            otp_code: null,
            otp_expires_at: null,
            cod_collected: codCollected || false,
            cod_collected_at: codCollected ? deliveredAt : null,
            collected_by: codCollected ? riderId : null,
            agent_earning: {
                baseAmount,
                distanceBonus,
                tipAmount,
                totalEarning,
                status: 'APPROVED'
            }
        });

        // Update rider status
        await UserModel.findByIdAndUpdate(riderId, {
            'agentStatus.activeOrderId': null,
            'agentStatus.available': true,
            $inc: {
                'agentMetrics.totalDeliveries': 1,
                'agentMetrics.successfulDeliveries': 1,
                'agentMetrics.totalEarnings': totalEarning,
                'agentMetrics.pendingEarnings': totalEarning
            }
        });

        // Update wallet
        const wallet = await RiderWalletModel.getOrCreateWallet(riderId);
        await wallet.addEarnings(totalEarning, order._id);

        if (codCollected && order.cod_amount > 0) {
            await wallet.addCashCollected(order.cod_amount);
        }

        // Record transaction
        await WalletTransactionModel.create({
            wallet: wallet._id,
            rider: riderId,
            type: 'earning',
            amount: totalEarning,
            balanceAfter: wallet.currentBalance,
            description: `Delivery earning for order ${orderId}`,
            order: order._id,
            orderId: orderId,
            metadata: {
                baseAmount,
                distanceBonus,
                tipAmount,
                distance: order.distance_to_customer || 0
            }
        });

        // Update delivery assignment
        await DeliveryAssignmentModel.findOneAndUpdate(
            { order: order._id },
            { status: 'completed', completedAt: deliveredAt }
        );

        // Emit socket events
        const io = request.app.get('io');
        if (io) {
            io.to(`order-${orderId}`).emit('order-status-updated', {
                orderId,
                order_status: 'DELIVERED',
                message: "Your order has been delivered successfully!"
            });

            // Notify admin dashboard
            io.to('admin-tracking').emit('order-delivered', {
                orderId,
                riderName: order.delivery_partner?.name,
                deliveredAt,
                message: 'Order delivered successfully'
            });
        }

        // Send SMS to customer
        if (order.userId?.mobile) {
            try {
                const message = `Your Quickart order ${orderId} has been delivered! Thank you for ordering with us.`;
                await smsProvider.sendOtp(order.userId.mobile, message);
            } catch (smsError) {
                console.error("SMS send error:", smsError);
            }
        }

        return response.json({
            success: true,
            error: false,
            message: "Delivery completed successfully!",
            data: {
                earning: {
                    baseAmount,
                    distanceBonus,
                    tipAmount,
                    totalEarning
                },
                walletBalance: wallet.currentBalance,
                todayEarnings: wallet.todayEarnings,
                todayDeliveries: wallet.todayDeliveries
            }
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to verify OTP"
        });
    }
}

/**
 * Resend delivery OTP
 */
export async function resendDeliveryOtpController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;

        const order = await OrderModel.findOne({ orderId }).populate('userId', 'name mobile');
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Verify rider is assigned
        if (order.delivery_partner?.agentId?.toString() !== riderId) {
            return response.status(403).json({
                success: false,
                error: true,
                message: "You are not assigned to this order"
            });
        }

        // Generate new OTP
        const otp = generatedOtp();
        const otpExpiry = new Date(Date.now() + 30 * 60 * 1000);

        await OrderModel.findByIdAndUpdate(order._id, {
            otp_code: String(otp),
            otp_expires_at: otpExpiry,
            otp_attempts: 0
        });

        // Send OTP
        if (order.userId?.mobile) {
            try {
                const message = `Your Quickart delivery OTP is ${otp}. Share this with your delivery partner to receive your order. Valid for 30 minutes.`;
                await smsProvider.sendOtp(order.userId.mobile, message);
            } catch (smsError) {
                console.error("SMS send error:", smsError);
            }
        }

        return response.json({
            success: true,
            error: false,
            message: "OTP resent to customer"
        });
    } catch (error) {
        console.error("Resend OTP error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to resend OTP"
        });
    }
}

/**
 * Mark delivery as failed
 */
export async function markDeliveryFailedController(request, response) {
    try {
        const riderId = request.userId;
        const { orderId } = request.params;
        const { reason, notes } = request.body;

        const order = await OrderModel.findOne({ orderId });
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Verify rider is assigned
        if (order.delivery_partner?.agentId?.toString() !== riderId) {
            return response.status(403).json({
                success: false,
                error: true,
                message: "You are not assigned to this order"
            });
        }

        // Update order
        await OrderModel.findByIdAndUpdate(order._id, {
            $inc: { delivery_attempts: 1 },
            failure_reason: reason,
            failure_notes: notes || ''
        });

        // Update rider
        await UserModel.findByIdAndUpdate(riderId, {
            'agentStatus.activeOrderId': null,
            'agentStatus.available': true,
            $inc: {
                'agentMetrics.totalDeliveries': 1,
                'agentMetrics.failedDeliveries': 1
            }
        });

        // Update assignment
        await DeliveryAssignmentModel.findOneAndUpdate(
            { order: order._id },
            { status: 'cancelled' }
        );

        // Emit socket event
        const io = request.app.get('io');
        if (io) {
            io.emit('delivery-failed', {
                orderId,
                riderId,
                reason
            });
        }

        return response.json({
            success: true,
            error: false,
            message: "Delivery marked as failed"
        });
    } catch (error) {
        console.error("Mark delivery failed error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to update status"
        });
    }
}

// ============================================================================
// WALLET & EARNINGS
// ============================================================================

/**
 * Get wallet details and transaction history
 */
export async function getWalletDetailsController(request, response) {
    try {
        const riderId = request.userId;
        const { page = 1, limit = 20 } = request.query;

        const wallet = await RiderWalletModel.getOrCreateWallet(riderId);

        // Get transactions
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const transactions = await WalletTransactionModel.find({ rider: riderId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('order', 'orderId product_details');

        const totalTransactions = await WalletTransactionModel.countDocuments({ rider: riderId });

        return response.json({
            success: true,
            error: false,
            data: {
                wallet: {
                    currentBalance: wallet.currentBalance,
                    totalEarnings: wallet.totalEarnings,
                    totalSettled: wallet.totalSettled,
                    todayEarnings: wallet.todayEarnings,
                    todayCashCollected: wallet.todayCashCollected,
                    todayDeliveries: wallet.todayDeliveries,
                    lastSettlementDate: wallet.lastSettlementDate
                },
                transactions,
                pagination: {
                    total: totalTransactions,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalTransactions / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error("Get wallet error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get wallet details"
        });
    }
}

/**
 * Get earnings summary
 */
export async function getEarningsSummaryController(request, response) {
    try {
        const riderId = request.userId;
        const { period = 'week' } = request.query;

        let startDate = new Date();
        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        // Get earnings by day
        const earningsByDay = await WalletTransactionModel.aggregate([
            {
                $match: {
                    rider: new mongoose.Types.ObjectId(riderId),
                    type: 'earning',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalEarnings: { $sum: "$amount" },
                    deliveries: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get total for period
        const periodTotal = await WalletTransactionModel.aggregate([
            {
                $match: {
                    rider: new mongoose.Types.ObjectId(riderId),
                    type: 'earning',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$amount" },
                    totalDeliveries: { $sum: 1 },
                    avgEarningPerDelivery: { $avg: "$amount" }
                }
            }
        ]);

        return response.json({
            success: true,
            error: false,
            data: {
                period,
                startDate,
                summary: periodTotal[0] || { totalEarnings: 0, totalDeliveries: 0, avgEarningPerDelivery: 0 },
                dailyBreakdown: earningsByDay
            }
        });
    } catch (error) {
        console.error("Get earnings summary error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get earnings summary"
        });
    }
}

// ============================================================================
// ORDER HISTORY
// ============================================================================

/**
 * Get rider's order history
 */
export async function getRiderOrderHistoryController(request, response) {
    try {
        const riderId = request.userId;
        const { page = 1, limit = 20, status } = request.query;

        const query = { 'delivery_partner.agentId': riderId };
        if (status) {
            query.order_status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await OrderModel.find(query)
            .sort({ delivered_at: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('delivery_address')
            .select('orderId product_details totalAmt cod_amount order_status delivered_at agent_earning createdAt');

        const totalOrders = await OrderModel.countDocuments(query);

        return response.json({
            success: true,
            error: false,
            data: {
                orders,
                pagination: {
                    total: totalOrders,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalOrders / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error("Get order history error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get order history"
        });
    }
}

/**
 * Get active order details
 */
export async function getActiveOrderController(request, response) {
    try {
        const riderId = request.userId;

        const rider = await UserModel.findById(riderId).select('agentStatus.activeOrderId');
        if (!rider?.agentStatus?.activeOrderId) {
            return response.json({
                success: true,
                error: false,
                data: null
            });
        }

        const order = await OrderModel.findById(rider.agentStatus.activeOrderId)
            .populate('delivery_address')
            .populate('userId', 'name mobile');

        // If order doesn't exist or is already completed/cancelled, clear the stale reference
        if (!order || ['DELIVERED', 'CANCELLED'].includes(order?.order_status)) {
            await UserModel.findByIdAndUpdate(riderId, {
                'agentStatus.activeOrderId': null
            });
            return response.json({
                success: true,
                error: false,
                data: null
            });
        }

        const store = await StoreLocationModel.findOne({ isActive: true });

        return response.json({
            success: true,
            error: false,
            data: {
                order,
                store: store ? {
                    name: store.name,
                    address: store.address,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    phone: store.phone
                } : null
            }
        });
    } catch (error) {
        console.error("Get active order error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get active order"
        });
    }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all online riders (Admin only)
 */
export async function getAllOnlineRidersController(request, response) {
    try {
        const riders = await UserModel.find({
            role: 'DELIVERY_AGENT',
            isOnline: true
        }).select('name mobile avatar agentStatus agentMetrics agentProfile.vehicle');

        return response.json({
            success: true,
            error: false,
            data: riders.map(rider => ({
                _id: rider._id,
                name: rider.name,
                mobile: rider.mobile,
                avatar: rider.avatar,
                vehicle: rider.agentProfile?.vehicle,
                location: rider.agentStatus?.current_location,
                available: rider.agentStatus?.available,
                activeOrderId: rider.agentStatus?.activeOrderId,
                metrics: rider.agentMetrics
            }))
        });
    } catch (error) {
        console.error("Get online riders error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get online riders"
        });
    }
}

/**
 * Get ALL delivery agents (Admin only)
 * Returns all agents regardless of online status for admin management
 */
export async function getAllAgentsController(request, response) {
    try {
        const { status, search } = request.query;

        // Build query
        let query = { role: 'DELIVERY_AGENT' };

        // Filter by status if provided
        if (status && status !== 'ALL') {
            query.status = status;
        }

        // Search by name, email, or mobile
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const agents = await UserModel.find(query)
            .select('name email mobile avatar status isOnline agentProfile agentMetrics createdAt lastSeenAt')
            .sort({ createdAt: -1 });

        return response.json({
            success: true,
            error: false,
            data: agents.map(agent => ({
                _id: agent._id,
                name: agent.name,
                email: agent.email,
                mobile: agent.mobile,
                avatar: agent.avatar,
                status: agent.status,
                isOnline: agent.isOnline || false,
                agentProfile: agent.agentProfile,
                agentMetrics: agent.agentMetrics,
                createdAt: agent.createdAt,
                lastSeenAt: agent.lastSeenAt
            })),
            total: agents.length
        });
    } catch (error) {
        console.error("Get all agents error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get agents"
        });
    }
}

/**
 * Update agent status (Admin only)
 * Approve, suspend, or reactivate delivery agents
 */
export async function updateAgentStatusController(request, response) {
    try {
        const { agentId } = request.params;
        const { status, reason } = request.body;

        // Validate status
        const validStatuses = ['Active', 'Inactive', 'Suspended', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return response.status(400).json({
                success: false,
                error: true,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Find the agent
        const agent = await UserModel.findById(agentId);

        if (!agent) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Agent not found"
            });
        }

        if (agent.role !== 'DELIVERY_AGENT') {
            return response.status(400).json({
                success: false,
                error: true,
                message: "User is not a delivery agent"
            });
        }

        const previousStatus = agent.status;

        // Update agent status
        const updateData = {
            status: status
        };

        // If suspending, store the reason and set offline
        if (status === 'Suspended') {
            updateData.isOnline = false;
            if (reason) {
                updateData['agentProfile.suspensionReason'] = reason;
                updateData['agentProfile.suspendedAt'] = new Date();
            }
        }

        // If rejecting, store the reason and update document verification status
        if (status === 'Rejected') {
            updateData.isOnline = false;
            updateData['agentProfile.documents.verificationStatus'] = 'REJECTED';
            if (reason) {
                updateData['agentProfile.documents.rejectionReason'] = reason;
                updateData['agentProfile.documents.rejectedAt'] = new Date();
            }
        }

        // If approving (Active), update background check and document verification status
        if (status === 'Active' && previousStatus === 'Inactive') {
            updateData['agentProfile.backgroundCheck.status'] = 'VERIFIED';
            updateData['agentProfile.backgroundCheck.verifiedAt'] = new Date();
            updateData['agentProfile.documents.verificationStatus'] = 'VERIFIED';
            updateData['agentProfile.documents.verifiedAt'] = new Date();
            updateData['agentProfile.approvedAt'] = new Date();
        }

        const updatedAgent = await UserModel.findByIdAndUpdate(
            agentId,
            updateData,
            { new: true }
        ).select('name email mobile status agentProfile');

        // Log status change action
        console.log(`Agent status updated: ${agent.name} (${agentId}) - ${previousStatus} -> ${status}`);

        const statusMessages = {
            'Active': 'approved',
            'Suspended': 'suspended',
            'Rejected': 'rejected',
            'Inactive': 'set to inactive'
        };

        return response.json({
            success: true,
            error: false,
            message: `Agent ${statusMessages[status] || 'updated'} successfully`,
            data: {
                _id: updatedAgent._id,
                name: updatedAgent.name,
                email: updatedAgent.email,
                mobile: updatedAgent.mobile,
                status: updatedAgent.status,
                previousStatus: previousStatus
            }
        });
    } catch (error) {
        console.error("Update agent status error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to update agent status"
        });
    }
}

/**
 * Get rider details (Admin only)
 */
export async function getRiderDetailsAdminController(request, response) {
    try {
        const { riderId } = request.params;

        const rider = await UserModel.findById(riderId).select(
            'name email mobile avatar agentProfile agentStatus agentMetrics isOnline lastSeenAt createdAt'
        );

        if (!rider) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Rider not found"
            });
        }

        const wallet = await RiderWalletModel.findOne({ rider: riderId });

        // Recent orders
        const recentOrders = await OrderModel.find({
            'delivery_partner.agentId': riderId
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('orderId order_status delivered_at agent_earning createdAt');

        return response.json({
            success: true,
            error: false,
            data: {
                rider,
                wallet,
                recentOrders
            }
        });
    } catch (error) {
        console.error("Get rider details error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get rider details"
        });
    }
}

/**
 * Broadcast order to nearby riders
 */
export async function broadcastOrderToRidersController(request, response) {
    try {
        const { orderId } = request.params;
        const { radiusKm = 5 } = request.body;

        const order = await OrderModel.findOne({ orderId }).populate('delivery_address');
        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        if (order.delivery_partner?.agentId) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Order already has a delivery partner"
            });
        }

        const store = await StoreLocationModel.findOne({ isActive: true });
        if (!store) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "No active store found"
            });
        }

        // Find nearby available riders
        const nearbyRiders = await UserModel.find({
            role: 'DELIVERY_AGENT',
            isOnline: true,
            'agentStatus.available': true,
            'agentProfile.backgroundCheck.status': 'APPROVED',
            'agentStatus.current_location.lat': { $exists: true, $ne: null }
        });

        // Calculate distance for each rider
        const ridersWithDistance = nearbyRiders.map(rider => {
            const riderLat = rider.agentStatus.current_location.lat;
            const riderLng = rider.agentStatus.current_location.lng;
            const distance = calculateDistance(
                store.latitude, store.longitude,
                riderLat, riderLng
            );
            return { rider, distance };
        }).filter(r => r.distance <= radiusKm).sort((a, b) => a.distance - b.distance);

        if (ridersWithDistance.length === 0) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "No available riders found within range"
            });
        }

        // Create or update delivery assignment
        const broadcastedTo = ridersWithDistance.map(r => ({
            agentId: r.rider._id,
            notifiedAt: new Date(),
            distance: r.distance
        }));

        let assignment = await DeliveryAssignmentModel.findOne({ order: order._id });
        if (assignment) {
            assignment.broadcastedTo = broadcastedTo;
            assignment.broadcastCount += 1;
            assignment.lastBroadcastAt = new Date();
            assignment.broadcastRadius = radiusKm;
            await assignment.save();
        } else {
            assignment = await DeliveryAssignmentModel.create({
                order: order._id,
                broadcastedTo,
                broadcastRadius: radiusKm
            });
        }

        // Emit socket events to riders
        const io = request.app.get('io');
        if (io) {
            ridersWithDistance.forEach(r => {
                io.to(`agent-${r.rider._id}`).emit('new-delivery-available', {
                    order: {
                        _id: order._id,
                        orderId: order.orderId,
                        product_details: order.product_details,
                        totalAmt: order.totalAmt,
                        cod_amount: order.cod_amount,
                        delivery_address: order.delivery_address,
                        delivery_slot: order.delivery_slot
                    },
                    store: {
                        name: store.name,
                        latitude: store.latitude,
                        longitude: store.longitude
                    },
                    distance: r.distance,
                    estimatedEarning: calculateEstimatedEarning(order.totalAmt, r.distance)
                });
            });
        }

        return response.json({
            success: true,
            error: false,
            message: `Order broadcasted to ${ridersWithDistance.length} riders`,
            data: {
                ridersNotified: ridersWithDistance.length,
                riders: ridersWithDistance.map(r => ({
                    riderId: r.rider._id,
                    name: r.rider.name,
                    distance: r.distance
                }))
            }
        });
    } catch (error) {
        console.error("Broadcast order error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to broadcast order"
        });
    }
}

// ============================================================================
// STORE MANAGEMENT
// ============================================================================

/**
 * Create/Update store location
 */
export async function upsertStoreLocationController(request, response) {
    try {
        const { storeCode, name, address, latitude, longitude, phone, managerName, operatingHours, deliveryRadius, googlePlaceId } = request.body;

        if (!storeCode || !name || !latitude || !longitude) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Store code, name, latitude and longitude are required"
            });
        }

        const storeData = {
            name,
            storeCode,
            address: address || {},
            latitude,
            longitude,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            phone: phone || '',
            managerName: managerName || '',
            operatingHours: operatingHours || { open: '06:00', close: '23:00' },
            deliveryRadius: deliveryRadius || 5,
            googlePlaceId: googlePlaceId || null
        };

        const store = await StoreLocationModel.findOneAndUpdate(
            { storeCode },
            storeData,
            { upsert: true, new: true }
        );

        return response.json({
            success: true,
            error: false,
            message: "Store location saved successfully",
            data: store
        });
    } catch (error) {
        console.error("Upsert store error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to save store location"
        });
    }
}

/**
 * Get all stores
 */
export async function getStoresController(request, response) {
    try {
        const stores = await StoreLocationModel.find().sort({ name: 1 });
        return response.json({
            success: true,
            error: false,
            data: stores
        });
    } catch (error) {
        console.error("Get stores error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get stores"
        });
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate estimated earning for a delivery
 */
function calculateEstimatedEarning(orderAmount, distance) {
    const baseAmount = 20; // Base delivery fee
    const distanceBonus = distance ? Math.round(distance * 5) : 0; // ₹5 per km
    return baseAmount + distanceBonus;
}

/**
 * Get nearby agents for an order (helper for order controller)
 */
export async function getNearbyAgents(location, radiusKm = 5) {
    if (!location?.lat || !location?.lng) return [];

    const riders = await UserModel.find({
        role: 'DELIVERY_AGENT',
        isOnline: true,
        'agentStatus.available': true,
        'agentProfile.backgroundCheck.status': 'APPROVED'
    });

    return riders.filter(rider => {
        if (!rider.agentStatus?.current_location?.lat) return false;
        const distance = calculateDistance(
            location.lat, location.lng,
            rider.agentStatus.current_location.lat,
            rider.agentStatus.current_location.lng
        );
        return distance <= radiusKm;
    });
}
