/**
 * Test Email Service
 * Run this script to test all email templates
 * 
 * Usage: node server/test-email-service.js
 * 
 * Make sure to:
 * 1. Set RESEND_API in .env
 * 2. Update TEST_EMAIL to your email address
 */

import dotenv from 'dotenv';
dotenv.config();

import EmailService from './services/emailService.js';

// ⚠️ UPDATE THIS TO YOUR EMAIL ADDRESS
const TEST_EMAIL = 'your-email@example.com';
const TEST_NAME = 'John Doe';

// Sample data for testing
const sampleOrderId = 'ORD-TEST-12345';
const sampleItems = [
    { name: 'Fresh Milk (1L)', quantity: 2, price: 120 },
    { name: 'Brown Bread', quantity: 1, price: 45 },
    { name: 'Farm Fresh Eggs (6 pcs)', quantity: 1, price: 60 }
];
const sampleTotal = 225;
const sampleAddress = '123 Main Street, MG Road, Bangalore, Karnataka, 560001, India';

async function testAllEmails() {
    console.log('🚀 Testing Quickart Email Service...\n');
    console.log(`📧 Sending test emails to: ${TEST_EMAIL}\n`);

    try {
        // Test 1: Order Confirmation
        console.log('1️⃣ Testing Order Confirmation Email...');
        await EmailService.sendOrderConfirmation({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            orderDate: EmailService.formatDate(new Date()),
            items: sampleItems,
            subtotal: sampleTotal,
            deliveryFee: 0,
            total: sampleTotal,
            deliveryAddress: sampleAddress,
            paymentMethod: 'Cash on Delivery',
            estimatedDelivery: '30-45 minutes'
        });
        console.log('   ✅ Order Confirmation sent successfully!\n');

        // Test 2: Order Dispatched
        console.log('2️⃣ Testing Order Dispatched Email...');
        await EmailService.sendOrderDispatched({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            items: sampleItems,
            total: sampleTotal,
            deliveryAddress: sampleAddress,
            estimatedDelivery: '20-30 minutes'
        });
        console.log('   ✅ Order Dispatched sent successfully!\n');

        // Test 3: Out for Delivery
        console.log('3️⃣ Testing Out for Delivery Email...');
        await EmailService.sendOutForDelivery({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            deliveryPartnerName: 'Rajesh Kumar',
            deliveryPartnerPhone: '+91 98765 43210',
            vehicleNumber: 'KA-01-AB-1234',
            trackingLink: 'https://quickart.com/track/order-12345',
            estimatedArrival: '15-20 minutes',
            deliveryAddress: sampleAddress
        });
        console.log('   ✅ Out for Delivery sent successfully!\n');

        // Test 4: Order Delivered
        console.log('4️⃣ Testing Order Delivered Email...');
        await EmailService.sendOrderDelivered({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            deliveryDate: EmailService.formatDate(new Date()),
            items: sampleItems,
            total: sampleTotal,
            feedbackLink: 'https://quickart.com/feedback'
        });
        console.log('   ✅ Order Delivered sent successfully!\n');

        // Test 5: Order Cancelled
        console.log('5️⃣ Testing Order Cancelled Email...');
        await EmailService.sendOrderCancelled({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            cancellationDate: EmailService.formatDate(new Date()),
            cancellationReason: 'Customer requested cancellation',
            items: sampleItems,
            refundAmount: sampleTotal,
            refundMethod: 'Original payment method',
            refundEta: '5-7 business days'
        });
        console.log('   ✅ Order Cancelled sent successfully!\n');

        // Test 6: Refund Initiated
        console.log('6️⃣ Testing Refund Initiated Email...');
        await EmailService.sendRefundInitiated({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            refundId: 'REF-TEST-12345',
            refundAmount: sampleTotal,
            refundReason: 'Order cancellation',
            refundMethod: 'Original payment method',
            refundEta: '5-7 business days',
            initiatedDate: EmailService.formatDate(new Date())
        });
        console.log('   ✅ Refund Initiated sent successfully!\n');

        // Test 7: Refund Completed
        console.log('7️⃣ Testing Refund Completed Email...');
        await EmailService.sendRefundCompleted({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            refundId: 'REF-TEST-12345',
            refundAmount: sampleTotal,
            refundMethod: 'Original payment method',
            completedDate: EmailService.formatDate(new Date()),
            transactionId: 'TXN-TEST-98765'
        });
        console.log('   ✅ Refund Completed sent successfully!\n');

        // Test 8: Payment Failed
        console.log('8️⃣ Testing Payment Failed Email...');
        await EmailService.sendPaymentFailed({
            userEmail: TEST_EMAIL,
            customerName: TEST_NAME,
            orderId: sampleOrderId,
            attemptDate: EmailService.formatDate(new Date()),
            failureReason: 'Insufficient funds',
            amount: sampleTotal,
            items: sampleItems
        });
        console.log('   ✅ Payment Failed sent successfully!\n');

        console.log('🎉 All test emails sent successfully!');
        console.log(`📬 Check your inbox at: ${TEST_EMAIL}\n`);
        console.log('💡 Tips:');
        console.log('   - Check spam/junk folder if emails don\'t appear');
        console.log('   - Emails may take 1-2 minutes to arrive');
        console.log('   - View Resend dashboard for delivery status');
        console.log('   - Test emails on mobile devices too\n');

    } catch (error) {
        console.error('❌ Error sending test emails:', error);
        console.error('\n🔍 Troubleshooting:');
        console.error('   1. Check if RESEND_API is set in .env');
        console.error('   2. Verify your Resend API key is valid');
        console.error('   3. Make sure TEST_EMAIL is correct');
        console.error('   4. Check Resend dashboard for errors\n');
    }
}

// Run tests
testAllEmails();

