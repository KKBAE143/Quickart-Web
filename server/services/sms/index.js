import sendEmail from "../../config/sendEmail.js";

const smsProvider = {
  async sendOtp(mobile, text) {
    const echoEmail = process.env.SMS_DEV_ECHO_EMAIL;
    if (echoEmail) {
      await sendEmail({
        to: echoEmail,
        subject: `DEV OTP for ${mobile}`,
        html: `<p>Send to: ${mobile}</p><p>${text}</p>`
      });
    }
    console.log("DEV_SMS", { mobile, text });
    return { success: true };
  },
};

export default smsProvider;