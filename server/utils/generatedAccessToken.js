import jwt from 'jsonwebtoken'

const generatedAccessToken = async(userId, role = null)=>{
    const payload = { id : userId }
    if (role) {
        payload.role = role
    }
    const token = await jwt.sign(payload,
        process.env.SECRET_KEY_ACCESS_TOKEN,
        { expiresIn : '5h'}
    )

    return token
}

export default generatedAccessToken
