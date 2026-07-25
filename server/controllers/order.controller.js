import Stripe from "../config/stripe.js";
import razorpayInstance from "../config/razorpay.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js";
import mongoose from "mongoose";
import EmailService from "../services/emailService.js";
import crypto from "crypto";
import { incrementPurchaseCount } from "./recommendation.controller.js";
import calculatePartialPayment from "../utils/calculatePartialPayment.js";
import generatedOtp from "../utils/generatedOtp.js";
import smsProvider from "../services/sms/index.js";
import { autoAssignOrder } from "../services/orderAssignment.service.js";

 export async function CashOnDeliveryOrderController(request,response){
    try {
        const userId = request.userId // auth middleware
        const { list_items, totalAmt, addressId, subTotalAmt, deliverySlot, deliveryDate } = request.body

        // Validate delivery slot
        if (!deliverySlot || !deliveryDate) {
            return response.status(400).json({
                message: "Please select a delivery slot and date",
                error: true,
                success: false
            });
        }

        const payload = list_items.map(el => {
            return({
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : el.productId._id,
                product_details : {
                    name : el.productId.name,
                    image : el.productId.image
                } ,
                paymentId : "",
                payment_status : "CASH ON DELIVERY",
                delivery_address : addressId ,
                subTotalAmt  : subTotalAmt,
                totalAmt  :  totalAmt,
                order_status : 'CONFIRMED',
                delivery_slot : deliverySlot,
                delivery_date : new Date(deliveryDate)
            })
        })

        const generatedOrder = await OrderModel.insertMany(payload)

        ///remove from the cart
        const removeCartItems = await CartProductModel.deleteMany({ userId : userId })
        const updateInUser = await UserModel.updateOne({ _id : userId }, { shopping_cart : []})

        // Auto-assign orders to delivery agents
        const io = request.app.get('io');
        for (const order of generatedOrder) {
            try {
                await autoAssignOrder(order.orderId, io);
            } catch (assignError) {
                console.error(`Auto-assign failed for order ${order.orderId}:`, assignError);
                // Don't fail the order creation if auto-assign fails
            }
        }

        // Send order confirmation email
        try {
            const user = await UserModel.findById(userId);
            const address = await AddressModel.findById(addressId);
            
            if (user && generatedOrder.length > 0) {
                const items = list_items.map(item => ({
                    name: item.productId.name,
                    quantity: item.quantity,
                    price: (item.productId.price * item.quantity)
                }));

                await EmailService.sendOrderConfirmation({
                    userEmail: user.email,
                    customerName: user.name,
                    orderId: generatedOrder[0].orderId,
                    orderDate: EmailService.formatDate(new Date()),
                    items: items,
                    subtotal: subTotalAmt,
                    deliveryFee: 0,
                    total: totalAmt,
                    deliveryAddress: EmailService.formatAddress(address),
                    paymentMethod: 'Cash on Delivery',
                    deliverySlot: deliverySlot,
                    deliveryDate: EmailService.formatDate(new Date(deliveryDate))
                });
            }
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the order if email fails
        }

        return response.json({
            message : "Order successfully",
            error : false,
            success : true,
            data : generatedOrder
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error ,
            error : true,
            success : false
        })
    }
}

export const pricewithDiscount = (price,dis = 1)=>{
    const discountAmout = Math.ceil((Number(price) * Number(dis)) / 100)
    const actualPrice = Number(price) - Number(discountAmout)
    return actualPrice
}

export async function paymentController(request,response){
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId,subTotalAmt } = request.body 

        const user = await UserModel.findById(userId)

        const line_items  = list_items.map(item =>{
            return{
               price_data : {
                    currency : 'inr',
                    product_data : {
                        name : item.productId.name,
                        images : item.productId.image,
                        metadata : {
                            productId : item.productId._id
                        }
                    },
                    unit_amount : pricewithDiscount(item.productId.price,item.productId.discount) * 100   
               },
               adjustable_quantity : {
                    enabled : true,
                    minimum : 1
               },
               quantity : item.quantity 
            }
        })

        const params = {
            submit_type : 'pay',
            mode : 'payment',
            payment_method_types : ['card'],
            customer_email : user.email,
            metadata : {
                userId : userId,
                addressId : addressId
            },
            line_items : line_items,
            success_url : `${process.env.FRONTEND_URL}/success`,
            cancel_url : `${process.env.FRONTEND_URL}/cancel`
        }

        const session = await Stripe.checkout.sessions.create(params)

        return response.status(200).json(session)

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


