import baseEmailTemplate from './baseTemplate.js';

/**
 * Refund Initiated Email Template
 * Sent when refund process is started
 */
const refundInitiatedTemplate = ({ 
    customerName, 
    orderId,
    refundId,
    refundAmount,
    refundReason = 'Order cancellation',
    refundMethod,
    refundEta = '5-7 business days',
    initiatedDate
}) => {
    const content = `
        <div class="email-title">💰 Refund Initiated</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>We've initiated your refund request. The amount will be credited to your account shortly.</p>
        </div>

        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); 
                    border-radius: 12px; 
                    padding: 35px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #93c5fd;">
            <div style="font-size: 64px; margin-bottom: 20px;">💰</div>
            <div style="font-size: 22px; color: #1e40af; font-weight: 700; margin-bottom: 15px;">
                Refund Initiated Successfully
            </div>
            <div style="background-color: rgba(255, 255, 255, 0.9); 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin-top: 20px;">
                <div style="font-size: 14px; color: #1e40af; margin-bottom: 8px;">
                    Refund Amount
                </div>
                <div style="font-size: 32px; color: #1d4ed8; font-weight: 700; margin-bottom: 10px;">
                    ₹${refundAmount.toFixed(2)}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-top: 10px;">
                    Initiated on ${initiatedDate}
                </div>
            </div>
        </div>

        <div class="info-box">
            <div class="info-box-title">📋 Refund Details</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280; width: 40%;">Refund ID:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #DC2626;">${refundId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Order ID:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${orderId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Refund Amount:</td>
                    <td style="padding: 12px 0; font-weight: 700; color: #047857; font-size: 16px;">₹${refundAmount.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Refund Method:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${refundMethod}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Reason:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${refundReason}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; color: #6b7280;">Processing Time:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${refundEta}</td>
                </tr>
            </table>
        </div>

        <div style="background-color: #f0fdf4; 
                    border-left: 4px solid #10b981;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #059669; margin-bottom: 15px; font-size: 16px;">
                ✅ What Happens Next?
            </div>
            <div style="color: #065f46; font-size: 14px; line-height: 1.8;">
                <div style="padding: 8px 0;">
                    <strong>1. Processing:</strong> Your refund is being processed by our payment team
                </div>
                <div style="padding: 8px 0;">
                    <strong>2. Bank Processing:</strong> Your bank will process the credit (${refundEta})
                </div>
                <div style="padding: 8px 0;">
                    <strong>3. Confirmation:</strong> You'll receive an email once the refund is completed
                </div>
                <div style="padding: 8px 0;">
                    <strong>4. Check Account:</strong> The amount will appear in your ${refundMethod}
                </div>
            </div>
        </div>

        <div style="background-color: #fffbeb; 
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #d97706; margin-bottom: 10px; font-size: 16px;">
                ⏱️ Processing Timeline
            </div>
            <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                <strong>Note:</strong> While we process refunds immediately, the actual credit to your account 
                depends on your bank's processing time. Please allow ${refundEta} for the amount to reflect in your account.
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/myorders" class="button">
                View Order History
            </a>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <p style="margin-top: 20px;">
                <strong>Need Help?</strong><br>
                If you have any questions about your refund or if the amount doesn't reflect within the 
                expected timeframe, please don't hesitate to contact our support team.
            </p>
            
            <div style="background-color: #f9fafb; 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin-top: 20px;
                        text-align: center;">
                <div style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                    Keep this email for your records. You can use the Refund ID 
                    <strong style="color: #DC2626;">${refundId}</strong> for any queries.
                </div>
            </div>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Refund Initiated - Quickart',
        content,
        footerText: 'We value your trust and satisfaction! 🙏'
    });
};

export default refundInitiatedTemplate;

