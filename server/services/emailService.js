import sendEmail from '../config/sendEmail.js';
import orderConfirmationTemplate from '../utils/emailTemplates/orderConfirmation.js';
import orderDispatchedTemplate from '../utils/emailTemplates/orderDispatched.js';
import outForDeliveryTemplate from '../utils/emailTemplates/outForDelivery.js';
import orderDeliveredTemplate from '../utils/emailTemplates/orderDelivered.js';
import orderCancelledTemplate from '../utils/emailTemplates/orderCancelled.js';
import refundInitiatedTemplate from '../utils/emailTemplates/refundInitiated.js';
import refundCompletedTemplate from '../utils/emailTemplates/refundCompleted.js';
import paymentFailedTemplate from '../utils/emailTemplates/paymentFailed.js';
import { reviewRequestTemplate } from '../utils/emailTemplates/reviewRequest.js';

/**
 * Email Service for Quickart
 * Centralized service for sending all types of transactional emails
 */

class EmailService {
    /**
     * Send Order Confirmation Email
     */
    static async sendOrderConfirmation(data) {
        try {
            const { userEmail, customerName, orderId, orderDate, items, subtotal, deliveryFee, total, deliveryAddress, paymentMethod, estimatedDelivery } = data;

            const html = orderConfirmationTemplate({
                customerName,
                orderId,
                orderDate,
                items,
                subtotal,
                deliveryFee,
                total,
                deliveryAddress,
                paymentMethod,
                estimatedDelivery
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Order Confirmed - ${orderId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Order Dispatched Email
     */
    static async sendOrderDispatched(data) {
        try {
            const { userEmail, customerName, orderId, items, total, deliveryAddress, estimatedDelivery } = data;

            const html = orderDispatchedTemplate({
                customerName,
                orderId,
                items,
                total,
                deliveryAddress,
                estimatedDelivery
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Order Dispatched - ${orderId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending order dispatched email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Out for Delivery Email
     */
    static async sendOutForDelivery(data) {
        try {
            const { 
                userEmail, 
                customerName, 
                orderId, 
                deliveryPartnerName, 
                deliveryPartnerPhone, 
                vehicleNumber, 
                trackingLink, 
                estimatedArrival, 
                deliveryAddress 
            } = data;

            const html = outForDeliveryTemplate({
                customerName,
                orderId,
                deliveryPartnerName,
                deliveryPartnerPhone,
                vehicleNumber,
                trackingLink,
                estimatedArrival,
                deliveryAddress
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Out for Delivery - ${orderId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending out for delivery email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Order Delivered Email
     */
    static async sendOrderDelivered(data) {
        try {
            const { userEmail, customerName, orderId, deliveryDate, items, total, feedbackLink } = data;

            const html = orderDeliveredTemplate({
                customerName,
                orderId,
                deliveryDate,
                items,
                total,
                feedbackLink
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Order Delivered - ${orderId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending order delivered email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Order Cancelled Email
     */
    static async sendOrderCancelled(data) {
        try {
            const { 
                userEmail, 
                customerName, 
                orderId, 
                cancellationDate, 
                cancellationReason, 
                items, 
                refundAmount, 
                refundMethod, 
                refundEta 
            } = data;

            const html = orderCancelledTemplate({
                customerName,
                orderId,
                cancellationDate,
                cancellationReason,
                items,
                refundAmount,
                refundMethod,
                refundEta
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Order Cancelled - ${orderId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending order cancelled email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Refund Initiated Email
     */
    static async sendRefundInitiated(data) {
        try {
            const { 
                userEmail, 
                customerName, 
                orderId, 
                refundId, 
                refundAmount, 
                refundReason, 
                refundMethod, 
                refundEta, 
                initiatedDate 
            } = data;

            const html = refundInitiatedTemplate({
                customerName,
                orderId,
                refundId,
                refundAmount,
                refundReason,
                refundMethod,
                refundEta,
                initiatedDate
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Refund Initiated - ${refundId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending refund initiated email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Refund Completed Email
     */
    static async sendRefundCompleted(data) {
        try {
            const { 
                userEmail, 
                customerName, 
                orderId, 
                refundId, 
                refundAmount, 
                refundMethod, 
                completedDate, 
                transactionId 
            } = data;

            const html = refundCompletedTemplate({
                customerName,
                orderId,
                refundId,
                refundAmount,
                refundMethod,
                completedDate,
                transactionId
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Refund Completed - ${refundId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending refund completed email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Payment Failed Email
     */
    static async sendPaymentFailed(data) {
        try {
            const { userEmail, customerName, orderId, attemptDate, failureReason, amount, items } = data;

            const html = paymentFailedTemplate({
                customerName,
                orderId,
                attemptDate,
                failureReason,
                amount,
                items
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `Payment Failed - ${orderId} | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending payment failed email:', error);
            return { success: false, error };
        }
    }

    /**
     * Send Review Request Email
     */
    static async sendReviewRequest(data) {
        try {
            const { userEmail, userName, orderNumber, productName, productImage, deliveredDate, reviewLink } = data;

            const html = reviewRequestTemplate({
                userName,
                orderNumber,
                productName,
                productImage,
                deliveredDate: this.formatDate(deliveredDate),
                reviewLink
            });

            const result = await sendEmail({
                sendTo: userEmail,
                subject: `How was your experience with ${productName}? | Quickart`,
                html
            });

            return result;
        } catch (error) {
            console.error('Error sending review request email:', error);
            return { success: false, error };
        }
    }

    /**
     * Helper method to format date for emails
     */
    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Helper method to format address for emails
     */
    static formatAddress(address) {
        if (!address) return 'No address provided';
        
        const parts = [
            address.address_line,
            address.city,
            address.state,
            address.pincode,
            address.country
        ].filter(Boolean);

        return parts.join(', ');
    }

    /**
     * Helper method to format items for emails
     */
    static formatItems(cartItems, productDetails) {
        return cartItems.map(item => ({
            name: item.productId?.name || productDetails?.name || 'Product',
            quantity: item.quantity || 1,
            price: (item.productId?.price || productDetails?.price || 0) * (item.quantity || 1)
        }));
    }
}

export default EmailService;