const getOrderProductItems = async({
    lineItems,
    userId,
    addressId,
    paymentId,
    payment_status,
 })=>{
    const productList = []

    if(lineItems?.data?.length){
        for(const item of lineItems.data){
            const product = await Stripe.products.retrieve(item.price.product)

            const paylod = {
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : product.metadata.productId, 
                product_details : {
                    name : product.name,
                    image : product.images
                } ,
                paymentId : paymentId,
                payment_status : payment_status,
                delivery_address : addressId,
                subTotalAmt  : Number(item.amount_total / 100),
                totalAmt  :  Number(item.amount_total / 100),
            }

            productList.push(paylod)
        }
    }

    return productList
}

//http://localhost:5000/api/order/webhook
export async function webhookStripe(request,response){
    const event = request.body;
    const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY

    console.log("event",event)

    // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const lineItems = await Stripe.checkout.sessions.listLineItems(session.id)
      const userId = session.metadata.userId
      const orderProduct = await getOrderProductItems(
        {
            lineItems : lineItems,
            userId : userId,
            addressId : session.metadata.addressId,
            paymentId  : session.payment_intent,
            payment_status : session.payment_status,
        })
    
      const order = await OrderModel.insertMany(orderProduct)

        console.log(order)
        if(Boolean(order[0])){
            const removeCartItems = await  UserModel.findByIdAndUpdate(userId,{
                shopping_cart : []
            })
            const removeCartProductDB = await CartProductModel.deleteMany({ userId : userId})

            // Send order confirmation email for Stripe payment
            try {
                const user = await UserModel.findById(userId);
                const address = await AddressModel.findById(session.metadata.addressId);
                
                if (user && order.length > 0) {
                    const items = order.map(item => ({
                        name: item.product_details.name,
                        quantity: 1,
                        price: item.totalAmt
                    }));

                    const totalAmount = order.reduce((sum, item) => sum + item.totalAmt, 0);

                    await EmailService.sendOrderConfirmation({
                        userEmail: user.email,
                        customerName: user.name,
                        orderId: order[0].orderId,
                        orderDate: EmailService.formatDate(new Date()),
                        items: items,
                        subtotal: totalAmount,
                        deliveryFee: 0,
                        total: totalAmount,
                        deliveryAddress: EmailService.formatAddress(address),
                        paymentMethod: 'Card Payment',
                        deliverySlot: order[0].delivery_slot || '7am-8am',
                        deliveryDate: EmailService.formatDate(order[0].delivery_date || new Date())
                    });
                }
            } catch (emailError) {
                console.error('Failed to send order confirmation email:', emailError);
                // Don't fail the order if email fails
            }
        }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
}


