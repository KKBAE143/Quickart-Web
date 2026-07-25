const verifyEmailTemplate = ({name,url})=>{
    return`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Quickart</title>
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
                            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">Welcome to Quickart! 🎉</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Dear ${name},</p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                Thank you for registering with Quickart! We're excited to have you on board. To complete your registration and start enjoying fresh products with lightning-fast delivery, please verify your email address.
                            </p>
                            
                            <!-- Verification Button -->
                            <table role="presentation" style="margin: 35px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                                            ✉️ Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #fef2f2; border-left: 4px solid #DC2626; padding: 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.6;">
                                    <strong>Security Note:</strong> If you didn't create an account with Quickart, please ignore this email. Your email address will not be used without verification.
                                </p>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                                If the button above doesn't work, copy and paste this link into your browser:<br>
                                <a href="${url}" style="color: #DC2626; word-break: break-all;">${url}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
                                Thank you for choosing Quickart! 🛒
                            </p>
                            <p style="color: #9ca3af; font-size: 13px; margin: 15px 0;">
                                Need help? Contact us at <a href="mailto:support@quickart.com" style="color: #DC2626; text-decoration: none;">support@quickart.com</a>
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
                                © ${new Date().getFullYear()} Quickart. All rights reserved.
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

export default verifyEmailTemplate