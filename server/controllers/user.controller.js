import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import generatedAccessToken from '../utils/generatedAccessToken.js'
import genertedRefreshToken from '../utils/generatedRefreshToken.js'
import uploadImageClodinary from '../utils/uploadImageClodinary.js'
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'
import redis from '../config/upstash.js'
import mobileOtpTemplate from '../utils/mobileOtpTemplate.js'

export async function registerUserController(request,response){
    try {
        const { name, email , password } = request.body

        if(!name || !email || !password){
            return response.status(400).json({
                message : "provide email, name, password",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(user){
            return response.json({
                message : "Already register email",
                error : true,
                success : false
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password,salt)

        const payload = {
            name,
            email,
            password : hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()

        const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

        const verifyEmail = await sendEmail({
            sendTo : email,
            subject : "Verify your email - Quickart",
            html : verifyEmailTemplate({
                name,
                url : VerifyEmailUrl
            })
        })

        return response.json({
            message : "User register successfully",
            error : false,
            success : true,
            data : save
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function verifyEmailController(request,response){
    try {
        const { code } = request.body

        const user = await UserModel.findOne({ _id : code})

        if(!user){
            return response.status(400).json({
                message : "Invalid code",
                error : true,
                success : false
            })
        }

        const updateUser = await UserModel.updateOne({ _id : code },{
            verify_email : true
        })

        return response.json({
            message : "Verify email done",
            success : true,
            error : false
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : true
        })
    }
}

//login controller
export async function loginController(request,response){
    try {
        const { email , password } = request.body


        if(!email || !password){
            return response.status(400).json({
                message : "provide email, password",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "User not register",
                error : true,
                success : false
            })
        }

        if(user.status !== "Active"){
            return response.status(400).json({
                message : "Contact to Admin",
                error : true,
                success : false
            })
        }

        const checkPassword = await bcryptjs.compare(password,user.password)

        if(!checkPassword){
            return response.status(400).json({
                message : "Check your password",
                error : true,
                success : false
            })
        }

        const accesstoken = await generatedAccessToken(user._id, user.role)
        const refreshToken = await genertedRefreshToken(user._id)

        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date()
        })

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }
        response.cookie('accessToken',accesstoken,cookiesOption)
        response.cookie('refreshToken',refreshToken,cookiesOption)

        return response.json({
            message : "Login successfully",
            error : false,
            success : true,
            data : {
                accesstoken,
                refreshToken
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//logout controller
export async function logoutController(request,response){
    try {
        const userid = request.userId //middleware

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.clearCookie("accessToken",cookiesOption)
        response.clearCookie("refreshToken",cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
            refresh_token : ""
        })

        return response.json({
            message : "Logout successfully",
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//upload user avatar
export async  function uploadAvatar(request,response){
    try {
        const userId = request.userId // auth middlware
        const image = request.file  // multer middleware

        // Validate image file
        if (!image) {
            return response.status(400).json({
                message : "Please provide an image file",
                error : true,
                success : false
            })
        }

        console.log('📸 Uploading avatar for user:', userId);
        console.log('📁 File details:', {
            fieldname: image.fieldname,
            originalname: image.originalname,
            mimetype: image.mimetype,
            size: image.size
        });

        // Upload to Cloudinary
        const upload = await uploadImageClodinary(image)
        
        if (!upload || !upload.url) {
            throw new Error('Image upload failed - no URL returned from Cloudinary')
        }

        // Update user avatar in database
        const updateUser = await UserModel.findByIdAndUpdate(userId,{
            avatar : upload.url
        }, { new: true })

        console.log('✅ Avatar updated successfully:', upload.url);

        return response.json({
            message : "Profile picture uploaded successfully",
            success : true,
            error : false,
            data : {
                _id : userId,
                avatar : upload.url
            }
        })

    } catch (error) {
        console.error('❌ Upload avatar error:', error.message);
        
        // Check if it's a Cloudinary configuration error
        if (error.message && error.message.includes('credentials')) {
            return response.status(500).json({
                message : "Cloudinary is not configured. Please set up CLODINARY_CLOUD_NAME, CLODINARY_API_KEY, and CLODINARY_API_SECRET_KEY in server/.env",
                error : true,
                success : false
            })
        }

        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//update user details
export async function updateUserDetails(request,response){
    try {
        const userId = request.userId //auth middleware
        const { name, email, mobile, password } = request.body 

        let hashPassword = ""

        if(password){
            const salt = await bcryptjs.genSalt(10)
            hashPassword = await bcryptjs.hash(password,salt)
        }

        const updateUser = await UserModel.updateOne({ _id : userId},{
            ...(name && { name : name }),
            ...(email && { email : email }),
            ...(mobile && { mobile : mobile }),
            ...(password && { password : hashPassword })
        })

        return response.json({
            message : "Updated successfully",
            error : false,
            success : true,
            data : updateUser
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//forgot password not login
export async function forgotPasswordController(request,response) {
    try {
        const { email } = request.body 

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const otp = generatedOtp()
        const expireTime = new Date() + 60 * 60 * 1000 // 1hr

        const update = await UserModel.findByIdAndUpdate(user._id,{
            forgot_password_otp : otp,
            forgot_password_expiry : new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo : email,
            subject : "Password Reset OTP - Quickart",
            html : forgotPasswordTemplate({
                name : user.name,
                otp : otp
            })
        })

        return response.json({
            message : "check your email",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//verify forgot password otp
export async function verifyForgotPasswordOtp(request,response){
    try {
        const { email , otp }  = request.body

        if(!email || !otp){
            return response.status(400).json({
                message : "Provide required field email, otp.",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const currentTime = new Date().toISOString()

        if(user.forgot_password_expiry < currentTime  ){
            return response.status(400).json({
                message : "Otp is expired",
                error : true,
                success : false
            })
        }

        if(otp !== user.forgot_password_otp){
            return response.status(400).json({
                message : "Invalid otp",
                error : true,
                success : false
            })
        }

        //if otp is not expired
        //otp === user.forgot_password_otp

        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            forgot_password_otp : "",
            forgot_password_expiry : ""
        })
        
        return response.json({
            message : "Verify otp successfully",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//reset the password
export async function resetpassword(request,response){
    try {
        const { email , newPassword, confirmPassword } = request.body 

        if(!email || !newPassword || !confirmPassword){
            return response.status(400).json({
                message : "provide required fields email, newPassword, confirmPassword"
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email is not available",
                error : true,
                success : false
            })
        }

        if(newPassword !== confirmPassword){
            return response.status(400).json({
                message : "newPassword and confirmPassword must be same.",
                error : true,
                success : false,
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(newPassword,salt)

        const update = await UserModel.findOneAndUpdate(user._id,{
            password : hashPassword
        })

        return response.json({
            message : "Password updated successfully.",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


//refresh token controler
export async function refreshToken(request,response){
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1]  /// [ Bearer token]

        if(!refreshToken){
            return response.status(401).json({
                message : "Invalid token",
                error  : true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN)

        if(!verifyToken){
            return response.status(401).json({
                message : "token is expired",
                error : true,
                success : false
            })
        }

        // Handle both 'id' (agent tokens) and '_id' (user tokens)
        const userId = verifyToken?.id || verifyToken?._id

        // Look up the user to get their role
        const user = await UserModel.findById(userId)
        if (!user) {
            return response.status(401).json({
                message : "User not found",
                error : true,
                success : false
            })
        }

        // Generate new access token WITH role included
        const newAccessToken = jwt.sign(
            { 
                id: userId, 
                role: user.role 
            },
            process.env.SECRET_KEY_ACCESS_TOKEN,
            { expiresIn: '5h' }
        )

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message : "New Access token generated",
            error : false,
            success : true,
            data : {
                accessToken : newAccessToken
            }
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//get login user details
export async function userDetails(request,response){
    try {
        const userId  = request.userId

        console.log('=== User Details Request ===')
        console.log('User ID from auth middleware:', userId)
        console.log('User ID type:', typeof userId)
        console.log('Request headers:', request.headers)
        console.log('Cookies:', request.cookies)

        if (!userId) {
            console.error('ERROR: No userId provided from auth middleware')
            return response.status(401).json({
                message : 'User not authenticated',
                error : true,
                success : false
            })
        }

        const user = await UserModel.findById(userId).select('-password -refresh_token')

        console.log('User found:', user ? 'Yes' : 'No')
        if (user) {
            console.log('User details:', { id: user._id, name: user.name, email: user.email, role: user.role })
        }

        return response.json({
            message : 'user details',
            data : user,
            error : false,
            success : true
        })
    } catch (error) {
        console.error('=== UserDetails Error ===')
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        return response.status(500).json({
            message : error.message || "Something is wrong",
            error : true,
            success : false
        })
    }
}

export async function sendMobileOtpController(request,response){
    try {
        const { mobile, intent, email } = request.body

        if(!mobile){
            return response.status(400).json({
                message : "provide mobile",
                error : true,
                success : false
            })
        }

        const normalized = String(mobile).trim()
        if(!/^\d{10}$/.test(normalized)){
            return response.status(400).json({
                message : "provide valid 10 digit mobile",
                error : true,
                success : false
            })
        }

        const otp = generatedOtp()
        const ttlSec = 5 * 60

        if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN){
            await redis.set(`otp:mobile:${normalized}`, { otp, attempts: 0 }, { ex: ttlSec })
        }

        const user = await UserModel.findOne({ mobile: normalized })
        const expireTime = new Date(Date.now() + ttlSec * 1000).toISOString()
        if(user){
            await UserModel.findByIdAndUpdate(user._id, {
                mobile_otp : String(otp),
                mobile_otp_expiry : expireTime
            })
        }

        // Determine destination email
        const destinationEmail = user?.email || email
        if(!destinationEmail){
            return response.status(400).json({
                message : "No email available. Provide email to receive OTP.",
                error : true,
                success : false
            })
        }

        console.log('📧 Sending OTP to:', destinationEmail)
        console.log('🔢 OTP generated:', otp)

        const emailResult = await sendEmail({
            sendTo : destinationEmail,
            subject : "Your Quickart OTP",
            html : mobileOtpTemplate({ name: user?.name || '', otp, intent: intent || 'login' })
        })

        if (!emailResult.success) {
            console.error('❌ Email sending failed:', emailResult.error)
            return response.status(500).json({
                message : "Failed to send OTP email. Please try again.",
                error : true,
                success : false
            })
        }

        console.log('✅ OTP email sent successfully')

        return response.json({
            message : "OTP sent",
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function registerRiderController(request, response) {
    try {
        const { mobile, otp, name, email, password, vehicleType, vehicleNumber, vehicleModel, idType, idNumber, idDocumentImage, selfieImage } = request.body

        if (!mobile || !otp || !name || !email || !password) {
            return response.status(400).json({
                message: "Provide mobile, otp, name, email, and password",
                error: true,
                success: false
            })
        }

        if (password.length < 8) {
            return response.status(400).json({
                message: "Password must be at least 8 characters",
                error: true,
                success: false
            })
        }

        if (!vehicleType || !vehicleNumber || !idType || !idNumber) {
            return response.status(400).json({
                message: "Provide vehicle and ID details",
                error: true,
                success: false
            })
        }

        if (!idDocumentImage || !selfieImage) {
            return response.status(400).json({
                message: "Please upload ID document and selfie for verification",
                error: true,
                success: false
            })
        }

        const normalized = String(mobile).trim()
        let stored = null
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            stored = await redis.get(`otp:mobile:${normalized}`)
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({
            $or: [{ mobile: normalized }, { email: email }]
        })

        if (existingUser) {
            return response.status(400).json({
                message: "User with this mobile or email already exists",
                error: true,
                success: false
            })
        }

        // Validate OTP from Redis or allow in dev mode
        const nowIso = new Date().toISOString()
        const valid = stored?.otp && String(stored.otp) === String(otp)

        if (!valid && process.env.UPSTASH_REDIS_REST_URL) {
            return response.status(400).json({
                message: "Invalid or expired OTP",
                error: true,
                success: false
            })
        }

        // Create the rider user with DELIVERY_AGENT role using provided password
        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password, salt)

        const newRider = await UserModel.create({
            name: name,
            email: email,
            password: hashPassword,
            mobile: normalized,
            is_mobile_verified: true,
            role: 'DELIVERY_AGENT',
            status: 'Inactive', // Requires admin approval
            agentProfile: {
                vehicle: {
                    type: vehicleType,
                    number: vehicleNumber,
                    model: vehicleModel || ""
                },
                documents: {
                    idType: idType,
                    idNumber: idNumber,
                    idDocumentImage: idDocumentImage,
                    selfieImage: selfieImage,
                    verificationStatus: 'PENDING',
                    submittedAt: new Date()
                },
                backgroundCheck: {
                    status: 'PENDING'
                }
            }
        })

        // Clean up OTP from Redis
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            await redis.del(`otp:mobile:${normalized}`)
        }

        return response.json({
            message: "Rider registration submitted successfully. Your application is pending approval.",
            error: false,
            success: true,
            data: {
                _id: newRider._id,
                name: newRider.name,
                email: newRider.email,
                status: newRider.status
            }
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function verifyMobileOtpController(request,response){
    try {
        const { mobile, otp, name, email, password } = request.body

        console.log('🔐 Verify OTP request:', { mobile, otp, name, email, hasPassword: !!password })

        if(!mobile || !otp){
            return response.status(400).json({
                message : "provide mobile, otp",
                error : true,
                success : false
            })
        }

        const normalized = String(mobile).trim()
        const ttlSec = 5 * 60
        let stored = null
        if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN){
            stored = await redis.get(`otp:mobile:${normalized}`)
            console.log('📦 Redis stored OTP:', stored)
        }

        if(!stored && !process.env.UPSTASH_REDIS_REST_URL){
            // Dev mode fallback: accept any otp that matches DB
        }

        const user = await UserModel.findOne({ mobile: normalized })
        console.log('👤 Existing user found:', user ? user._id : 'No')

        const nowIso = new Date().toISOString()
        const dbOtp = user?.mobile_otp
        const dbExp = user?.mobile_otp_expiry

        const valid = (stored?.otp && String(stored.otp) === String(otp)) || (dbOtp && String(dbOtp) === String(otp) && dbExp && dbExp > nowIso)

        if(!valid){
            console.log('❌ OTP validation failed:', { stored, dbOtp, providedOtp: otp })
            return response.status(400).json({
                message : "Invalid or expired OTP",
                error : true,
                success : false
            })
        }

        console.log('✅ OTP validated successfully')

        let targetUser = user
        if(!targetUser){
            console.log('🆕 Creating new user...')

            // Use user-provided password or generate random one
            let userPassword = password
            if (!userPassword) {
                userPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
                console.log('⚠️ No password provided, generated random password')
            } else if (userPassword.length < 8) {
                return response.status(400).json({
                    message : "Password must be at least 8 characters",
                    error : true,
                    success : false
                })
            }

            const salt = await bcryptjs.genSalt(10)
            const hashPassword = await bcryptjs.hash(userPassword, salt)

            // Check if email already exists (case-insensitive)
            if (email) {
                const normalizedEmail = email.toLowerCase().trim()
                const existingEmailUser = await UserModel.findOne({
                    email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
                })
                console.log('📧 Email check:', {
                    inputEmail: email,
                    normalizedEmail,
                    found: existingEmailUser ? existingEmailUser._id : null,
                    foundEmail: existingEmailUser?.email,
                    foundMobile: existingEmailUser?.mobile
                })
                if (existingEmailUser) {
                    return response.status(400).json({
                        message : `Email already registered (found user with mobile: ${existingEmailUser.mobile}). Please use a different email or login.`,
                        error : true,
                        success : false
                    })
                }
            }

            targetUser = await UserModel.create({
                name : name || "",
                email : email || undefined, // Use undefined instead of null to avoid unique constraint issues
                password : hashPassword,
                mobile : normalized,
                is_mobile_verified : true
            })
            console.log('✅ New user created:', targetUser._id)
        } else {
            console.log('🔄 Updating existing user...')
            await UserModel.findByIdAndUpdate(targetUser._id, {
                is_mobile_verified : true,
                mobile_otp : "",
                mobile_otp_expiry : "",
                last_login_date : new Date()
            })
        }

        if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN){
            await redis.del(`otp:mobile:${normalized}`)
        }

        const accesstoken = await generatedAccessToken(targetUser._id, targetUser.role || 'USER')
        const refreshToken = await genertedRefreshToken(targetUser._id)
        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }
        response.cookie('accessToken',accesstoken,cookiesOption)
        response.cookie('refreshToken',refreshToken,cookiesOption)

        console.log('🎉 User verified and logged in:', targetUser._id)

        return response.json({
            message : "Mobile verified",
            error : false,
            success : true,
            data : { accesstoken, refreshToken }
        })
    } catch (error) {
        console.error('❌ Verify OTP error:', error)
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}