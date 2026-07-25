import baseEmailTemplate from './baseTemplate.js';

/**
 * Payment Failed Email Template
 * Sent when payment transaction fails
 */
const paymentFailedTemplate = ({ 
    customerName, 
    orderId,
    attemptDate,
    failureReason = 'Payment could not be processed',
    amount,
    items
}) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const content = `
        <div class="email-title">⚠️ Payment Failed</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>We were unable to process your payment for order <strong>${orderId}</strong>. Your order has not been placed yet.</p>
        </div>

        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
                    border-radius: 12px; 
                    padding: 30px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #fca5a5;">
            <div style="font-size: 56px; margin-bottom: 15px;">⚠️</div>
            <div style="font-size: 22px; color: #991b1b; font-weight: 700; margin-bottom: 10px;">
                Payment Transaction Failed
            </div>
            <div style="background-color: rgba(255, 255, 255, 0.9); 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin-top: 20px;">
                <div style="font-size: 14px; color: #7f1d1d; margin-bottom: 8px;">
                    Order ID
                </div>
                <div style="font-size: 18px; color: #991b1b; font-weight: 700; margin-bottom: 10px;">
                    ${orderId}
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                    Attempted on ${attemptDate}
                </div>
            </div>
        </div>

        <div class="info-box">
            <div class="info-box-title">❌ Payment Details</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280; width: 40%;">Order ID:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${orderId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Amount:</td>
                    <td style="padding: 12px 0; font-weight: 700; color: #DC2626; font-size: 18px;">₹${amount.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Total Items:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${itemCount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Status:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #DC2626;">Payment Failed</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; color: #6b7280;">Reason:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${failureReason}</td>
                </tr>
            </table>
        </div>

        <div style="background-color: #fffbeb; 
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #d97706; margin-bottom: 15px; font-size: 16px;">
                🔍 Common Reasons for Payment Failure
            </div>
            <div style="color: #92400e; font-size: 14px; line-height: 1.8;">
                <div style="padding: 5px 0;">• Insufficient balance in your account</div>
                <div style="padding: 5px 0;">• Card limit exceeded</div>
                <div style="padding: 5px 0;">• Incorrect card details (CVV, expiry date)</div>
                <div style="padding: 5px 0;">• Bank declined the transaction</div>
                <div style="padding: 5px 0;">• Network connectivity issues</div>
                <div style="padding: 5px 0;">• 3D Secure authentication failed</div>
            </div>
        </div>

        <div style="background-color: #f0fdf4; 
                    border-left: 4px solid #10b981;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #059669; margin-bottom: 15px; font-size: 16px;">
                ✅ What You Can Do
            </div>
            <div style="color: #065f46; font-size: 14px; line-height: 1.8;">
                <div style="padding: 8px 0;">
                    <strong>1. Verify Your Payment Method:</strong> Check your card details and balance
                </div>
                <div style="padding: 8px 0;">
                    <strong>2. Try Again:</strong> Your cart items are saved, try placing the order again
                </div>
                <div style="padding: 8px 0;">
                    <strong>3. Use Different Method:</strong> Try another card or payment method
                </div>
                <div style="padding: 8px 0;">
                    <strong>4. Choose COD:</strong> Select Cash on Delivery for hassle-free ordering
                </div>
                <div style="padding: 8px 0;">
                    <strong>5. Contact Bank:</strong> If issue persists, contact your bank
                </div>
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/checkout" class="button" style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); margin-right: 10px;">
                🔄 Retry Payment
            </a>
            <a href="${process.env.FRONTEND_URL}/cart" class="button" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
                View Cart
            </a>
        </div>

        <div style="background-color: #eff6ff; 
                    border-left: 4px solid #3b82f6;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #1e40af; margin-bottom: 10px; font-size: 16px;">
                🛡️ Your Cart is Safe!
            </div>
            <div style="color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                Don't worry! Your cart items are saved. You can complete your purchase anytime. 
                No charges were made to your account since the payment failed.
            </div>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <p style="margin-top: 20px;">
                <strong>Need Help?</strong><br>
                If you're facing issues with payment or need assistance, our support team is here to help!
                You can reach us at <a href="mailto:support@quickart.com" style="color: #DC2626;">support@quickart.com</a> 
                or call <a href="tel:+918888888888" style="color: #DC2626;">+91 88888 88888</a>
            </p>
            
            <div style="background-color: #fef3c7; 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin-top: 20px;
                        text-align: center;">
                <div style="font-size: 16px; font-weight: 600; color: #d97706; margin-bottom: 10px;">
                    💡 Quick Tip
                </div>
                <div style="font-size: 14px; color: #92400e; line-height: 1.6;">
                    Most payment issues can be resolved by checking your card details, 
                    ensuring sufficient balance, or trying a different payment method.
                </div>
            </div>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Payment Failed - Quickart',
        content,
        footerText: 'We\'re here to help! Try again or contact support. 💪'
    });
};

export default paymentFailedTemplate;

