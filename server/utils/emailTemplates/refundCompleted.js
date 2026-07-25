import baseEmailTemplate from './baseTemplate.js';

/**
 * Refund Completed Email Template
 * Sent when refund is successfully processed
 */
const refundCompletedTemplate = ({ 
    customerName, 
    orderId,
    refundId,
    refundAmount,
    refundMethod,
    completedDate,
    transactionId = ''
}) => {
    const content = `
        <div class="email-title">✅ Refund Completed Successfully!</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>Great news! Your refund has been processed successfully and the amount has been credited.</p>
        </div>

        <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); 
                    border-radius: 12px; 
                    padding: 40px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #6ee7b7;">
            <div style="font-size: 72px; margin-bottom: 20px;">✅</div>
            <div style="font-size: 24px; color: #047857; font-weight: 700; margin-bottom: 15px;">
                Refund Completed!
            </div>
            <div style="background-color: rgba(255, 255, 255, 0.95); 
                        border-radius: 8px; 
                        padding: 25px; 
                        margin-top: 20px;">
                <div style="font-size: 14px; color: #065f46; margin-bottom: 10px;">
                    Refunded Amount
                </div>
                <div style="font-size: 36px; color: #059669; font-weight: 700; margin-bottom: 15px;">
                    ₹${refundAmount.toFixed(2)}
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                    Processed on ${completedDate}
                </div>
            </div>
        </div>

        <div class="info-box">
            <div class="info-box-title">💳 Refund Summary</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280; width: 40%;">Refund ID:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #DC2626;">${refundId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Order ID:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${orderId}</td>
                </tr>
                ${transactionId ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Transaction ID:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${transactionId}</td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Refund Amount:</td>
                    <td style="padding: 12px 0; font-weight: 700; color: #059669; font-size: 18px;">₹${refundAmount.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Refunded To:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${refundMethod}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; color: #6b7280;">Completed On:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${completedDate}</td>
                </tr>
            </table>
        </div>

        <div style="background-color: #f0fdf4; 
                    border-left: 4px solid #10b981;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #059669; margin-bottom: 15px; font-size: 16px;">
                ✅ Refund Status: COMPLETED
            </div>
            <div style="color: #065f46; font-size: 14px; line-height: 1.8;">
                <div style="padding: 5px 0;">
                    ✓ <strong>Refund processed successfully</strong>
                </div>
                <div style="padding: 5px 0;">
                    ✓ <strong>Amount credited to ${refundMethod}</strong>
                </div>
                <div style="padding: 5px 0;">
                    ✓ <strong>Transaction completed on ${completedDate}</strong>
                </div>
                <div style="padding: 5px 0; margin-top: 10px; padding-top: 10px; border-top: 1px solid #d1fae5;">
                    Please check your account statement. The refund should now be visible in your ${refundMethod}.
                </div>
            </div>
        </div>

        <div style="background-color: #eff6ff; 
                    border-left: 4px solid #3b82f6;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #1e40af; margin-bottom: 10px; font-size: 16px;">
                📝 Important Note
            </div>
            <div style="color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                If you don't see the refund in your account yet, please allow 2-3 business days 
                for your bank to process the credit. The refund statement may appear as "QUICKART REFUND" 
                or similar in your transaction history.
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" class="button">
                Continue Shopping
            </a>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <div style="background-color: #fef3c7; 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin: 25px 0;
                        text-align: center;">
                <div style="font-size: 18px; font-weight: 600; color: #d97706; margin-bottom: 10px;">
                    🎁 We Miss You Already!
                </div>
                <div style="font-size: 14px; color: #92400e; line-height: 1.6;">
                    We're sorry to see this order cancelled, but we'd love to serve you again! 
                    Browse our fresh collection and enjoy fast delivery on your next order.
                </div>
            </div>
            
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280; text-align: center;">
                If you have any questions about this refund, please contact our support team 
                with your Refund ID: <strong style="color: #DC2626;">${refundId}</strong>
            </p>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Refund Completed - Quickart',
        content,
        footerText: 'Thank you for your patience! Hope to serve you again soon! 💚'
    });
};

export default refundCompletedTemplate;

