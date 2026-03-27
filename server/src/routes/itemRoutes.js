import express from 'express'
import multer from 'multer'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import { uploadItemImage, saveItem, searchItems, getGraphData, getResurfacedItems, getTopicClusters, getItemById, updateItemContent, deleteItem } from '../controllers/itemController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Require Auth for all item routes
router.use(ClerkExpressRequireAuth())

// API Endpoints
router.post('/upload', upload.single('image'), uploadItemImage)
router.post('/save', saveItem)
router.get('/search', searchItems)
router.get('/graph', getGraphData)
router.get('/resurface', getResurfacedItems)
router.get('/clusters', getTopicClusters)
router.get('/:id', getItemById)
router.patch('/:id/content', updateItemContent)
router.delete('/:id', deleteItem)

export default router
