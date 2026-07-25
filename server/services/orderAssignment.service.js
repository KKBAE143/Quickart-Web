import mongoose from "mongoose";
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";
import DeliveryAssignmentModel from "../models/deliveryAssignment.model.js";
import StoreLocationModel from "../models/storeLocation.model.js";

/**
 * Order Assignment Service
 *
 * Industry-standard order assignment system inspired by:
 * - Swiggy: Proximity-based assignment with acceptance timeout
 * - Zepto: Instant assignment with priority scoring
 * - Blinkit: Zone-based rider allocation
 * - Dunzo: Multi-factor rider scoring
 *
 * Features:
 * 1. Automatic broadcast on order confirmation
 * 2. Priority-based rider scoring (distance, rating, acceptance rate, load)
 * 3. Broadcast timeout and auto-escalation
 * 4. Direct admin assignment capability
 * 5. Real-time notifications via Socket.io
 * 6. Fallback mechanisms when no riders available
 */

// Configuration
const CONFIG = {
    INITIAL_BROADCAST_RADIUS_KM: 3,      // Start with 3km radius
    MAX_BROADCAST_RADIUS_KM: 10,         // Expand up to 10km
    RADIUS_INCREMENT_KM: 2,              // Increase by 2km each round
    BROADCAST_TIMEOUT_SECONDS: 60,       // Wait 60 seconds per round
    MAX_BROADCAST_ROUNDS: 4,             // Maximum escalation rounds
    MAX_RIDERS_PER_BROADCAST: 10,        // Limit riders per broadcast
    MIN_ACCEPTANCE_RATE: 0.3,            // Minimum 30% acceptance rate
    BROADCAST_EXPIRY_MINUTES: 15         // Broadcasts expire after 15 minutes
};

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
    return Math.round(R * c * 100) / 100;
}

/**
 * Calculate rider priority score (0-100)
 * Higher score = higher priority for assignment
 *
 * Factors:
 * - Distance from store (40% weight) - closer is better
 * - Average rating (25% weight) - higher is better
 * - Acceptance rate (20% weight) - higher is better
 * - Current load (15% weight) - no active order is better
 */
function calculateRiderScore(rider, storeLocation) {
    let score = 0;

    // Distance score (40 points max) - inverse relationship
    const distance = calculateDistance(
        storeLocation.latitude,
        storeLocation.longitude,
        rider.agentStatus?.current_location?.lat || 0,
        rider.agentStatus?.current_location?.lng || 0
    );
    const distanceScore = Math.max(0, 40 - (distance * 4)); // Lose 4 points per km
    score += distanceScore;

    // Rating score (25 points max)
    const rating = rider.agentMetrics?.averageRating || 3;
    const ratingScore = (rating / 5) * 25;
    score += ratingScore;

    // Acceptance rate score (20 points max)
    const totalDeliveries = rider.agentMetrics?.totalDeliveries || 0;
    const successfulDeliveries = rider.agentMetrics?.successfulDeliveries || 0;
    const acceptanceRate = totalDeliveries > 0 ? successfulDeliveries / totalDeliveries : 0.5;
    const acceptanceScore = acceptanceRate * 20;
    score += acceptanceScore;

    // Availability score (15 points max)
    const hasActiveOrder = rider.agentStatus?.activeOrderId ? 0 : 15;
    score += hasActiveOrder;

    return {
        score: Math.round(score * 100) / 100,
        distance,
        rating,
        acceptanceRate,
        isAvailable: !rider.agentStatus?.activeOrderId
    };
}

/**
 * Get eligible riders for an order
 *
 * Eligibility criteria:
 * - Role = DELIVERY_AGENT
 * - Status = Active
 * - isOnline = true
 * - agentStatus.available = true
 * - No active order (or consider for queue)
 * - Has valid location
 * - Background check VERIFIED or APPROVED
 */
