import { Router } from 'express'
import auth from '../middleware/auth.js'
import { rateLimitApi } from '../middleware/rateLimiter.js'
import { bridgeCallController, endActiveCallController } from '../controllers/call.controller.js'

const callRouter = Router()

callRouter.post('/bridge', auth, rateLimitApi, bridgeCallController)
callRouter.post('/end', auth, rateLimitApi, endActiveCallController)

export default callRouter