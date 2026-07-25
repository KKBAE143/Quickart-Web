import OrderModel from "../models/order.model.js";
import DeliveryAssignmentModel from "../models/deliveryAssignment.model.js";
import orderAssignmentService from "../services/orderAssignment.service.js";

/**
 * Order Assignment Controller
 *
 * Admin endpoints for managing order assignments to delivery agents
 * Industry-standard implementation inspired by Swiggy, Zepto, Blinkit
 */

/**
 * Get all orders pending assignment
 */
export async function getPendingOrdersController(request, response) {
    try {
        const orders = await orderAssignmentService.getPendingOrders();

        return response.json({
            success: true,
            error: false,
            data: orders,
            total: orders.length
        });
    } catch (error) {
        console.error("Get pending orders error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get pending orders"
        });
    }
}

/**
 * Get available riders for assignment
 */
export async function getAvailableRidersController(request, response) {
    try {
        const riders = await orderAssignmentService.getAvailableRidersForAssignment();

        return response.json({
            success: true,
            error: false,
            data: riders,
            total: riders.length
        });
    } catch (error) {
        console.error("Get available riders error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get available riders"
        });
    }
}

/**
 * Direct assign order to a specific rider
 */
export async function directAssignOrderController(request, response) {
    try {
        const { orderId } = request.params;
        const { riderId } = request.body;
        const adminId = request.userId;

        if (!riderId) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Rider ID is required"
            });
        }

        // Get order by orderId string or MongoDB _id
        let order = await OrderModel.findOne({ orderId });
        if (!order) {
            order = await OrderModel.findById(orderId);
        }

        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const io = request.app.get('io');
        const result = await orderAssignmentService.directAssignOrder(
            order.orderId,
            riderId,
            adminId,
            io
        );

        if (!result.success) {
            return response.status(400).json({
                success: false,
                error: true,
                message: result.message
            });
        }

        return response.json({
            success: true,
            error: false,
            message: result.message,
            data: result
        });
    } catch (error) {
        console.error("Direct assign order error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to assign order"
        });
    }
}

/**
 * Broadcast order to nearby riders
 */
export async function broadcastOrderController(request, response) {
    try {
        const { orderId } = request.params;
        const { radiusKm } = request.body;

        // Get order by orderId string or MongoDB _id
        let order = await OrderModel.findOne({ orderId });
        if (!order) {
            order = await OrderModel.findById(orderId);
        }

        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const io = request.app.get('io');
        const result = await orderAssignmentService.autoAssignOrder(order.orderId, io);

        if (!result.success) {
            return response.status(400).json({
                success: false,
                error: true,
                message: result.message,
                requiresManualAssignment: result.requiresManualAssignment
            });
        }

        return response.json({
            success: true,
            error: false,
            message: result.message,
            data: {
                ridersNotified: result.ridersNotified
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

/**
 * Escalate broadcast to wider radius
 */
export async function escalateBroadcastController(request, response) {
    try {
        const { orderId } = request.params;

        // Get order by orderId string or MongoDB _id
        let order = await OrderModel.findOne({ orderId });
        if (!order) {
            order = await OrderModel.findById(orderId);
        }

        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const io = request.app.get('io');
        const result = await orderAssignmentService.escalateBroadcast(order.orderId, io);

        if (!result.success) {
            return response.status(400).json({
                success: false,
                error: true,
                message: result.message,
                requiresManualAssignment: result.requiresManualAssignment
            });
        }

        return response.json({
            success: true,
            error: false,
            message: result.message,
            data: {
                ridersNotified: result.ridersNotified,
                newRadius: result.newRadius
            }
        });
    } catch (error) {
        console.error("Escalate broadcast error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to escalate broadcast"
        });
    }
}

/**
 * Cancel assignment and return order to pool
 */
export async function cancelAssignmentController(request, response) {
    try {
        const { orderId } = request.params;
        const { reason } = request.body;

        if (!reason) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Cancellation reason is required"
            });
        }

        // Get order by orderId string or MongoDB _id
        let order = await OrderModel.findOne({ orderId });
        if (!order) {
            order = await OrderModel.findById(orderId);
        }

        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const io = request.app.get('io');
        const result = await orderAssignmentService.cancelAssignment(order.orderId, reason, io);

        if (!result.success) {
            return response.status(400).json({
                success: false,
                error: true,
                message: result.message
            });
        }

        return response.json({
            success: true,
            error: false,
            message: result.message
        });
    } catch (error) {
        console.error("Cancel assignment error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to cancel assignment"
        });
    }
}

/**
 * Get assignment status for an order
 */
export async function getAssignmentStatusController(request, response) {
    try {
        const { orderId } = request.params;

        // Get order by orderId string or MongoDB _id
        let order = await OrderModel.findOne({ orderId });
        if (!order) {
            order = await OrderModel.findById(orderId);
        }

        if (!order) {
            return response.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const assignment = await DeliveryAssignmentModel.findOne({ order: order._id })
            .populate('assignedTo', 'name mobile avatar')
            .populate('assignedBy', 'name')
            .populate('broadcastedTo.agentId', 'name mobile');

        return response.json({
            success: true,
            error: false,
            data: {
                order: {
                    _id: order._id,
                    orderId: order.orderId,
                    order_status: order.order_status,
                    delivery_partner: order.delivery_partner
                },
                assignment: assignment ? {
                    status: assignment.status,
                    assignedTo: assignment.assignedTo,
                    assignedBy: assignment.assignedBy,
                    assignmentType: assignment.assignmentType,
                    broadcastCount: assignment.broadcastCount,
                    broadcastRadius: assignment.broadcastRadius,
                    ridersNotified: assignment.broadcastedTo?.length || 0,
                    lastBroadcastAt: assignment.lastBroadcastAt,
                    acceptedAt: assignment.acceptedAt,
                    expiresAt: assignment.expiresAt,
                    escalationHistory: assignment.escalationHistory
                } : null
            }
        });
    } catch (error) {
        console.error("Get assignment status error:", error);
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to get assignment status"
        });
    }
}
