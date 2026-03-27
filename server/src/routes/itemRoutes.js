import express from 'express'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import { saveItem, searchItems, getGraphData, getResurfacedItems, getTopicClusters, getItemById, deleteItem } from '../controllers/itemController.js'

const router = express.Router()

// Require Auth for all item routes
router.use(ClerkExpressRequireAuth())

// API Endpoints
router.post('/save', saveItem)
router.get('/search', searchItems)
router.get('/graph', getGraphData)
router.get('/resurface', getResurfacedItems)
router.get('/clusters', getTopicClusters)
router.get('/:id', getItemById)
router.delete('/:id', deleteItem)

export default router
