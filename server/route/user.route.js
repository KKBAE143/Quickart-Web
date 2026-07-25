import { Router } from 'express'
import { forgotPasswordController, loginController, logoutController, refreshToken, registerUserController, resetpassword, updateUserDetails, uploadAvatar, userDetails, verifyEmailController, verifyForgotPasswordOtp, sendMobileOtpController, verifyMobileOtpController, registerRiderController } from '../controllers/user.controller.js'
import auth from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { rateLimitAuth, rateLimitEmail, rateLimitApi } from '../middleware/rateLimiter.js'

const userRouter = Router()

// Authentication routes - Strict rate limiting to prevent brute force
userRouter.post('/register', rateLimitAuth, registerUserController)
userRouter.post('/verify-email', rateLimitEmail, verifyEmailController)
userRouter.post('/login', rateLimitAuth, loginController)
userRouter.post('/send-otp', rateLimitEmail, sendMobileOtpController)
userRouter.post('/verify-otp', rateLimitAuth, verifyMobileOtpController)
userRouter.post('/register-rider', rateLimitAuth, registerRiderController)
userRouter.get('/logout', auth, logoutController)

// Profile routes - General rate limiting
userRouter.put('/upload-avatar', auth, rateLimitApi, upload.single('avatar'), uploadAvatar)
userRouter.put('/update-user', auth, rateLimitApi, updateUserDetails)

// Password reset routes - Email rate limiting to prevent spam
userRouter.put('/forgot-password', rateLimitEmail, forgotPasswordController)
userRouter.put('/verify-forgot-password-otp', rateLimitEmail, verifyForgotPasswordOtp)
userRouter.put('/reset-password', rateLimitAuth, resetpassword)

// Token and user details - General rate limiting
userRouter.post('/refresh-token', rateLimitApi, refreshToken)
userRouter.get('/user-details', auth, rateLimitApi, userDetails)




export default userRouter