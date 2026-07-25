import DeliveryAssignmentModel from "../models/deliveryAssignment.model.js";
import OrderModel from "../models/order.model.js";
import { escalateBroadcast } from "../services/orderAssignment.service.js";

/**
 * Broadcast Escalation Job
 *
 * Automatically escalates stale broadcasts that haven't been accepted
 * Runs every minute to check for broadcasts that need escalation
 *
 * Industry pattern: Similar to Swiggy/Zepto auto-escalation
 */

const BROADCAST_TIMEOUT_MS = 60 * 1000; // 60 seconds

/**
 * Check and escalate stale broadcasts
 * Should be called periodically (e.g., every minute)
 */
export async function checkAndEscalateBroadcasts(io) {
    try {
        const now = new Date();
        const timeoutThreshold = new Date(now.getTime() - BROADCAST_TIMEOUT_MS);

        // Find broadcasts that are stale (broadcasted but not assigned)
        const staleBroadcasts = await DeliveryAssignmentModel.find({
            status: 'broadcasted',
            lastBroadcastAt: { $lt: timeoutThreshold },
            broadcastCount: { $lt: 4 } // Max 4 escalation rounds
        }).populate('order');

        console.log(`[BroadcastEscalation] Found ${staleBroadcasts.length} stale broadcasts`);

        for (const assignment of staleBroadcasts) {
            if (!assignment.order) continue;

            // Check if order is still pending assignment
            const order = await OrderModel.findById(assignment.order._id);
            if (!order || order.delivery_partner?.agentId) {
                // Order already assigned, mark assignment as complete
                await DeliveryAssignmentModel.findByIdAndUpdate(assignment._id, {
                    status: order?.delivery_partner?.agentId ? 'assigned' : 'cancelled'
                });
                continue;
            }

            // Escalate the broadcast
            console.log(`[BroadcastEscalation] Escalating broadcast for order: ${order.orderId}`);
            const result = await escalateBroadcast(order.orderId, io);

            if (result.success) {
                console.log(`[BroadcastEscalation] Successfully escalated: ${result.message}`);
            } else if (result.requiresManualAssignment) {
                console.log(`[BroadcastEscalation] Manual assignment required for order: ${order.orderId}`);

                // Mark as expired if max escalations reached
                await DeliveryAssignmentModel.findByIdAndUpdate(assignment._id, {
                    status: 'expired'
                });

                // Notify admin
                if (io) {
                    io.to('admin-tracking').emit('broadcast-expired', {
                        orderId: order.orderId,
                        message: 'Broadcast expired. Manual assignment required.',
                        timestamp: new Date()
                    });
                }
            }
        }

    } catch (error) {
        console.error('[BroadcastEscalation] Error:', error);
    }
}

/**
 * Start the escalation job
 * Runs every minute
 */
export function startBroadcastEscalationJob(io) {
    console.log('[BroadcastEscalation] Starting broadcast escalation job...');

    // Run immediately on start
    checkAndEscalateBroadcasts(io);

    // Then run every minute
    const intervalId = setInterval(() => {
        checkAndEscalateBroadcasts(io);
    }, 60 * 1000); // 1 minute

    return intervalId;
}

/**
 * Stop the escalation job
 */
export function stopBroadcastEscalationJob(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('[BroadcastEscalation] Stopped broadcast escalation job');
    }
}

export default {
    checkAndEscalateBroadcasts,
    startBroadcastEscalationJob,
    stopBroadcastEscalationJob
};