async function getEligibleRiders(radiusKm, storeLocation) {
    const riders = await UserModel.find({
        role: 'DELIVERY_AGENT',
        status: 'Active',
        isOnline: true,
        'agentStatus.available': true,
        'agentStatus.current_location.lat': { $exists: true, $ne: null },
        $or: [
            { 'agentProfile.backgroundCheck.status': 'VERIFIED' },
            { 'agentProfile.backgroundCheck.status': 'APPROVED' }
        ]
    }).select('name mobile avatar agentStatus agentMetrics agentProfile.vehicle');

    // Filter by distance and score
    const scoredRiders = riders
        .map(rider => {
            const scoreData = calculateRiderScore(rider, storeLocation);
            return {
                rider,
                ...scoreData
            };
        })
        .filter(r => r.distance <= radiusKm && r.isAvailable)
        .sort((a, b) => b.score - a.score) // Highest score first
        .slice(0, CONFIG.MAX_RIDERS_PER_BROADCAST);

    return scoredRiders;
}

/**
 * Broadcast order to eligible riders
 * Returns the assignment document
 */
async function broadcastToRiders(order, scoredRiders, radiusKm, io, broadcastRound = 1) {
    if (scoredRiders.length === 0) {
        return null;
    }

    const broadcastedTo = scoredRiders.map(r => ({
        agentId: r.rider._id,
        notifiedAt: new Date(),
        distance: r.distance,
        score: r.score,
        responded: false,
        responseAt: null
    }));

    // Create or update assignment
    let assignment = await DeliveryAssignmentModel.findOne({ order: order._id });

    if (assignment) {
        // Add new riders to existing broadcast
        const existingAgentIds = assignment.broadcastedTo.map(b => b.agentId.toString());
        const newBroadcasts = broadcastedTo.filter(
            b => !existingAgentIds.includes(b.agentId.toString())
        );

        assignment.broadcastedTo.push(...newBroadcasts);
        assignment.broadcastCount += 1;
        assignment.broadcastRadius = radiusKm;
        assignment.lastBroadcastAt = new Date();
        assignment.expiresAt = new Date(Date.now() + CONFIG.BROADCAST_EXPIRY_MINUTES * 60 * 1000);
        assignment.status = 'broadcasted'; // Ensure status is set to broadcasted
        await assignment.save();
    } else {
        assignment = await DeliveryAssignmentModel.create({
            order: order._id,
            broadcastedTo,
            broadcastRadius: radiusKm,
            broadcastCount: 1,
            lastBroadcastAt: new Date(),
            expiresAt: new Date(Date.now() + CONFIG.BROADCAST_EXPIRY_MINUTES * 60 * 1000),
            status: 'broadcasted' // Set status to broadcasted on creation
        });
    }

    // Get store for socket notification
    const store = await StoreLocationModel.findOne({ isActive: true });

    // Notify each rider via Socket.io
    if (io) {
        const orderData = {
            _id: order._id,
            orderId: order.orderId,
            product_details: order.product_details,
            totalAmt: order.totalAmt,
            cod_amount: order.cod_amount || 0,
            payment_method: order.payment_method,
            delivery_address: order.delivery_address,
            delivery_slot: order.delivery_slot,
            delivery_date: order.delivery_date
        };

        scoredRiders.forEach(r => {
            io.to(`agent-${r.rider._id}`).emit('new-delivery-available', {
                order: orderData,
                store: store ? {
                    name: store.name,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    address: store.address
                } : null,
                distance: r.distance,
                score: r.score,
                estimatedEarning: calculateEstimatedEarning(order.totalAmt, r.distance),
                expiresIn: CONFIG.BROADCAST_TIMEOUT_SECONDS,
                broadcastRound,
                notifiedAt: new Date()
            });
        });

        // Notify admin dashboard
        io.to('admin-tracking').emit('order-broadcasted', {
            orderId: order.orderId,
            ridersNotified: scoredRiders.length,
            radiusKm,
            broadcastRound,
            timestamp: new Date()
        });
    }

    return assignment;
}

/**
 * Calculate estimated earning for a delivery
 */
function calculateEstimatedEarning(orderAmount, distance) {
    const baseAmount = 20;
    const distanceBonus = distance ? Math.round(distance * 5) : 0;
    return baseAmount + distanceBonus;
}

/**
 * Main function: Auto-assign order after confirmation
 * Called when order status changes to CONFIRMED
 */
