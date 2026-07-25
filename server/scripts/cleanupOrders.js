/**
 * Cleanup Script - Delete All Order Data
 *
 * This script deletes all order-related data from the database:
 * - Orders
 * - Delivery Assignments
 * - Wallet Transactions (order-related)
 * - Resets Rider Wallets
 *
 * Run with: node scripts/cleanupOrders.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import OrderModel from '../models/order.model.js';
import DeliveryAssignmentModel from '../models/deliveryAssignment.model.js';
import WalletTransactionModel from '../models/walletTransaction.model.js';
import RiderWalletModel from '../models/riderWallet.model.js';

async function cleanupOrders() {
    try {
        console.log('🔌 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Delete all orders
        console.log('🗑️  Deleting all orders...');
        const ordersResult = await OrderModel.deleteMany({});
        console.log(`   Deleted ${ordersResult.deletedCount} orders`);

        // Delete all delivery assignments
        console.log('🗑️  Deleting all delivery assignments...');
        const assignmentsResult = await DeliveryAssignmentModel.deleteMany({});
        console.log(`   Deleted ${assignmentsResult.deletedCount} delivery assignments`);

        // Delete all wallet transactions
        console.log('🗑️  Deleting all wallet transactions...');
        const transactionsResult = await WalletTransactionModel.deleteMany({});
        console.log(`   Deleted ${transactionsResult.deletedCount} wallet transactions`);

        // Reset all rider wallets to zero
        console.log('🔄 Resetting all rider wallets...');
        const walletsResult = await RiderWalletModel.updateMany({}, {
            $set: {
                currentBalance: 0,
                totalEarnings: 0,
                totalSettled: 0,
                todayEarnings: 0,
                todayCashCollected: 0,
                todayDeliveries: 0,
                lastSettlementDate: null,
                lastEarningsResetDate: null
            }
        });
        console.log(`   Reset ${walletsResult.modifiedCount} rider wallets`);

        console.log('\n✅ Cleanup completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Orders deleted: ${ordersResult.deletedCount}`);
        console.log(`   - Assignments deleted: ${assignmentsResult.deletedCount}`);
        console.log(`   - Transactions deleted: ${transactionsResult.deletedCount}`);
        console.log(`   - Wallets reset: ${walletsResult.modifiedCount}`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
        process.exit(0);
    }
}

// Run the cleanup
cleanupOrders();
