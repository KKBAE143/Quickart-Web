import { Resend } from 'resend';
import dotenv from 'dotenv'
dotenv.config()

if(!process.env.RESEND_API){
    console.log("Provide RESEND_API in side the .env file")
}

const resend = new Resend(process.env.RESEND_API);

const sendEmail = async({sendTo, subject, html })=>{
    try {
        const { data, error } = await resend.emails.send({
            // Using verified custom domain askify.in
            from: 'Quickart <noreply@askify.in>',
            to: sendTo,
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Email sending error:', error);
            return { success: false, error };
        }

        console.log('Email sent successfully:', data.id);
        return { success: true, data };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
}

export default sendEmail

