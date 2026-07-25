import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Try to load .env from current dir or parent
dotenv.config();
dotenv.config({ path: '../.env' });

const orderId = 'ORD-CRRW8SW7K';

const simpleSchema = new mongoose.Schema({
    orderId: String,
    order_status: String,
    delivery_partner: Object,
    createdAt: Date
}, { strict: false });

const OrderModel = mongoose.model('order', simpleSchema);



async function checkOrder() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error("MONGODB_URI missing");
            process.exit(1);
        }

        console.log("Connecting to DB...");
        await mongoose.connect(uri);
        console.log("Connected.");
        
        // Find the absolute latest order
        const latestOrder = await OrderModel.findOne().sort({ createdAt: -1 });
        
        if (!latestOrder) {
            console.log("No orders found in DB.");
        } else {
            console.log("Latest Order Details:");
            console.log(`ID: ${latestOrder.orderId}`);
            console.log(`_id: ${latestOrder._id}`);
            console.log(`Status: ${latestOrder.order_status}`);
            console.log(`Delivery Partner:`, JSON.stringify(latestOrder.delivery_partner, null, 2));
            console.log(`Created At: ${latestOrder.createdAt}`);
            
            // Check why it might be filtered
            const hasAgent = !!latestOrder.delivery_partner?.agentId;
            const validStatus = ['CONFIRMED', 'PACKED'].includes(latestOrder.order_status);
            
            console.log(`--- Filter Check ---`);
            console.log(`Has AgentId?: ${hasAgent}`);
            console.log(`Status in [CONFIRMED, PACKED]?: ${validStatus}`);
            console.log(`Should show in pending?: ${!hasAgent && validStatus}`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}



checkOrder();
