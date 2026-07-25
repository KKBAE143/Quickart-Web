import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { 
    CashOnDeliveryOrderController, 
    getOrderDetailsController, 
    paymentController, 
    webhookStripe,
    updateOrderStatusController,
    razorpayCheckoutController,
    verifyRazorpayPaymentController,
    webhookRazorpay,
    getAllOrdersController,
    trackOrderController,
    partialPrepaymentCheckoutController,
    verifyPartialPrepaymentController,
    generateDeliveryOtpController,
    verifyDeliveryOtpController
} from '../controllers/order.controller.js'
import { rateLimitPayment, rateLimitApi, rateLimitAdmin } from '../middleware/rateLimiter.js'

const orderRouter = Router()

// Cash on Delivery - Payment rate limiting
orderRouter.post("/cash-on-delivery", auth, rateLimitPayment, CashOnDeliveryOrderController)

// Stripe Payment (Legacy - can be removed if fully migrating to Razorpay)
orderRouter.post('/checkout', auth, rateLimitPayment, paymentController)
orderRouter.post('/webhook', webhookStripe) // No rate limit on webhooks (Stripe handles this)

// Razorpay Payment - Payment rate limiting
orderRouter.post('/razorpay-checkout', auth, rateLimitPayment, razorpayCheckoutController)
orderRouter.post('/razorpay-verify', auth, rateLimitPayment, verifyRazorpayPaymentController)
orderRouter.post('/razorpay-webhook', webhookRazorpay) // No rate limit on webhooks (Razorpay handles this)

// Partial Prepayment (COD Fraud Prevention Strategy) - Payment rate limiting
orderRouter.post('/partial-prepayment-checkout', auth, rateLimitPayment, partialPrepaymentCheckoutController)
orderRouter.post('/partial-prepayment-verify', auth, rateLimitPayment, verifyPartialPrepaymentController)

// Order Management - General rate limiting
orderRouter.get("/order-list", auth, rateLimitApi, getOrderDetailsController)

// Order Tracking - Public route (no auth required)
orderRouter.get("/track/:orderId", rateLimitApi, trackOrderController)

// Delivery OTP - General rate limiting
orderRouter.post('/delivery-otp/generate/:orderId', auth, rateLimitApi, generateDeliveryOtpController)
orderRouter.post('/delivery-otp/verify/:orderId', auth, rateLimitApi, verifyDeliveryOtpController)

// Admin routes - Admin rate limiting
orderRouter.get("/all-orders", auth, admin, rateLimitAdmin, getAllOrdersController)
orderRouter.put("/update-status/:orderId", auth, admin, rateLimitAdmin, updateOrderStatusController)

export default orderRouter