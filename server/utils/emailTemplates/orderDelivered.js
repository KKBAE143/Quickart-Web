import baseEmailTemplate from './baseTemplate.js';

/**
 * Order Delivered Email Template
 * Sent when order is successfully delivered
 */
const orderDeliveredTemplate = ({ 
    customerName, 
    orderId,
    deliveryDate,
    items,
    total,
    feedbackLink = ''
}) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const content = `
        <div class="email-title">✅ Order Delivered Successfully!</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>Your order has been delivered successfully! We hope everything arrived in perfect condition.</p>
        </div>

        <div style="background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); 
                    border-radius: 12px; 
                    padding: 40px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #86efac;">
            <div style="font-size: 72px; margin-bottom: 20px;">✅</div>
            <div style="font-size: 24px; color: #047857; font-weight: 700; margin-bottom: 15px;">
                Order Delivered!
            </div>
            <div style="background-color: rgba(255, 255, 255, 0.9); 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin-top: 20px;">
                <div style="font-size: 14px; color: #065f46; margin-bottom: 8px;">
                    Order ID
                </div>
                <div style="font-size: 20px; color: #047857; font-weight: 700; margin-bottom: 15px;">
                    ${orderId}
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                    Delivered on ${deliveryDate}
                </div>
            </div>
        </div>

        <div style="background-color: #f9fafb; 
                    border-radius: 8px; 
                    padding: 25px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 15px; font-size: 16px;">
                📦 Order Summary
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; color: #6b7280;">Total Items:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1f2937;">${itemCount}</td>
                </tr>
                <tr style="border-top: 2px solid #DC2626;">
                    <td style="padding: 15px 0; font-weight: 700; color: #1f2937; font-size: 18px;">Total Paid:</td>
                    <td style="padding: 15px 0; text-align: right; font-weight: 700; color: #DC2626; font-size: 18px;">₹${total.toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <div class="info-box">
            <div class="info-box-title">⭐ Rate Your Experience</div>
            <div style="color: #4b5563; margin-top: 10px; line-height: 1.6; margin-bottom: 15px;">
                Your feedback helps us improve! Please take a moment to rate your delivery experience and let us know how we did.
            </div>
            <div style="text-align: center; margin-top: 20px;">
                ${feedbackLink ? `
                <a href="${feedbackLink}" class="button">
                    ⭐ Rate Your Experience
                </a>
                ` : `
                <a href="${process.env.FRONTEND_URL}/myorders" class="button">
                    View Order Details
                </a>
                `}
            </div>
        </div>

        <div style="background-color: #fef3c7; 
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #d97706; margin-bottom: 10px; font-size: 16px;">
                🎁 Share the Love!
            </div>
            <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                Love your Quickart experience? Share it with friends and family! 
                They'll love the fast delivery and fresh products too.
            </div>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <p style="margin-top: 20px;">
                <strong>Need Help?</strong><br>
                If you have any issues with your order or need assistance, please don't hesitate to contact us. 
                Our support team is always here to help!
            </p>
            
            <div style="background-color: #f9fafb; 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin-top: 20px;
                        text-align: center;">
                <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">
                    💡 Thank You for Choosing Quickart!
                </div>
                <div style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                    We hope you enjoy your products. Looking forward to serving you again soon!
                </div>
            </div>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Order Delivered - Quickart',
        content,
        footerText: 'Thank you for trusting Quickart! We hope to see you again soon! 😊'
    });
};

export default orderDeliveredTemplate;

