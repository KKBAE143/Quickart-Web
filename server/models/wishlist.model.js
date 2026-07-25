import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true
    },
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    notified: {
        type: Boolean,
        default: false,
        // Track if price drop notification has been sent
    }
}, {
    timestamps: true
});

// Compound index to ensure user can't add same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Index for efficient queries
wishlistSchema.index({ userId: 1, addedAt: -1 });

const WishlistModel = mongoose.model('Wishlist', wishlistSchema);

export default WishlistModel;

