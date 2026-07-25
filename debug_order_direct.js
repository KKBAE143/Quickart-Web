import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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

        const order = await OrderModel.findOne({ orderId });
        
        if (!order) {
            console.log("Order NOT FOUND:", orderId);
        } else {
            console.log("Order Found:");
            console.log("ID:", order._id);
            console.log("Status:", order.order_status);
            console.log("Delivery Partner:", JSON.stringify(order.delivery_partner, null, 2));
            console.log("Created At:", order.createdAt);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkOrder();
