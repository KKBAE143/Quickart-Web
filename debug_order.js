import mongoose from 'mongoose';
import OrderModel from './server/models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

const orderId = 'ORD-CRRW8SW7K';

async function checkOrder() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI not found in env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const order = await OrderModel.findOne({ orderId });
        
        if (!order) {
            console.log("Order NOT FOUND:", orderId);
        } else {
            console.log("Order Found:");
            console.log("ID:", order._id);
            console.log("Status:", order.order_status);
            console.log("Delivery Partner:", order.delivery_partner);
            console.log("Created At:", order.createdAt);
            console.log("Agent ID exists?", !!order.delivery_partner?.agentId);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
    }
}

checkOrder();
