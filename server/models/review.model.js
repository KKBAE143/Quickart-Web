import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "User is required"]
    },
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
        required: [true, "Product is required"]
    },
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        required: [true, "Order is required"] // Only allow verified purchases
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: [true, "Review title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    review: {
        type: String,
        required: [true, "Review text is required"],
        trim: true,
        minlength: [10, "Review must be at least 10 characters"],
        maxlength: [1000, "Review cannot exceed 1000 characters"]
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function(v) {
                return v.length <= 5; // Maximum 5 images per review
            },
            message: "Cannot upload more than 5 images"
        }
    },
    helpful_count: {
        type: Number,
        default: 0
    },
    helpful_by: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    verified_purchase: {
        type: Boolean,
        default: true // Always true since we require orderId
    },
    admin_response: {
        text: {
            type: String,
            default: ""
        },
        responded_at: {
            type: Date
        },
        responded_by: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'APPROVED' // Auto-approve by default, can be changed to PENDING for moderation
    },
    rejection_reason: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

// Index for faster queries
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 });
reviewSchema.index({ orderId: 1 });

// Prevent duplicate reviews for the same order and product
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

const ReviewModel = mongoose.model('review', reviewSchema);

export default ReviewModel;

