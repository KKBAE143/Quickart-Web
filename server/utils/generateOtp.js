// Generate 6-digit OTP
function generateOtp() {
    // Generate random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
}

export default generateOtp;

