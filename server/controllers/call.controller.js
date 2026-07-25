import OrderModel from "../models/order.model.js"
import UserModel from "../models/user.model.js"
import voiceProvider from "../services/voice/index.js"
import redis from "../config/upstash.js"

export async function bridgeCallController(request,response){
  try {
    const { orderId } = request.body
    if(!orderId){
      return response.status(400).json({ message: 'provide orderId', error: true, success: false })
    }
    const order = await OrderModel.findOne({ orderId })
    if(!order){
      return response.status(404).json({ message: 'Order not found', error: true, success: false })
    }
    const user = await UserModel.findById(order.userId)
    const userMobile = user?.mobile
    const riderMobile = order?.delivery_partner?.phone
    const virtualNumber = process.env.CALL_VIRTUAL_NUMBER || ''
    if(!userMobile || !riderMobile || !virtualNumber){
      return response.status(400).json({ message: 'Missing numbers to bridge', error: true, success: false })
    }
    // Concurrency control
    if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN){
      const existing = await redis.get(`activeCall:${orderId}`)
      if(existing){
        return response.status(409).json({ message: 'Another call active for this order', error: true, success: false })
      }
      await redis.set(`activeCall:${orderId}`, { startedAt: Date.now() }, { ex: 15 * 60 })
    }
    const result = await voiceProvider.bridgeCall({ virtualNumber, from: userMobile, to: riderMobile })
    return response.json({ message: 'Call bridged (dev)', error: false, success: true, data: result })
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false })
  }
}

export async function endActiveCallController(request,response){
  try {
    const { orderId } = request.body
    if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN){
      await redis.del(`activeCall:${orderId}`)
    }
    return response.json({ message: 'Call ended', error: false, success: true })
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false })
  }
}