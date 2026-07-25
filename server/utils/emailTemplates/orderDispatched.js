import baseEmailTemplate from './baseTemplate.js';

/**
 * Order Dispatched Email Template
 * Sent when order is packed and ready for delivery
 */
const orderDispatchedTemplate = ({ 
    customerName, 
    orderId,
    items,
    total,
    deliveryAddress,
    deliverySlot,
    deliveryDate
}) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsList = items.map(item => `
        <li style="padding: 8px 0; color: #4b5563;">
            <span style="font-weight: 600; color: #1f2937;">${item.name}</span> 
            <span style="color: #6b7280;">× ${item.quantity}</span>
        </li>
    `).join('');

    const content = `
        <div class="email-title">📦 Your Order is Packed & Ready!</div>
        
        <div class="email-content">
            <p>Dear ${customerName},</p>
            <p>Great news! Your order has been carefully packed and is ready for dispatch. A delivery partner will be assigned shortly.</p>
        </div>

        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
                    border-radius: 12px; 
                    padding: 25px; 
                    text-align: center; 
                    margin: 25px 0;
                    border: 2px solid #fecaca;">
            <div style="font-size: 48px; margin-bottom: 15px;">📦</div>
            <div style="font-size: 20px; color: #DC2626; font-weight: 700; margin-bottom: 10px;">
                Order Packed Successfully!
            </div>
            <div style="font-size: 14px; color: #6b7280;">
                Order ID: <span style="font-weight: 600; color: #DC2626;">${orderId}</span>
            </div>
        </div>

        <div class="info-box">
            <div class="info-box-title">📋 Order Summary</div>
            <ul style="list-style: none; padding: 0; margin: 15px 0 0 0;">
                ${itemsList}
            </ul>
            <div style="border-top: 2px solid #DC2626; margin-top: 15px; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #1f2937; font-size: 16px;">Total Items:</span>
                    <span style="font-weight: 700; color: #DC2626; font-size: 16px;">${itemCount}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="font-weight: 600; color: #1f2937; font-size: 18px;">Total Amount:</span>
                    <span style="font-weight: 700; color: #DC2626; font-size: 18px;">₹${total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div class="info-box">
            <div class="info-box-title">📍 Delivery Location</div>
            <div style="color: #4b5563; margin-top: 10px; line-height: 1.6;">
                ${deliveryAddress}
            </div>
        </div>

        <div style="background-color: #f0fdf4; 
                    border-left: 4px solid #10b981;
                    border-radius: 4px;
                    padding: 20px; 
                    margin: 25px 0;">
            <div style="font-weight: 600; color: #059669; margin-bottom: 10px; font-size: 16px;">
                🕐 Scheduled Delivery Slot
            </div>
            <div style="font-size: 18px; color: #047857; font-weight: 700; margin-bottom: 4px;">
                ${deliveryDate}
            </div>
            <div style="font-size: 22px; color: #047857; font-weight: 700; margin-bottom: 8px;">
                ${deliverySlot}
            </div>
            <div style="font-size: 14px; color: #6b7280;">
                We'll notify you once a delivery partner picks up your order!
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/myorders" class="button">
                Track Order Status
            </a>
        </div>

        <div class="divider"></div>

        <div class="email-content">
            <p style="margin-top: 20px;">
                <strong>Next Steps:</strong><br>
                ✅ Order packed and quality checked<br>
                🚴 Waiting for delivery partner assignment<br>
                📲 You'll get notified when out for delivery<br>
                🏠 Delivered to your doorstep
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/track-order/${orderId}" class="button">
                Track Your Order
            </a>
            <p style="margin-top: 15px; font-size: 13px; color: #6b7280;">
                Track your order in real-time and get live updates!
            </p>
        </div>
    `;

    return baseEmailTemplate({
        title: 'Order Dispatched - Quickart',
        content,
        footerText: 'Your satisfaction is our priority! 🎯'
    });
};

export default orderDispatchedTemplate;

