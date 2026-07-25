import mongoose from "mongoose";

/**
 * Delivery Assignment Schema
 *
 * Tracks order broadcasts and assignments to delivery agents
 * Industry-standard delivery assignment system
 *
 * Features:
 * - Priority-based rider scoring
 * - Broadcast timeout and escalation
 * - Direct admin assignment support
 * - Expiry mechanism for stale broadcasts
 */
const deliveryAssignmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        required: [true, "Order ID is required"],
        index: true
    },
    // Array of agent IDs who received the broadcast
    broadcastedTo: [{
        agentId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        notifiedAt: {
            type: Date,
            default: Date.now
        },
        distance: {
            type: Number, // distance in km
            default: null
        },
        score: {
            type: Number, // priority score (0-100)
            default: null
        },
        responded: {
            type: Boolean,
            default: false
        },
        responseAt: {
            type: Date,
            default: null
        },
        responseType: {
            type: String,
            enum: ['accepted', 'declined', 'timeout', null],
            default: null
        },
        declineReason: {
            type: String,
            default: null
        }
    }],
    // The agent who accepted the order
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    // Admin who directly assigned (if applicable)
    assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    // Assignment type
    assignmentType: {
        type: String,
        enum: ['broadcast', 'direct', 'auto'],
        default: 'broadcast'
    },
    // Assignment status
    status: {
        type: String,
        enum: ['pending', 'broadcasted', 'assigned', 'completed', 'cancelled', 'expired'],
        default: 'pending'
    },
    // When the agent accepted
    acceptedAt: {
        type: Date,
        default: null
    },
    // When the assignment was completed
    completedAt: {
        type: Date,
        default: null
    },
    // Broadcast radius in km
    broadcastRadius: {
        type: Number,
        default: 3
    },
    // Number of times broadcasted (escalation count)
    broadcastCount: {
        type: Number,
        default: 0
    },
    // Last broadcast timestamp
    lastBroadcastAt: {
        type: Date,
        default: null
    },
    // Broadcast expiry time
    expiresAt: {
        type: Date,
        default: null
    },
    // Cancellation details
    cancelledAt: {
        type: Date,
        default: null
    },
    cancellationReason: {
        type: String,
        default: null
    },
    // Escalation history
    escalationHistory: [{
        round: Number,
        radius: Number,
        ridersNotified: Number,
        timestamp: Date
    }]
}, {
    timestamps: true
});

// Indexes for performance
deliveryAssignmentSchema.index({ order: 1, status: 1 });
deliveryAssignmentSchema.index({ assignedTo: 1 });
deliveryAssignmentSchema.index({ status: 1, createdAt: -1 });

const DeliveryAssignmentModel = mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);

export default DeliveryAssignmentModel;

