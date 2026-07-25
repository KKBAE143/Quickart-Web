import mongoose from "mongoose";

/**
 * Rider Wallet Model
 *
 * Tracks delivery agent's earnings, transactions, and settlements.
 * Based on quick commerce platforms (Zepto, Blinkit, Instamart) flow:
 * - Per-order earnings are added to wallet in real-time
 * - All cash is collected from store at end of day
 * - No online payment to riders - all amounts settled at store
 */
const riderWalletSchema = new mongoose.Schema({
    // Reference to the delivery agent
    rider: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    // Current wallet balance (pending earnings)
    currentBalance: {
        type: Number,
        default: 0
    },

    // Total earnings (lifetime)
    totalEarnings: {
        type: Number,
        default: 0
    },

    // Total settled/withdrawn amount (collected from store)
    totalSettled: {
        type: Number,
        default: 0
    },

    // Today's earnings (resets daily)
    todayEarnings: {
        type: Number,
        default: 0
    },

    // Today's cash collected from customers (COD orders)
    todayCashCollected: {
        type: Number,
        default: 0
    },

    // Number of deliveries today
    todayDeliveries: {
        type: Number,
        default: 0
    },

    // Last settlement date
    lastSettlementDate: {
        type: Date,
        default: null
    },

    // Last earnings reset date (for daily reset)
    lastEarningsResetDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Method to add earnings for a completed delivery
riderWalletSchema.methods.addEarnings = async function(amount, orderId) {
    this.currentBalance += amount;
    this.totalEarnings += amount;
    this.todayEarnings += amount;
    this.todayDeliveries += 1;
    return this.save();
};

// Method to record cash collected from customer
riderWalletSchema.methods.addCashCollected = async function(amount) {
    this.todayCashCollected += amount;
    return this.save();
};

// Method to settle earnings (collected from store at end of day)
riderWalletSchema.methods.settleEarnings = async function(amount) {
    if (amount > this.currentBalance) {
        throw new Error('Settlement amount cannot exceed current balance');
    }
    this.currentBalance -= amount;
    this.totalSettled += amount;
    this.lastSettlementDate = new Date();
    return this.save();
};

// Method to reset daily counters
riderWalletSchema.methods.resetDailyCounters = async function() {
    this.todayEarnings = 0;
    this.todayCashCollected = 0;
    this.todayDeliveries = 0;
    this.lastEarningsResetDate = new Date();
    return this.save();
};

// Static method to get or create wallet for a rider
riderWalletSchema.statics.getOrCreateWallet = async function(riderId) {
    let wallet = await this.findOne({ rider: riderId });
    if (!wallet) {
        wallet = await this.create({ rider: riderId });
    }
    return wallet;
};

const RiderWalletModel = mongoose.model("RiderWallet", riderWalletSchema);

export default RiderWalletModel;
