import { Router } from 'express'
import auth from '../middleware/auth.js'
import uploadImageController from '../controllers/uploadImage.controller.js'
import upload from '../middleware/multer.js'
import { rateLimitApi } from '../middleware/rateLimiter.js'

const uploadRouter = Router()

// Authenticated upload (for logged-in users)
uploadRouter.post("/upload",auth,upload.single("image"),uploadImageController)

// Public upload for rider registration documents (rate limited to prevent abuse)
// This allows riders to upload ID documents and selfies before they're registered
uploadRouter.post("/upload-public", rateLimitApi, upload.single("image"), uploadImageController)

export default uploadRouter