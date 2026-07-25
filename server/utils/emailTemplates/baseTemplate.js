/**
 * Base Email Template for Quickart
 * Provides consistent branding and structure for all email notifications
 */

const baseEmailTemplate = ({ title, content, footerText = 'Thank you for choosing Quickart!' }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-decoration: none;
            letter-spacing: 1px;
        }
        .tagline {
            color: #ffffff;
            font-size: 14px;
            margin-top: 8px;
            opacity: 0.95;
        }
        .email-body {
            padding: 40px 30px;
        }
        .email-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .email-content {
            font-size: 15px;
            color: #4b5563;
            line-height: 1.8;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
        }
        .button:hover {
            box-shadow: 0 6px 12px rgba(220, 38, 38, 0.4);
            transform: translateY(-2px);
        }
        .info-box {
            background-color: #fef2f2;
            border-left: 4px solid #DC2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box-title {
            font-weight: 600;
            color: #DC2626;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 30px 0;
        }
        .email-footer {
            background-color: #f9fafb;
            padding: 30px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #DC2626;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        .contact-info {
            font-size: 13px;
            color: #9ca3af;
            margin-top: 20px;
        }
        .contact-info a {
            color: #DC2626;
            text-decoration: none;
        }
        .copyright {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            .email-title {
                font-size: 20px;
            }
            .button {
                display: block;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="logo">QUICKART</div>
            <div class="tagline">🚀 Fresh & Fast Delivery</div>
        </div>

        <!-- Body -->
        <div class="email-body">
            ${content}
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <div class="footer-text">
                ${footerText}
            </div>
            
            <div class="social-links">
                <a href="#" class="social-link">Facebook</a> |
                <a href="#" class="social-link">Instagram</a> |
                <a href="#" class="social-link">Twitter</a>
            </div>

            <div class="divider"></div>

            <div class="contact-info">
                Need help? Contact us at <a href="mailto:support@quickart.com">support@quickart.com</a><br>
                or call us at <a href="tel:+918888888888">+91 88888 88888</a>
            </div>

            <div class="copyright">
                © ${new Date().getFullYear()} Quickart. All rights reserved.<br>
                This is an automated email, please do not reply.
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

export default baseEmailTemplate;

