// Test email sending with Resend
// Run this with: cd server && node test-email.js

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API);

async function testEmail() {
    console.log('\n🔍 Testing Resend Email Configuration...\n');
    
    // Check if API key is loaded
    if (!process.env.RESEND_API) {
        console.error('❌ ERROR: RESEND_API not found in .env file');
        console.log('   Make sure you have set RESEND_API=your_api_key in server/.env');
        process.exit(1);
    }
    
    console.log('✅ API Key found:', process.env.RESEND_API.substring(0, 10) + '...');
    console.log('📧 Sending test email...\n');

    try {
        // Send test email using verified custom domain
        const { data, error } = await resend.emails.send({
            from: 'Quickart <noreply@askify.in>', // Your verified domain
            to: 'quick.kart.app@gmail.com',
            subject: '✅ Test Email from Quickart',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>🎉 Email Configuration Success!</h2>
                    <p>Congrats! Your Resend email configuration is working correctly with your verified domain (askify.in).</p>
                    <p>You can now send emails from your Quickart application.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is a test email sent at ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('❌ Error sending email:');
            console.error(JSON.stringify(error, null, 2));
            
            console.log('\n💡 Common solutions:');
            console.log('   - Make sure your API key is correct');
            console.log('   - Check if your API key has send permissions');
            console.log('   - Verify your account at resend.com');
            process.exit(1);
        }

        console.log('✅ Email sent successfully!');
        console.log('📬 Email ID:', data.id);
        console.log('\n📝 Next steps:');
        console.log('   1. Check your inbox: quick.kart.app@gmail.com');
        console.log('   2. Check spam folder if not in inbox');
        console.log('   3. Email from "noreply@askify.in" should arrive within seconds');
        console.log('\n✅ Your custom domain (askify.in) is verified and working!');
        console.log('\n✨ All good! Your email service is ready.\n');

    } catch (error) {
        console.error('❌ Unexpected error:');
        console.error(error.message);
        console.log('\n💡 Common issues:');
        console.log('   - Invalid API key format');
        console.log('   - Network connectivity issues');
        console.log('   - Resend service temporarily unavailable');
        process.exit(1);
    }
}

testEmail();

