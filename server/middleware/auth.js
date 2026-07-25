import jwt from 'jsonwebtoken'

const auth = async(request,response,next)=>{
    try {
        console.log('=== Auth Middleware ===')
        console.log('Cookies:', request.cookies)
        console.log('Authorization header:', request.headers.authorization)
        
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1]
       
        if(!token){
            console.error('No token provided')
            return response.status(401).json({
                message : "Provide token",
                error : true,
                success : false
            })
        }

        console.log('Token found:', token.substring(0, 20) + '...')

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN)

        if(!decode){
            console.error('Token verification failed')
            return response.status(401).json({
                message : "unauthorized access",
                error : true,
                success : false
            })
        }

        console.log('Token decoded successfully:', { id: decode.id, iat: decode.iat, exp: decode.exp })
        request.userId = decode.id

        next()

    } catch (error) {
        console.error('=== Auth Middleware Error ===')
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return response.status(401).json({
                message : "Token expired. Please refresh your token.",
                error : true,
                success : false,
                tokenExpired: true
            })
        }
        
        if (error.name === 'JsonWebTokenError') {
            return response.status(401).json({
                message : "Invalid token",
                error : true,
                success : false
            })
        }
        
        return response.status(500).json({
            message : error.message || "Authentication error",
            error : true,
            success : false
        })
    }
}

export default auth