export async function autoAssignOrder(orderId, io) {
    try {
        console.log(`[OrderAssignment] Starting auto-assignment for order: ${orderId}`);

        // Get the order with delivery address
        const order = await OrderModel.findOne({ orderId })
            .populate('delivery_address')
            .populate('userId', 'name mobile');

        if (!order) {
            console.error(`[OrderAssignment] Order not found: ${orderId}`);
            return { success: false, message: 'Order not found' };
        }

        // Check if already assigned
        if (order.delivery_partner?.agentId) {
            console.log(`[OrderAssignment] Order already assigned: ${orderId}`);
            return { success: false, message: 'Order already assigned' };
        }

        // Get store location
        const store = await StoreLocationModel.findOne({ isActive: true });
        if (!store) {
            console.error(`[OrderAssignment] No active store found for order: ${orderId}`);
            // Create a default store if none exists (for testing)
            await StoreLocationModel.create({
                name: 'Quickart Main Store',
                storeCode: 'MAIN-001',
                address: {
                    addressLine: 'Main Store Location',
                    city: 'City',
                    state: 'State',
                    pincode: '000000'
                },
                latitude: order.delivery_address?.latitude || 0,
                longitude: order.delivery_address?.longitude || 0,
                location: {
                    type: 'Point',
                    coordinates: [order.delivery_address?.longitude || 0, order.delivery_address?.latitude || 0]
                },
                isActive: true
            });
            console.log(`[OrderAssignment] Created default store for order: ${orderId}`);
        }

        const storeLocation = store || await StoreLocationModel.findOne({ isActive: true });

        // Get eligible riders within initial radius
        let scoredRiders = await getEligibleRiders(CONFIG.INITIAL_BROADCAST_RADIUS_KM, storeLocation);

        if (scoredRiders.length === 0) {
            // Try larger radius
            scoredRiders = await getEligibleRiders(CONFIG.MAX_BROADCAST_RADIUS_KM, storeLocation);
        }

        if (scoredRiders.length === 0) {
            console.log(`[OrderAssignment] No eligible riders found for order: ${orderId}`);

            // Notify admin that no riders are available
            if (io) {
                io.to('admin-tracking').emit('no-riders-available', {
                    orderId: order.orderId,
                    message: 'No online riders available for this order',
                    timestamp: new Date()
                });
            }

            return {
                success: false,
                message: 'No riders available',
                requiresManualAssignment: true
            };
        }

        // Broadcast to riders
        const assignment = await broadcastToRiders(
            order,
            scoredRiders,
            CONFIG.INITIAL_BROADCAST_RADIUS_KM,
            io,
            1
        );

        console.log(`[OrderAssignment] Broadcasted to ${scoredRiders.length} riders for order: ${orderId}`);

        return {
            success: true,
            message: `Order broadcasted to ${scoredRiders.length} riders`,
            ridersNotified: scoredRiders.length,
            assignment
        };

    } catch (error) {
        console.error(`[OrderAssignment] Error auto-assigning order ${orderId}:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * Escalate broadcast - expand radius and retry
 * Called when no rider accepts within timeout
 */
export async function escalateBroadcast(orderId, io) {
    try {
        console.log(`[OrderAssignment] Escalating broadcast for order: ${orderId}`);

        const order = await OrderModel.findOne({ orderId })
            .populate('delivery_address');

        if (!order || order.delivery_partner?.agentId) {
            return { success: false, message: 'Order not found or already assigned' };
        }

        const assignment = await DeliveryAssignmentModel.findOne({ order: order._id });
        if (!assignment) {
            return { success: false, message: 'No existing broadcast found' };
        }

        if (assignment.broadcastCount >= CONFIG.MAX_BROADCAST_ROUNDS) {
            // Notify admin for manual intervention
            if (io) {
                io.to('admin-tracking').emit('assignment-failed', {
                    orderId: order.orderId,
                    message: 'Maximum broadcast attempts reached. Manual assignment required.',
                    broadcastCount: assignment.broadcastCount,
                    timestamp: new Date()
                });
            }

            return {
                success: false,
                message: 'Max escalation reached',
                requiresManualAssignment: true
            };
        }

        // Calculate new radius
        const newRadius = Math.min(
            assignment.broadcastRadius + CONFIG.RADIUS_INCREMENT_KM,
            CONFIG.MAX_BROADCAST_RADIUS_KM
        );

        const store = await StoreLocationModel.findOne({ isActive: true });
        const scoredRiders = await getEligibleRiders(newRadius, store);

        // Filter out riders who already declined
        const declinedAgentIds = assignment.broadcastedTo
            .filter(b => b.responded)
            .map(b => b.agentId.toString());

        const newRiders = scoredRiders.filter(
            r => !declinedAgentIds.includes(r.rider._id.toString())
        );

        if (newRiders.length > 0) {
            await broadcastToRiders(
                order,
                newRiders,
                newRadius,
                io,
                assignment.broadcastCount + 1
            );

            return {
                success: true,
                message: `Escalated to ${newRiders.length} riders at ${newRadius}km radius`,
                ridersNotified: newRiders.length,
                newRadius
            };
        }

        return { success: false, message: 'No new riders found at expanded radius' };

    } catch (error) {
        console.error(`[OrderAssignment] Error escalating broadcast:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * Direct assignment by admin
 * Bypasses broadcast and assigns directly to a specific rider
 */
export async function directAssignOrder(orderId, riderId, adminId, io) {
    try {
        console.log(`[OrderAssignment] Direct assignment: Order ${orderId} to Rider ${riderId}`);

        // Get order
        const order = await OrderModel.findOne({ orderId })
            .populate('delivery_address')
            .populate('userId', 'name mobile');

        if (!order) {
            return { success: false, message: 'Order not found' };
        }

        if (order.delivery_partner?.agentId) {
            return { success: false, message: 'Order already assigned to another rider' };
        }

        // Get rider
        const rider = await UserModel.findById(riderId);
        if (!rider) {
            return { success: false, message: 'Rider not found' };
        }

        if (rider.role !== 'DELIVERY_AGENT') {
            return { success: false, message: 'User is not a delivery agent' };
        }

        if (rider.agentStatus?.activeOrderId) {
            return { success: false, message: 'Rider already has an active order' };
        }

        // Generate delivery ID
        const deliveryId = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        const now = new Date();

        // Update order with delivery partner
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

        // Update rider status
        await UserModel.findByIdAndUpdate(riderId, {
            'agentStatus.activeOrderId': order._id,
            'agentStatus.available': false
        });

        // Update or create assignment record
        await DeliveryAssignmentModel.findOneAndUpdate(
            { order: order._id },
            {
                status: 'assigned',
                assignedTo: riderId,
                acceptedAt: now,
                assignedBy: adminId,
                assignmentType: 'direct'
            },
            { upsert: true }
        );

        // Get store location
        const store = await StoreLocationModel.findOne({ isActive: true });

        // Notify rider via Socket.io
        if (io) {
            io.to(`agent-${riderId}`).emit('order-assigned', {
                orderId: order.orderId,
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
                assignedAt: now,
                message: 'You have been assigned a new order by admin'
            });

            // Notify customer
            io.to(`order-${order.orderId}`).emit('order-status-updated', {
                orderId: order.orderId,
                order_status: 'DISPATCHED',
                delivery_partner: {
                    name: rider.name,
                    phone: rider.mobile,
                    vehicle_number: rider.agentProfile?.vehicle?.number
                },
                message: 'Your order has been assigned to a delivery partner'
            });

            // Notify admin dashboard
            io.to('admin-tracking').emit('order-assigned', {
                orderId: order.orderId,
                riderId,
                riderName: rider.name,
                assignedBy: adminId,
                assignmentType: 'direct',
                timestamp: now
            });
        }

        console.log(`[OrderAssignment] Direct assignment successful: Order ${orderId} to Rider ${rider.name}`);

        return {
            success: true,
            message: `Order assigned to ${rider.name}`,
            deliveryId,
            rider: {
                _id: rider._id,
                name: rider.name,
                mobile: rider.mobile,
                vehicle: rider.agentProfile?.vehicle
            }
        };

    } catch (error) {
        console.error(`[OrderAssignment] Error in direct assignment:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * Get pending orders requiring assignment
 */
export async function getPendingOrders() {
    try {
        // Find orders that are CONFIRMED or PACKED and don't have a rider assigned
        // Check for: no delivery_partner, no agentId, or agentId is null
        const orders = await OrderModel.find({
            order_status: { $in: ['CONFIRMED', 'PACKED'] },
            $or: [
                { 'delivery_partner': { $exists: false } },
                { 'delivery_partner': null },
                { 'delivery_partner.agentId': { $exists: false } },
                { 'delivery_partner.agentId': null }
            ]
        })
            .populate('delivery_address')
            .populate('userId', 'name mobile')
            .sort({ createdAt: -1 }); // Newest first

        // Get assignment status for each order
        const ordersWithStatus = await Promise.all(orders.map(async (order) => {
            const assignment = await DeliveryAssignmentModel.findOne({ order: order._id });

            // Determine if order has been actively broadcasted
            // Only mark as broadcasted if status is 'broadcasted' AND has notified riders
            const isBroadcasted = assignment &&
                assignment.status === 'broadcasted' &&
                assignment.broadcastedTo?.length > 0;

            return {
                ...order.toObject(),
                assignmentStatus: {
                    isBroadcasted: isBroadcasted,
                    status: assignment?.status || 'none',
                    broadcastCount: assignment?.broadcastCount || 0,
                    ridersNotified: assignment?.broadcastedTo?.length || 0,
                    lastBroadcastAt: assignment?.lastBroadcastAt,
                    broadcastRadius: assignment?.broadcastRadius
                }
            };
        }));

        return ordersWithStatus;

    } catch (error) {
        console.error('[OrderAssignment] Error getting pending orders:', error);
        throw error;
    }
}

/**
 * Get available riders for assignment
 */
export async function getAvailableRidersForAssignment() {
    try {
        const store = await StoreLocationModel.findOne({ isActive: true });

        const riders = await UserModel.find({
            role: 'DELIVERY_AGENT',
            status: 'Active',
            isOnline: true,
            'agentStatus.available': true
        }).select('name mobile avatar agentStatus agentMetrics agentProfile.vehicle isOnline');

        // Score and sort riders
        const scoredRiders = riders.map(rider => {
            const scoreData = store
                ? calculateRiderScore(rider, store)
                : { score: 50, distance: null, rating: rider.agentMetrics?.averageRating || 0, acceptanceRate: 0, isAvailable: true };

            return {
                _id: rider._id,
                name: rider.name,
                mobile: rider.mobile,
                avatar: rider.avatar,
                isOnline: rider.isOnline,
                vehicle: rider.agentProfile?.vehicle,
                location: rider.agentStatus?.current_location,
                hasActiveOrder: !!rider.agentStatus?.activeOrderId,
                metrics: rider.agentMetrics,
                score: scoreData.score,
                distance: scoreData.distance
            };
        }).sort((a, b) => b.score - a.score);

        return scoredRiders;

    } catch (error) {
        console.error('[OrderAssignment] Error getting available riders:', error);
        throw error;
    }
}

/**
 * Cancel assignment and return order to pool
 */
export async function cancelAssignment(orderId, reason, io) {
    try {
        const order = await OrderModel.findOne({ orderId });
        if (!order) {
            return { success: false, message: 'Order not found' };
        }

        const riderId = order.delivery_partner?.agentId;

        // Reset order
        await OrderModel.findByIdAndUpdate(order._id, {
            $unset: { delivery_partner: 1 },
            order_status: 'CONFIRMED'
        });

        // Free up rider
        if (riderId) {
            await UserModel.findByIdAndUpdate(riderId, {
                'agentStatus.activeOrderId': null,
                'agentStatus.available': true
            });
        }

        // Update assignment
        await DeliveryAssignmentModel.findOneAndUpdate(
            { order: order._id },
            {
                status: 'cancelled',
                cancellationReason: reason,
                cancelledAt: new Date()
            }
        );

        // Notify via socket
        if (io) {
            if (riderId) {
                io.to(`agent-${riderId}`).emit('assignment-cancelled', {
                    orderId: order.orderId,
                    reason,
                    timestamp: new Date()
                });
            }

            io.to('admin-tracking').emit('assignment-cancelled', {
                orderId: order.orderId,
                reason,
                timestamp: new Date()
            });
        }

        return { success: true, message: 'Assignment cancelled successfully' };

    } catch (error) {
        console.error('[OrderAssignment] Error cancelling assignment:', error);
        return { success: false, message: error.message };
    }
}

export default {
    autoAssignOrder,
    escalateBroadcast,
    directAssignOrder,
    getPendingOrders,
    getAvailableRidersForAssignment,
    cancelAssignment,
    CONFIG
};
