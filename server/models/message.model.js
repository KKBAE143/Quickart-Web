import mongoose from "mongoose";

// Message Schema - For chat messages
const messageSchema = new mongoose.Schema({
    // Reference to chat room
    roomId: {
        type: mongoose.Schema.ObjectId,
        ref: 'ChatRoom',
        required: [true, "Room ID is required"],
        index: true
    },
    // Sender (User or Delivery Agent)
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "Sender ID is required"]
    },
    // Message content
    message: {
        type: String,
        required: [true, "Message content is required"],
        trim: true,
        maxlength: [1000, "Message cannot exceed 1000 characters"]
    },
    // Message type
    messageType: {
        type: String,
        enum: ['text', 'system', 'location', 'image'],
        default: 'text'
    },
    // For system messages (e.g., "Agent accepted order")
    systemMessageType: {
        type: String,
        enum: ['agent_assigned', 'order_picked', 'on_the_way', 'delivered', 'cancelled', 'other'],
        default: null
    },
    // For location sharing
    location: {
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        },
        address: {
            type: String,
            default: ""
        }
    },
    // For image messages
    imageUrl: {
        type: String,
        default: ""
    },
    // Read status
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    // Delivery status
    deliveryStatus: {
        type: String,
        enum: ['sending', 'sent', 'delivered', 'failed'],
        default: 'sent'
    },
    // Timestamp
    time: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for performance
messageSchema.index({ roomId: 1, time: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });

const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;

