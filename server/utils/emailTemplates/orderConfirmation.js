import baseEmailTemplate from './baseTemplate.js';

/**
 * Order Confirmation Email Template
 * Sent immediately after successful order placement
 */
const orderConfirmationTemplate = ({ 
    customerName, 
    orderId, 
    orderDate,
    items,
    subtotal,
    deliveryFee = 0,
    total,
    deliveryAddress,
    paymentMethod,
    deliverySlot,
    deliveryDate
}) => {
    // Format items list
    const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 15px 0;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.name}</div>
                <div style="font-size: 13px; color: #6b7280;">Qty: ${item.quantity}</div>
            </td>
            <td style="padding: 15px 0; text-align: right; font-weight: 600; color: #1f2937;">
                ₹${item.price.toFixed(2)}
            </td>
        </tr>
    `).join('');

    const content = `
        <div class="email-title">🎉 Order Confirmed!</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>Thank you for your order! We've received your order and it's being prepared for delivery.</p>
        </div>

        <div class="info-box">
            <div class="info-box-title">📦 Order Details</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="border-bottom: 2px solid #DC2626;">
                    <td style="padding: 10px 0; font-weight: 600; color: #6b7280;">Order ID:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #DC2626;">${orderId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280;">Order Date:</td>
                    <td style="padding: 10px 0; text-align: right; color: #1f2937;">${orderDate}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #6b7280;">Payment Method:</td>
                    <td style="padding: 10px 0; text-align: right; color: #1f2937;">${paymentMethod}</td>
                </tr>
            </table>
        </div>

        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 15px; font-size: 16px;">🛒 Your Items</div>
            <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr style="border-top: 2px solid #DC2626;">
                    <td style="padding: 15px 0; color: #6b7280;">Subtotal:</td>
                    <td style="padding: 15px 0; text-align: right; color: #1f2937;">₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #6b7280;">Delivery Fee:</td>
                    <td style="padding: 10px 0; text-align: right; color: #1f2937;">${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee.toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #DC2626;">
                    <td style="padding: 15px 0; font-weight: 700; color: #1f2937; font-size: 18px;">Total:</td>
                    <td style="padding: 15px 0; text-align: right; font-weight: 700; color: #DC2626; font-size: 18px;">₹${total.toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <div class="info-box">
            <div class="info-box-title">📍 Delivery Address</div>
            <div style="color: #4b5563; margin-top: 10px; line-height: 1.6;">
                ${deliveryAddress}
            </div>
        </div>

        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
                    border-radius: 12px; 
                    padding: 20px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #fecaca;">
            <div style="font-size: 16px; color: #991b1b; font-weight: 600; margin-bottom: 8px;">
                🕐 Scheduled Delivery
            </div>
            <div style="font-size: 20px; color: #DC2626; font-weight: 700; margin-bottom: 4px;">
                ${deliveryDate}
            </div>
            <div style="font-size: 24px; color: #DC2626; font-weight: 700;">
                ${deliverySlot}
            </div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 8px;">
                We'll notify you when your order is on the way!
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/track-order/${orderId}" class="button">
                Track Your Order
            </a>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <p style="margin-top: 20px;">
                <strong>What's Next?</strong><br>
                1️⃣ Our team is preparing your order<br>
                2️⃣ You'll receive updates as your order progresses<br>
                3️⃣ Delivery partner will be assigned shortly<br>
                4️⃣ Enjoy your fresh products!
            </p>
            
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                If you have any questions about your order, feel free to contact our support team.
            </p>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Order Confirmation - Quickart',
        content,
        footerText: 'Thank you for choosing Quickart for your daily needs! 🛒'
    });
};

export default orderConfirmationTemplate;

