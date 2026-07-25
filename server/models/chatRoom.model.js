import mongoose from "mongoose";

// Chat Room Schema - For order-specific chat rooms
const chatRoomSchema = new mongoose.Schema({
    // Order reference
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        required: [true, "Order ID is required"],
        unique: true,
        index: true
    },
    // Customer
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "User ID is required"]
    },
    // Delivery Agent
    deliveryAgentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    // Messages reference (populated from Message model)
    messages: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Message'
    }],
    // Room status
    status: {
        type: String,
        enum: ['active', 'closed', 'archived'],
        default: 'active'
    },
    // Last message info for quick display
    lastMessage: {
        text: {
            type: String,
            default: ""
        },
        senderId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            default: null
        },
        timestamp: {
            type: Date,
            default: null
        }
    },
    // Unread count for each participant
    unreadCount: {
        customer: {
            type: Number,
            default: 0
        },
        agent: {
            type: Number,
            default: 0
        }
    },
    // When the chat was closed/archived
    closedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for performance
chatRoomSchema.index({ orderId: 1 });
chatRoomSchema.index({ userId: 1 });
chatRoomSchema.index({ deliveryAgentId: 1 });
chatRoomSchema.index({ status: 1, updatedAt: -1 });

const ChatRoomModel = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoomModel;