export async function getOrderDetailsController(request,response){
    try {
        const userId = request.userId // order id

        const orderlist = await OrderModel.find({ userId : userId }).sort({ createdAt : -1 }).populate('delivery_address')

        return response.json({
            message : "order list",
            data : orderlist,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

/**
 * Get All Orders Controller (Admin Only)
 * Fetches all orders with pagination, filtering, and search
 */
export async function getAllOrdersController(request, response) {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = request.query;

        // Build query
        let query = {};

        // Filter by status if provided
        if (status && status !== 'ALL') {
            query.order_status = status;
        }

        // Search by order ID, user email, or product name
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'product_details.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate skip for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count for pagination
        const totalOrders = await OrderModel.countDocuments(query);

        // Fetch orders with pagination and sorting
        const orders = await OrderModel.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('delivery_address')
            .populate('userId', 'name email mobile');

        return response.json({
            message: "All orders fetched successfully",
            data: orders,
            pagination: {
                total: totalOrders,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalOrders / parseInt(limit))
            },
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Razorpay Checkout Controller
 * Creates a Razorpay order for payment
 */
export async function razorpayCheckoutController(request, response) {
    try {
        const userId = request.userId; // auth middleware
        const { list_items, totalAmt, addressId, subTotalAmt, deliverySlot, deliveryDate } = request.body;

        // Validate required fields
        if (!list_items || !totalAmt || !addressId) {
            return response.status(400).json({
                message: "Missing required fields",
                error: true,
                success: false
            });
        }

        // Validate delivery slot
        if (!deliverySlot || !deliveryDate) {
            return response.status(400).json({
                message: "Please select a delivery slot and date",
                error: true,
                success: false
            });
        }

        // Get user details
        const user = await UserModel.findById(userId);

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(totalAmt * 100), // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${new mongoose.Types.ObjectId()}`,
            notes: {
                userId: userId,
                addressId: addressId,
                customerEmail: user.email,
                customerName: user.name
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        return response.status(200).json({
            success: true,
            error: false,
            message: "Razorpay order created successfully",
            data: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key_id: process.env.RAZORPAY_KEY_ID,
                customerName: user.name,
                customerEmail: user.email,
                customerPhone: user.mobile || '',
                list_items: list_items,
                addressId: addressId,
                subTotalAmt: subTotalAmt,
                totalAmt: totalAmt,
                deliverySlot: deliverySlot,
                deliveryDate: deliveryDate
            }
        });

    } catch (error) {
        console.error("Razorpay checkout error:", error);
        return response.status(500).json({
            message: error.message || "Failed to create Razorpay order",
            error: true,
            success: false
        });
    }
}

/**
 * Verify Razorpay Payment Controller
 * Verifies the payment signature and creates order in database
 */
export async function verifyRazorpayPaymentController(request, response) {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            list_items,
            addressId,
            subTotalAmt,
            totalAmt,
            deliverySlot,
            deliveryDate
        } = request.body;

        const userId = request.userId;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return response.status(400).json({
                message: "Missing payment verification details",
                error: true,
                success: false
            });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return response.status(400).json({
                message: "Payment verification failed",
                error: true,
                success: false
            });
        }

        // Payment is verified, create order in database
        const payload = list_items.map(el => {
            return {
                userId: userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: el.productId._id,
                product_details: {
                    name: el.productId.name,
                    image: el.productId.image
                },
                paymentId: razorpay_payment_id,
                payment_status: "PAID",
                payment_method: 'online',
                delivery_address: addressId,
                subTotalAmt: subTotalAmt,
                totalAmt: totalAmt,
                order_status: 'CONFIRMED',
                delivery_slot: deliverySlot,
                delivery_date: new Date(deliveryDate)
            };
        });

        const generatedOrder = await OrderModel.insertMany(payload);

        // Remove items from cart
        await CartProductModel.deleteMany({ userId: userId });
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });

        // Auto-assign orders to delivery agents
        const io = request.app.get('io');
        for (const order of generatedOrder) {
            try {
                await autoAssignOrder(order.orderId, io);
            } catch (assignError) {
                console.error(`Auto-assign failed for order ${order.orderId}:`, assignError);
                // Don't fail the order creation if auto-assign fails
            }
        }

        // Send order confirmation email
        try {
            const user = await UserModel.findById(userId);
            const address = await AddressModel.findById(addressId);

            if (user && generatedOrder.length > 0) {
                const items = list_items.map(item => ({
                    name: item.productId.name,
                    quantity: item.quantity,
                    price: (item.productId.price * item.quantity)
                }));

                await EmailService.sendOrderConfirmation({
                    userEmail: user.email,
                    customerName: user.name,
                    orderId: generatedOrder[0].orderId,
                    orderDate: EmailService.formatDate(new Date()),
                    items: items,
                    subtotal: subTotalAmt,
                    deliveryFee: 0,
                    total: totalAmt,
                    deliveryAddress: EmailService.formatAddress(address),
                    paymentMethod: 'Razorpay (Online)',
                    deliverySlot: deliverySlot,
                    deliveryDate: EmailService.formatDate(new Date(deliveryDate))
                });
            }
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the order if email fails
        }

        return response.json({
            message: "Payment verified and order created successfully",
            error: false,
            success: true,
            data: generatedOrder
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        return response.status(500).json({
            message: error.message || "Payment verification failed",
            error: true,
            success: false
        });
    }
}

/**
 * Razorpay Webhook Handler
 * Handles payment notifications from Razorpay
 */
export async function webhookRazorpay(request, response) {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const webhookSignature = request.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(request.body);

        // Verify webhook signature if secret is configured
        if (webhookSecret) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(webhookBody)
                .digest('hex');

            if (expectedSignature !== webhookSignature) {
                console.error('Razorpay webhook signature verification failed');
                return response.status(400).json({
                    message: 'Invalid signature',
                    error: true,
                    success: false
                });
            }
        }

        const event = request.body;
        console.log('Razorpay webhook event:', event.event);

        // Handle different webhook events
        switch (event.event) {
            case 'payment.authorized':
                console.log('Payment authorized:', event.payload.payment.entity.id);
                break;

            case 'payment.captured':
                console.log('Payment captured:', event.payload.payment.entity.id);
                // You can add additional logic here if needed
                break;

            case 'payment.failed':
                console.log('Payment failed:', event.payload.payment.entity.id);
                // Handle failed payment
                const failedPayment = event.payload.payment.entity;
                
                // Send payment failed email if you have user info
                try {
                    if (failedPayment.notes && failedPayment.notes.customerEmail) {
                        await EmailService.sendPaymentFailed({
                            userEmail: failedPayment.notes.customerEmail,
                            customerName: failedPayment.notes.customerName || 'Customer',
                            orderId: failedPayment.order_id,
                            failureReason: failedPayment.error_description || 'Payment failed',
                            amount: failedPayment.amount / 100,
                            retryLink: `${process.env.FRONTEND_URL}/checkout`
                        });
                    }
                } catch (emailError) {
                    console.error('Failed to send payment failed email:', emailError);
                }
                break;

            case 'order.paid':
                console.log('Order paid:', event.payload.order.entity.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.event}`);
        }

        // Return success response to acknowledge receipt
        return response.json({
            received: true,
            success: true
        });

    } catch (error) {
        console.error('Razorpay webhook error:', error);
        return response.status(500).json({
            message: error.message || 'Webhook processing failed',
            error: true,
            success: false
        });
    }
}

/**
 * Update Order Status Controller
 * Updates order status and sends appropriate email notifications
 */
export async function updateOrderStatusController(request, response) {
    try {
        const { orderId } = request.params;
        const { 
            order_status, 
            delivery_partner, 
            tracking_url, 
            estimated_delivery_time,
            cancellation_reason,
            refund_amount,
            refund_id
        } = request.body;

        // Find the order
        const order = await OrderModel.findOne({ orderId }).populate('delivery_address');
        
        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        // Get user details
        const user = await UserModel.findById(order.userId);
        
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Prepare update data
        const updateData = { order_status };

        // Handle different status updates
        switch (order_status) {
            case 'DISPATCHED':
                updateData.dispatched_at = new Date();
                if (estimated_delivery_time) {
                    updateData.estimated_delivery_time = estimated_delivery_time;
                }
                break;

            case 'OUT_FOR_DELIVERY':
                updateData.out_for_delivery_at = new Date();
                if (delivery_partner) {
                    updateData.delivery_partner = delivery_partner;
                }
                if (tracking_url) {
                    updateData.tracking_url = tracking_url;
                }
                if (estimated_delivery_time) {
                    updateData.estimated_delivery_time = estimated_delivery_time;
                }
                break;

            case 'DELIVERED':
                updateData.delivered_at = new Date();
                // Increment purchase count for recommendations
                await incrementPurchaseCount(order.productId);
                break;

            case 'CANCELLED':
                updateData.cancelled_at = new Date();
                if (cancellation_reason) {
                    updateData.cancellation_reason = cancellation_reason;
                }
                // If payment was made, initiate refund
                if (order.payment_status !== 'CASH ON DELIVERY' && order.totalAmt > 0) {
                    updateData.refund_status = 'INITIATED';
                    updateData.refund_amount = refund_amount || order.totalAmt;
                    updateData.refund_initiated_at = new Date();
                    if (refund_id) {
                        updateData.refund_id = refund_id;
                    }
                }
                break;

            case 'REFUND_INITIATED':
                updateData.refund_status = 'INITIATED';
                updateData.refund_amount = refund_amount || order.totalAmt;
                updateData.refund_initiated_at = new Date();
                if (refund_id) {
                    updateData.refund_id = refund_id;
                }
                break;

            case 'REFUND_COMPLETED':
                updateData.refund_status = 'COMPLETED';
                updateData.refund_completed_at = new Date();
                if (refund_amount) {
                    updateData.refund_amount = refund_amount;
                }
                if (refund_id) {
                    updateData.refund_id = refund_id;
                }
                break;
        }

        // Update the order
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { orderId },
            updateData,
            { new: true }
        ).populate('delivery_address');

        // Send appropriate email based on status
        try {
            const items = [{
                name: order.product_details.name,
                quantity: 1,
                price: order.totalAmt
            }];

            switch (order_status) {
                case 'DISPATCHED':
                    await EmailService.sendOrderDispatched({
                        userEmail: user.email,
                        customerName: user.name,
                        orderId: order.orderId,
                        items: items,
                        total: order.totalAmt,
                        deliveryAddress: EmailService.formatAddress(order.delivery_address),
                        deliverySlot: order.delivery_slot,
                        deliveryDate: EmailService.formatDate(order.delivery_date)
                    });
                    break;

                case 'OUT_FOR_DELIVERY':
                    await EmailService.sendOutForDelivery({
                        userEmail: user.email,
                        customerName: user.name,
                        orderId: order.orderId,
                        deliveryPartnerName: delivery_partner?.name || 'Your delivery partner',
                        deliveryPartnerPhone: delivery_partner?.phone || '',
                        vehicleNumber: delivery_partner?.vehicle_number || '',
                        trackingLink: tracking_url || '',
                        estimatedArrival: updateData.estimated_delivery_time || '15-20 minutes',
                        deliveryAddress: EmailService.formatAddress(order.delivery_address)
                    });
                    break;

                case 'DELIVERED':
                    await EmailService.sendOrderDelivered({
                        userEmail: user.email,
                        customerName: user.name,
                        orderId: order.orderId,
                        deliveryDate: EmailService.formatDate(new Date()),
                        items: items,
                        total: order.totalAmt,
                        feedbackLink: `${process.env.FRONTEND_URL}/myorders`
                    });
                    
                    // Send review request email after delivery
                    try {
                        await EmailService.sendReviewRequest({
                            userEmail: user.email,
                            userName: user.name,
                            orderNumber: order.orderId,
                            productName: order.product_details?.name || 'Your product',
                            productImage: order.product_details?.image?.[0] || '',
                            deliveredDate: new Date(),
                            reviewLink: `${process.env.FRONTEND_URL}/product/${order.productId}`
                        });
                    } catch (reviewEmailError) {
                        console.error('Failed to send review request email:', reviewEmailError);
                        // Don't fail the status update if review email fails
                    }
                    break;

                case 'CANCELLED':
                    await EmailService.sendOrderCancelled({
                        userEmail: user.email,
                        customerName: user.name,
                        orderId: order.orderId,
                        cancellationDate: EmailService.formatDate(new Date()),
                        cancellationReason: cancellation_reason || 'As per your request',
                        items: items,
                        refundAmount: updateData.refund_amount || 0,
                        refundMethod: order.payment_status === 'CASH ON DELIVERY' ? 'No refund required' : 'Original payment method',
                        refundEta: '5-7 business days'
                    });
                    break;

                case 'REFUND_INITIATED':
                    await EmailService.sendRefundInitiated({
                        userEmail: user.email,
                        customerName: user.name,
                        orderId: order.orderId,
                        refundId: updateData.refund_id || `REF-${orderId}`,
                        refundAmount: updateData.refund_amount,
                        refundReason: cancellation_reason || 'Order cancellation',
                        refundMethod: 'Original payment method',
                        refundEta: '5-7 business days',
                        initiatedDate: EmailService.formatDate(new Date())
                    });
                    break;

                case 'REFUND_COMPLETED':
                    await EmailService.sendRefundCompleted({
                        userEmail: user.email,
                        customerName: user.name,
                        orderId: order.orderId,
                        refundId: updateData.refund_id || order.refund_id || `REF-${orderId}`,
                        refundAmount: updateData.refund_amount || order.refund_amount,
                        refundMethod: 'Original payment method',
                        completedDate: EmailService.formatDate(new Date()),
                        transactionId: order.paymentId || ''
                    });
                    break;
            }
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError);
            // Don't fail the status update if email fails
        }

        // Emit Socket.io event for real-time tracking
        try {
            const io = request.app.get('io');
            if (io) {
                io.to(`order-${orderId}`).emit('order-status-updated', {
                    orderId: orderId,
                    order_status: order_status,
                    updatedOrder: updatedOrder,
                    timestamp: new Date()
                });
                console.log(`Socket event emitted for order ${orderId}: ${order_status}`);
                
                // Broadcast to nearby agents when status changes to OUT_FOR_DELIVERY
                if (order_status === 'OUT_FOR_DELIVERY' && updatedOrder.delivery_address) {
                    try {
                        const deliveryLocation = {
                            lat: updatedOrder.delivery_address.lat,
                            lng: updatedOrder.delivery_address.lng
                        };
                        
                        // Get nearby agents (within 10km radius)
                        const nearbyAgents = await getNearbyAgents(deliveryLocation, 10);
                        
                        if (nearbyAgents && nearbyAgents.length > 0) {
                            // Broadcast to each nearby agent
                            nearbyAgents.forEach(agent => {
                                io.to(`agent-${agent._id}`).emit('new-delivery-available', {
                                    order: {
                                        _id: updatedOrder._id,
                                        orderId: updatedOrder.orderId,
                                        totalAmt: updatedOrder.totalAmt,
                                        delivery_address: updatedOrder.delivery_address,
                                        delivery_slot: updatedOrder.delivery_slot,
                                        delivery_date: updatedOrder.delivery_date,
                                        payment_method: updatedOrder.payment_method
                                    },
                                    notifiedAt: new Date()
                                });
                            });
                            console.log(`Notified ${nearbyAgents.length} nearby agents about order ${orderId}`);
                        }
                    } catch (agentNotifyError) {
                        console.error('Failed to notify nearby agents:', agentNotifyError);
                    }
                }
            }
        } catch (socketError) {
            console.error('Failed to emit socket event:', socketError);
            // Don't fail the status update if socket emission fails
        }

        return response.json({
            message: `Order status updated to ${order_status}`,
            error: false,
            success: true,
            data: updatedOrder
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Track Order Controller
 * Get comprehensive order details for real-time tracking
 */
export async function trackOrderController(request, response) {
    try {
        const { orderId } = request.params;

        // Find order with all related data populated
        const order = await OrderModel.findOne({ orderId })
            .populate('delivery_address')
            .populate({
                path: 'productId',
                select: 'name image price discount category'
            })
            .populate({
                path: 'userId',
                select: 'name email mobile'
            });

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        // Prepare comprehensive tracking data
        const trackingData = {
            orderId: order.orderId,
            order_status: order.order_status,
            payment_status: order.payment_status,
            payment_method: order.payment_status === 'CASH ON DELIVERY' ? 'Cash on Delivery' : 'Online Payment',
            
            // Timestamps
            createdAt: order.createdAt,
            dispatched_at: order.dispatched_at,
            out_for_delivery_at: order.out_for_delivery_at,
            delivered_at: order.delivered_at,
            cancelled_at: order.cancelled_at,
            
            // Delivery info
            estimated_delivery_time: order.estimated_delivery_time,
            delivery_partner: order.delivery_partner,
            tracking_url: order.tracking_url,
            
            // Order details
            product_details: order.product_details,
            productInfo: order.productId ? {
                _id: order.productId._id,
                name: order.productId.name,
                image: order.productId.image,
                price: order.productId.price
            } : null,
            
            // Amounts
            subTotalAmt: order.subTotalAmt,
            totalAmt: order.totalAmt,
            
            // Address
            delivery_address: order.delivery_address,
            
            // Customer info (limited)
            customer: order.userId ? {
                name: order.userId.name,
                email: order.userId.email,
                mobile: order.userId.mobile
            } : null,
            
            // Cancellation/Refund info (if applicable)
            cancellation_reason: order.cancellation_reason,
            refund_status: order.refund_status,
            refund_amount: order.refund_amount,
            refund_id: order.refund_id,
            refund_initiated_at: order.refund_initiated_at,
            refund_completed_at: order.refund_completed_at,

            // Delivery OTP (only when rider has reached and OTP is active)
            delivery_otp: (order.order_status === 'OUT_FOR_DELIVERY' && order.otp_code && order.otp_expires_at && new Date(order.otp_expires_at) > new Date()) ? order.otp_code : null,
            delivery_otp_expires_at: (order.order_status === 'OUT_FOR_DELIVERY' && order.otp_code && order.otp_expires_at && new Date(order.otp_expires_at) > new Date()) ? order.otp_expires_at : null,

            // Delivery slot info
            delivery_slot: order.delivery_slot,
            delivery_date: order.delivery_date,

            // Agent location for live tracking
            agent_location: order.agent_location,

            // Store location (if available)
            store_location: order.store_location
        };

        return response.json({
            message: "Order tracking details retrieved successfully",
            error: false,
            success: true,
            data: trackingData
        });

    } catch (error) {
        console.error('Track order error:', error);
        return response.status(500).json({
            message: error.message || 'Failed to retrieve tracking details',
            error: true,
            success: false
        });
    }
}

export async function generateDeliveryOtpController(request,response){
    try {
        const { orderId } = request.params
        const order = await OrderModel.findOne({ orderId }).populate('userId')
        if(!order){
            return response.status(404).json({ message: "Order not found", error: true, success: false })
        }
        const otp = generatedOtp()
        const ttlMin = 30
        const expires = new Date(Date.now() + ttlMin * 60 * 1000)
        await OrderModel.updateOne({ orderId },{ delivery_otp: String(otp), delivery_otp_expires: expires, delivery_otp_attempts: 0 })
        const text = `Quickart delivery OTP ${otp}. Share with partner only at handoff. Valid ${ttlMin} min.`
        if(order.userId?.mobile){
            await smsProvider.sendOtp(order.userId.mobile, text)
        }
        return response.json({ message: "Delivery OTP generated", error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function verifyDeliveryOtpController(request,response){
    try {
        const { orderId } = request.params
        const { otp } = request.body
        const order = await OrderModel.findOne({ orderId })
        if(!order){
            return response.status(404).json({ message: "Order not found", error: true, success: false })
        }
        if(!otp){
            return response.status(400).json({ message: "Provide OTP", error: true, success: false })
        }
        const now = new Date()
        if(!order.delivery_otp || !order.delivery_otp_expires || order.delivery_otp_expires < now){
            return response.status(400).json({ message: "OTP expired or not set", error: true, success: false })
        }
        if(String(order.delivery_otp) !== String(otp)){
            await OrderModel.updateOne({ orderId },{ $inc: { delivery_otp_attempts: 1 } })
            return response.status(400).json({ message: "Invalid OTP", error: true, success: false })
        }
        const updated = await OrderModel.findOneAndUpdate(
            { orderId },
            { delivery_verification_at: new Date(), delivery_otp: null, delivery_otp_expires: null },
            { new: true }
        )
        // Optionally mark delivered
        if(updated.order_status !== 'DELIVERED'){
            await OrderModel.updateOne({ orderId }, { order_status: 'DELIVERED', delivered_at: new Date() })
        }
        return response.json({ message: "Delivery verified", error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

/**
 * Partial Prepayment Checkout Controller
 * Creates a Razorpay order for the prepayment amount (₹20-100)
 * This is part of the COD fraud prevention strategy
 * 
 * Flow:
 * 1. Calculate prepayment (10% or ₹20-100)
 * 2. Create Razorpay order for prepayment amount
 * 3. Return order details to frontend
 * 4. Frontend collects prepayment via Razorpay
 * 5. After verification, order created with COD remainder
 */
export async function partialPrepaymentCheckoutController(request, response) {
    try {
        const userId = request.userId; // auth middleware
        const { list_items, totalAmt, addressId, subTotalAmt, deliverySlot, deliveryDate } = request.body;

        // Validate required fields
        if (!list_items || !totalAmt || !addressId) {
            return response.status(400).json({
                message: "Missing required fields",
                error: true,
                success: false
            });
        }

        // Validate delivery slot
        if (!deliverySlot || !deliveryDate) {
            return response.status(400).json({
                message: "Please select a delivery slot and date",
                error: true,
                success: false
            });
        }

        // Calculate partial payment breakdown
        const paymentBreakdown = calculatePartialPayment(totalAmt);
        
        console.log('Partial Payment Breakdown:', paymentBreakdown);
        // Example: { prepaymentAmount: 50, codAmount: 450, total: 500, percentage: 10 }

        // Get user details
        const user = await UserModel.findById(userId);

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Create Razorpay order for PREPAYMENT AMOUNT ONLY
        const options = {
            amount: Math.round(paymentBreakdown.prepaymentAmount * 100), // Prepayment in paise
            currency: "INR",
            receipt: `prepay_${new mongoose.Types.ObjectId()}`,
            notes: {
                userId: userId,
                addressId: addressId,
                customerEmail: user.email,
                customerName: user.name,
                orderType: 'partial_prepayment',
                prepaymentAmount: paymentBreakdown.prepaymentAmount,
                codAmount: paymentBreakdown.codAmount,
                totalAmount: paymentBreakdown.total
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        return response.status(200).json({
            success: true,
            error: false,
            message: "Partial prepayment order created successfully",
            data: {
                // Razorpay order details
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key_id: process.env.RAZORPAY_KEY_ID,
                
                // Customer details
                customerName: user.name,
                customerEmail: user.email,
                customerPhone: user.mobile || '',
                
                // Payment breakdown
                paymentBreakdown: paymentBreakdown,
                
                // Order details (to be stored after verification)
                list_items: list_items,
                addressId: addressId,
                subTotalAmt: subTotalAmt,
                totalAmt: totalAmt,
                deliverySlot: deliverySlot,
                deliveryDate: deliveryDate
            }
        });

    } catch (error) {
        console.error("Partial prepayment checkout error:", error);
        return response.status(500).json({
            message: error.message || "Failed to create partial prepayment order",
            error: true,
            success: false
        });
    }
}

/**
 * Verify Partial Prepayment Controller
 * Verifies the prepayment signature and creates order with COD remainder
 * 
 * Flow:
 * 1. Verify Razorpay signature (security)
 * 2. Recalculate payment breakdown
 * 3. Create order in database with:
 *    - payment_method: "partial_prepayment"
 *    - prepayment_amount: ₹50 (paid)
 *    - cod_amount: ₹450 (to be collected)
 *    - prepayment_status: "completed"
 * 4. Clear cart
 * 5. Send confirmation email
 * 6. Delivery partner collects COD amount at delivery
 */
export async function verifyPartialPrepaymentController(request, response) {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            list_items,
            addressId,
            subTotalAmt,
            totalAmt,
            deliverySlot,
            deliveryDate
        } = request.body;

        const userId = request.userId;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return response.status(400).json({
                message: "Missing payment verification details",
                error: true,
                success: false
            });
        }

        // Verify Razorpay signature (CRITICAL for security)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return response.status(400).json({
                message: "Payment verification failed - Invalid signature",
                error: true,
                success: false
            });
        }

        // Payment is verified! Calculate breakdown again
        const paymentBreakdown = calculatePartialPayment(totalAmt);
        
        console.log('Order Creation - Payment Breakdown:', paymentBreakdown);
        console.log(`Customer paid ₹${paymentBreakdown.prepaymentAmount} online`);
        console.log(`Delivery partner will collect ₹${paymentBreakdown.codAmount} at delivery`);

        // Create order with partial prepayment details
        const payload = list_items.map(el => {
            return {
                userId: userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: el.productId._id,
                product_details: {
                    name: el.productId.name,
                    image: el.productId.image
                },
                // Payment tracking
                paymentId: razorpay_payment_id,
                payment_status: "PARTIAL PREPAYMENT + COD",
                payment_method: "partial_prepayment",
                
                // Partial prepayment details
                prepayment_amount: paymentBreakdown.prepaymentAmount,
                cod_amount: paymentBreakdown.codAmount,
                prepayment_status: "completed",
                prepayment_transaction_id: razorpay_payment_id,
                
                // Order details
                delivery_address: addressId,
                subTotalAmt: subTotalAmt,
                totalAmt: totalAmt,
                order_status: 'CONFIRMED',
                delivery_slot: deliverySlot,
                delivery_date: new Date(deliveryDate)
            };
        });

        const generatedOrder = await OrderModel.insertMany(payload);

        // Clear cart after successful order
        await CartProductModel.deleteMany({ userId: userId });
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });

        // Send order confirmation email
        try {
            const user = await UserModel.findById(userId);
            const address = await AddressModel.findById(addressId);

            if (user && generatedOrder.length > 0) {
                const items = list_items.map(item => ({
                    name: item.productId.name,
                    quantity: item.quantity,
                    price: (item.productId.price * item.quantity)
                }));

                await EmailService.sendOrderConfirmation({
                    userEmail: user.email,
                    customerName: user.name,
                    orderId: generatedOrder[0].orderId,
                    orderDate: EmailService.formatDate(new Date()),
                    items: items,
                    subtotal: subTotalAmt,
                    deliveryFee: 0,
                    total: totalAmt,
                    deliveryAddress: EmailService.formatAddress(address),
                    paymentMethod: `Partial Prepayment (₹${paymentBreakdown.prepaymentAmount} paid online + ₹${paymentBreakdown.codAmount} COD)`,
                    deliverySlot: deliverySlot,
                    deliveryDate: EmailService.formatDate(new Date(deliveryDate))
                });
            }
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the order if email fails
        }

        return response.json({
            message: "Prepayment verified and order created successfully",
            error: false,
            success: true,
            data: {
                orders: generatedOrder,
                paymentBreakdown: paymentBreakdown,
                message: `You paid ₹${paymentBreakdown.prepaymentAmount} online. Please pay ₹${paymentBreakdown.codAmount} to delivery partner.`
            }
        });

    } catch (error) {
        console.error("Partial prepayment verification error:", error);
        return response.status(500).json({
            message: error.message || "Payment verification failed",
            error: true,
            success: false
        });
    }
}
