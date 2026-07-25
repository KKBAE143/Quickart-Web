import baseEmailTemplate from './baseTemplate.js';

/**
 * Order Cancelled Email Template
 * Sent when an order is cancelled by user or admin
 */
const orderCancelledTemplate = ({ 
    customerName, 
    orderId,
    cancellationDate,
    cancellationReason = 'As per your request',
    items,
    refundAmount,
    refundMethod,
    refundEta = '5-7 business days'
}) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsList = items.slice(0, 3).map(item => `
        <li style="padding: 8px 0; color: #4b5563;">
            <span style="font-weight: 600; color: #1f2937;">${item.name}</span> 
            <span style="color: #6b7280;">× ${item.quantity}</span>
        </li>
    `).join('');
    const moreItems = items.length > 3 ? `<li style="padding: 8px 0; color: #6b7280;">...and ${items.length - 3} more items</li>` : '';

    const content = `
        <div class="email-title">❌ Order Cancelled</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>Your order has been cancelled as requested. We're sorry to see this order go!</p>
        </div>

        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
                    border-radius: 12px; 
                    padding: 30px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #fca5a5;">
            <div style="font-size: 56px; margin-bottom: 15px;">❌</div>
            <div style="font-size: 20px; color: #991b1b; font-weight: 700; margin-bottom: 10px;">
                Order Cancelled
            </div>
            <div style="font-size: 14px; color: #7f1d1d;">
                Order ID: <span style="font-weight: 600;">${orderId}</span>
            </div>
            <div style="font-size: 13px; color: #991b1b; margin-top: 10px;">
                Cancelled on ${cancellationDate}
            </div>
        </div>

        <div class="info-box">
            <div class="info-box-title">📋 Cancellation Details</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280; width: 40%;">Order ID:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${orderId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Cancelled On:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${cancellationDate}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; color: #6b7280;">Reason:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${cancellationReason}</td>
                </tr>
            </table>
        </div>

        <div style="background-color: #f9fafb; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 15px; font-size: 16px;">
                📦 Cancelled Items (${itemCount} items)
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${itemsList}
                ${moreItems}
            </ul>
        </div>

        ${refundAmount > 0 ? `
        <div style="background-color: #f0fdf4; 
                    border-left: 4px solid #10b981;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #059669; margin-bottom: 15px; font-size: 16px;">
                💰 Refund Information
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #d1fae5;">
                    <td style="padding: 10px 0; color: #065f46;">Refund Amount:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #047857; font-size: 18px;">₹${refundAmount.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #d1fae5;">
                    <td style="padding: 10px 0; color: #065f46;">Refund Method:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #047857;">${refundMethod}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #065f46;">Processing Time:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #047857;">${refundEta}</td>
                </tr>
            </table>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1fae5; font-size: 13px; color: #065f46;">
                ✓ Your refund will be processed automatically<br>
                ✓ You'll receive a confirmation email once completed<br>
                ✓ Amount will be credited to your original payment method
            </div>
        </div>
        ` : `
        <div style="background-color: #fef3c7; 
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #d97706; margin-bottom: 10px; font-size: 16px;">
                📌 No Payment Required
            </div>
            <div style="color: #92400e; font-size: 14px;">
                Since this was a Cash on Delivery order and it was cancelled before delivery, no refund is applicable.
            </div>
        </div>
        `}

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" class="button">
                Continue Shopping
            </a>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <p style="margin-top: 20px;">
                <strong>We'd Love to Have You Back!</strong><br>
                We're always here to serve you with fresh products and fast delivery. 
                Browse our collection and place a new order whenever you're ready!
            </p>
            
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                If you need any assistance or have questions about the cancellation, our support team is here to help.
            </p>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Order Cancelled - Quickart',
        content,
        footerText: 'We hope to serve you again soon! 🛒'
    });
};

export default orderCancelledTemplate;

