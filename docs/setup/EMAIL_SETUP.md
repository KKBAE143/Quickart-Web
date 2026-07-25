# 📧 Email Configuration Guide - Resend

## ✅ Status: Email Working!

Your Resend email service is now configured and working correctly.

## 🧪 Testing

To test your email configuration anytime:

```bash
cd server
node test-email.js
```

This will send a test email to `quick.kart.app@gmail.com`.

## 📨 Current Configuration

### Sender Email
Currently using: **`noreply@askify.in`** (VERIFIED DOMAIN ✅)
- ✅ Your custom verified domain
- ✅ Professional sender address
- ✅ No "via resend.dev" in headers
- ✅ Better email deliverability

### Location
File: `server/config/sendEmail.js`

```javascript
from: 'Quickart <noreply@askify.in>'
```

## 🏢 Using Your Own Domain (Production)

For production, you'll want to use your own domain like `noreply@quickart.com`.

### Steps:

1. **Go to Resend Dashboard**
   - Visit: https://resend.com/domains
   - Click "Add Domain"

2. **Add Your Domain**
   - Enter your domain (e.g., `quickart.com`)
   - Click "Add"

3. **Verify Domain**
   - Resend will provide DNS records
   - Add these records to your domain DNS settings:
     - SPF record
     - DKIM record
     - Return-Path record

4. **Wait for Verification**
   - Usually takes 5-30 minutes
   - Resend will verify automatically

5. **Update Code**
   - Update `server/config/sendEmail.js`:
   ```javascript
   from: 'Quickart <noreply@quickart.com>'
   ```

## 🎯 Email Templates in Your App

Your app has two email templates:

### 1. Email Verification
**File:** `server/utils/verifyEmailTemplate.js`
- Sent when users register
- Contains verification code

### 2. Password Reset
**File:** `server/utils/forgotPasswordTemplate.js`
- Sent when users forget password
- Contains reset code

Both templates automatically use the configured sender email from `sendEmail.js`.

## 🔧 API Key Management

### Current API Key
Your API key is stored in `server/.env`:
```
RESEND_API=re_6QbLu8Ga_M1D8W8BLT2U7M7XCGPk1Rgxe
```

### Getting a New API Key
1. Go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Name it (e.g., "Quickart Production")
4. Select permissions:
   - ✅ Sending access (required)
   - ✅ Full access (recommended)
5. Copy the key
6. Update in `server/.env`

### API Key Limits (Free Tier)
- 📧 **3,000 emails/month**
- 📊 **100 emails/day**
- ⏱️ No rate limits
- ✅ All features included

## 📊 Monitoring Emails

### View Sent Emails
1. Go to: https://resend.com/emails
2. See all sent emails
3. Check delivery status
4. View email content
5. See open/click rates

### Webhook Events (Optional)
You can set up webhooks to track:
- Email delivered
- Email opened
- Email clicked
- Email bounced
- Email complained (spam)

## 🚨 Troubleshooting

### Email Not Received

1. **Check Spam Folder**
   - Emails from `onboarding@resend.dev` might go to spam
   - Mark as "Not Spam" to train your email client

2. **Check Email ID**
   - Every sent email gets an ID
   - Check in Resend dashboard: https://resend.com/emails
   - Search by email ID to see delivery status

3. **Verify API Key**
   ```bash
   cd server
   node test-email.js
   ```
   - Should show success message
   - Check console for errors

4. **Check Rate Limits**
   - Free tier: 100 emails/day
   - Check dashboard for usage

### Common Errors

**Error: Invalid API Key**
- Check `server/.env` has correct key
- Key should start with `re_`
- No extra spaces or quotes

**Error: Domain not verified**
- You're trying to send from custom domain
- Either verify domain in Resend
- Or use `onboarding@resend.dev` for testing

**Error: Rate limit exceeded**
- You've hit daily/monthly limit
- Wait 24 hours or upgrade plan

## 🧪 Testing in Development

### Quick Test Script
The `test-email.js` script sends a test email:

```bash
cd server
node test-email.js
```

### Testing User Registration
1. Start the server: `npm run dev`
2. Register a new user
3. Check email for verification code
4. Check server console for:
   ```
   Email sent successfully: <email_id>
   ```

### Testing Password Reset
1. Go to forgot password page
2. Enter your email
3. Check email for reset code
4. Check server console for confirmation

## 📝 Email Best Practices

### Subject Lines
- Keep under 50 characters
- Be clear and specific
- Avoid spam words (FREE, URGENT, etc.)

### Content
- Use HTML for formatting
- Include plain text alternative
- Test on multiple email clients
- Make responsive for mobile

### Sender Name
- Use recognizable name: "Quickart"
- Include purpose: "Quickart Security" for password reset
- Be consistent across all emails

### Unsubscribe Link
For marketing emails, include unsubscribe link:
```html
<a href="{{unsubscribe_url}}">Unsubscribe</a>
```

## 🔒 Security

### Protect Your API Key
- ✅ Keep in `.env` file (not committed to git)
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically
- ❌ Never expose in client-side code
- ❌ Never commit to public repositories

### Email Verification
Your app already implements:
- ✅ Email verification on signup
- ✅ One-time verification codes
- ✅ Expiring codes
- ✅ Rate limiting

## 📈 Upgrading Resend

### Free Tier (Current)
- 3,000 emails/month
- 100 emails/day
- All features

### Pro Tier ($20/month)
- 50,000 emails/month
- Unlimited daily sends
- Priority support
- Custom IP address
- Email analytics

### Enterprise
- Contact sales
- Custom volume
- Dedicated IP
- SLA guarantees

## 🎯 Summary

✅ **Email is working!**
- API Key configured correctly
- Test email sent successfully
- Using `onboarding@resend.dev` for development
- Ready to send verification and reset emails

📧 **Test anytime with:**
```bash
cd server && node test-email.js
```

🏢 **For production:**
- Verify your own domain at https://resend.com/domains
- Update sender email in `server/config/sendEmail.js`
- Test thoroughly before going live

---

**Next Steps:**
1. ✅ Email configuration complete
2. ⏳ (Optional) Add custom domain for production
3. ⏳ Test user registration flow
4. ⏳ Test password reset flow

Need help? Check the test script output or Resend dashboard!

