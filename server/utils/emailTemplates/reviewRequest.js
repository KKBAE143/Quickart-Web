import baseEmailTemplate from './baseTemplate.js';

/**
 * Review Request Email Template
 * Sent after order is delivered
 */
export function reviewRequestTemplate(orderDetails) {
    const { userName, orderNumber, productName, productImage, deliveredDate, reviewLink } = orderDetails;

    const emailBody = `
        <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #DC2626; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">
                How was your experience?
            </h1>
            <p style="color: #666; font-size: 16px; margin: 0;">
                We'd love to hear your feedback!
            </p>
        </div>

        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; font-size: 16px;">
                🎉 Your order was delivered on <strong>${deliveredDate}</strong>
            </p>
        </div>

        <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 30px 0;">
            <div style="display: flex; align-items: center; gap: 20px;">
                ${productImage ? `
                    <div style="flex-shrink: 0;">
                        <img src="${productImage}" alt="${productName}" 
                             style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #DC2626;">
                    </div>
                ` : ''}
                <div style="flex: 1;">
                    <h3 style="color: #1F2937; margin: 0 0 8px 0; font-size: 18px;">${productName}</h3>
                    <p style="color: #6B7280; margin: 0; font-size: 14px;">
                        Order #${orderNumber}
                    </p>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
                Rate your purchase
            </p>
            <div style="font-size: 40px; margin: 0 0 30px 0;">
                ⭐ ⭐ ⭐ ⭐ ⭐
            </div>
            <a href="${reviewLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); 
                      color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                      transition: all 0.3s ease;">
                Write a Review
            </a>
        </div>

        <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #991B1B; margin: 0 0 10px 0; font-weight: 600; font-size: 16px;">
                💡 Why review matters:
            </p>
            <ul style="color: #7F1D1D; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Help other customers make informed decisions</li>
                <li style="margin-bottom: 8px;">Share your experience with the community</li>
                <li style="margin-bottom: 8px;">Your feedback helps us improve</li>
                <li>Get featured as a verified buyer</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #F3F4F6; border-radius: 8px;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 15px 0;">
                You can also upload photos/videos with your review!
            </p>
            <p style="color: #374151; font-size: 16px; margin: 0; font-weight: 600;">
                📸 Photo reviews get more helpful votes
            </p>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #E5E7EB; margin-top: 40px;">
            <p style="color: #9CA3AF; font-size: 14px; margin: 0;">
                This is a one-time email. You won't receive repeated review requests.
            </p>
        </div>
    `;

    return baseEmailTemplate({ 
        title: 'Share Your Feedback - Quickart', 
        content: emailBody,
        footerText: 'Thank you for shopping with Quickart!'
    });
}

