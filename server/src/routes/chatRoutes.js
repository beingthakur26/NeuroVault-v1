import express from 'express'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import { handleChatStream } from '../controllers/chatController.js'

const router = express.Router()

// Web interface continuous chat streams mapped specifically to context
router.post('/stream', ClerkExpressRequireAuth(), handleChatStream)

export default router
