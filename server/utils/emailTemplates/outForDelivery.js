import baseEmailTemplate from './baseTemplate.js';

/**
 * Out for Delivery Email Template
 * Sent when delivery partner picks up the order
 */
const outForDeliveryTemplate = ({ 
    customerName, 
    orderId,
    deliveryPartnerName = 'Your delivery partner',
    deliveryPartnerPhone = '',
    vehicleNumber = '',
    trackingLink = '',
    estimatedArrival = '15-20 minutes',
    deliveryAddress
}) => {
    const content = `
        <div class="email-title">🚴 Your Order is On The Way!</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>Exciting news! Your order is now out for delivery and will reach you soon!</p>
        </div>

        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); 
                    border-radius: 12px; 
                    padding: 30px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #86efac;">
            <div style="font-size: 64px; margin-bottom: 15px;">🚴‍♂️</div>
            <div style="font-size: 22px; color: #047857; font-weight: 700; margin-bottom: 10px;">
                Order Out for Delivery!
            </div>
            <div style="font-size: 14px; color: #065f46; margin-bottom: 15px;">
                Order ID: <span style="font-weight: 600;">${orderId}</span>
            </div>
            <div style="background-color: rgba(255, 255, 255, 0.8); 
                        border-radius: 8px; 
                        padding: 15px; 
                        margin-top: 20px;">
                <div style="font-size: 14px; color: #065f46; margin-bottom: 8px;">
                    Estimated Arrival
                </div>
                <div style="font-size: 28px; color: #047857; font-weight: 700;">
                    ${estimatedArrival}
                </div>
            </div>
        </div>

        <div class="info-box">
            <div class="info-box-title">👤 Delivery Partner Details</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280; width: 40%;">Name:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${deliveryPartnerName}</td>
                </tr>
                ${deliveryPartnerPhone ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #6b7280;">Phone:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">
                        <a href="tel:${deliveryPartnerPhone}" style="color: #DC2626; text-decoration: none;">
                            ${deliveryPartnerPhone}
                        </a>
                    </td>
                </tr>
                ` : ''}
                ${vehicleNumber ? `
                <tr>
                    <td style="padding: 12px 0; color: #6b7280;">Vehicle:</td>
                    <td style="padding: 12px 0; font-weight: 600; color: #1f2937;">${vehicleNumber}</td>
                </tr>
                ` : ''}
            </table>
        </div>

        <div class="info-box">
            <div class="info-box-title">📍 Delivery Address</div>
            <div style="color: #4b5563; margin-top: 10px; line-height: 1.6;">
                ${deliveryAddress}
            </div>
        </div>

        ${trackingLink ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingLink}" class="button">
                🗺️ Track Live Location
            </a>
        </div>
        ` : `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/myorders" class="button">
                View Order Details
            </a>
        </div>
        `}

        <div style="background-color: #fffbeb; 
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #d97706; margin-bottom: 10px; font-size: 16px;">
                📋 Important Delivery Instructions
            </div>
            <ul style="list-style: none; padding: 0; margin: 10px 0 0 0; color: #92400e;">
                <li style="padding: 5px 0;">✓ Please keep your phone handy</li>
                <li style="padding: 5px 0;">✓ Ensure someone is available to receive the order</li>
                <li style="padding: 5px 0;">✓ Check items before accepting delivery</li>
                <li style="padding: 5px 0;">✓ Payment will be collected if COD</li>
            </ul>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <p style="margin-top: 20px;">
                <strong>Track Your Delivery:</strong><br>
                Your order is being carefully handled by our delivery partner. 
                ${deliveryPartnerPhone ? `You can reach them at <a href="tel:${deliveryPartnerPhone}" style="color: #DC2626;">${deliveryPartnerPhone}</a> if needed.` : ''}
            </p>
            
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                We hope you enjoy your order! Don't forget to rate your delivery experience.
            </p>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Out for Delivery - Quickart',
        content,
        footerText: 'Almost there! Your order will arrive soon! 🎉'
    });
};

export default outForDeliveryTemplate;

