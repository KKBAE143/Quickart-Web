import mongoose from "mongoose";

/**
 * Wallet Transaction Model
 *
 * Tracks individual transactions in rider's wallet
 * Types: earning, settlement, bonus, penalty, refund
 */
const walletTransactionSchema = new mongoose.Schema({
    // Reference to the wallet
    wallet: {
        type: mongoose.Schema.ObjectId,
        ref: 'RiderWallet',
        required: true,
        index: true
    },

    // Reference to the rider
    rider: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Transaction type
    type: {
        type: String,
        enum: ['earning', 'settlement', 'bonus', 'penalty', 'refund', 'cash_collected', 'adjustment'],
        required: true
    },

    // Amount (positive for credit, negative for debit)
    amount: {
        type: Number,
        required: true
    },

    // Running balance after transaction
    balanceAfter: {
        type: Number,
        required: true
    },

    // Description
    description: {
        type: String,
        required: true
    },

    // Reference order (for order-related transactions)
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        default: null
    },

    // Order ID string for display
    orderId: {
        type: String,
        default: null
    },

    // Settlement reference (for settlements)
    settlementId: {
        type: String,
        default: null
    },

    // Transaction status
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'reversed'],
        default: 'completed'
    },

    // Metadata (for additional info)
    metadata: {
        baseAmount: { type: Number, default: 0 },
        distanceBonus: { type: Number, default: 0 },
        tipAmount: { type: Number, default: 0 },
        incentive: { type: Number, default: 0 },
        distance: { type: Number, default: 0 } // in km
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
walletTransactionSchema.index({ rider: 1, createdAt: -1 });
walletTransactionSchema.index({ wallet: 1, type: 1 });
walletTransactionSchema.index({ createdAt: -1 });
walletTransactionSchema.index({ orderId: 1 });

const WalletTransactionModel = mongoose.model("WalletTransaction", walletTransactionSchema);

export default WalletTransactionModel;
