import express from 'express'
import { getPublicCollection } from '../controllers/publicController.js'

const router = express.Router()

// Unauthenticated public sharing endpoint
router.get('/collections/:id', getPublicCollection)

export default router
