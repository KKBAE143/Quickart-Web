const forgotPasswordTemplate = ({ name, otp })=>{
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Quickart</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin-bottom: 10px;">QUICKART</div>
                            <div style="color: #ffffff; font-size: 14px; opacity: 0.95;">🚀 Fresh & Fast Delivery</div>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">🔐 Password Reset Request</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Dear ${name},</p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                You've requested to reset your password. Please use the following OTP (One-Time Password) code to proceed:
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 3px solid #DC2626; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                                <div style="color: #991b1b; font-size: 14px; font-weight: 600; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">
                                    Your OTP Code
                                </div>
                                <div style="font-size: 48px; font-weight: 800; color: #DC2626; letter-spacing: 8px; margin: 15px 0;">
                                    ${otp}
                                </div>
                                <div style="color: #991b1b; font-size: 13px; margin-top: 15px;">
                                    Valid for 1 hour
                                </div>
                            </div>
                            
                            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                                    <strong>⚠️ Important:</strong> This OTP is valid for 1 hour only. Enter this code on the Quickart website to proceed with resetting your password.
                                </p>
                            </div>
                            
                            <div style="background-color: #fef2f2; border-left: 4px solid #DC2626; padding: 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.6;">
                                    <strong>Security Alert:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately. Your account security is important to us.
                                </p>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                                Need help? Our support team is available 24/7 to assist you.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
                                Stay secure with Quickart! 🔒
                            </p>
                            <p style="color: #9ca3af; font-size: 13px; margin: 15px 0;">
                                Need help? Contact us at <a href="mailto:support@quickart.com" style="color: #DC2626; text-decoration: none;">support@quickart.com</a><br>
                                or call us at <a href="tel:+918888888888" style="color: #DC2626; text-decoration: none;">+91 88888 88888</a>
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
                                © ${new Date().getFullYear()} Quickart. All rights reserved.<br>
                                This is an automated email, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
}

export default forgotPasswordTemplate