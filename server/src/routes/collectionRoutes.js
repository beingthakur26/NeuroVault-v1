import express from 'express'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import { createCollection, getCollections, deleteCollection, addItemToCollection } from '../controllers/collectionController.js'

const router = express.Router()

// Require Auth for all collection routes
router.use(ClerkExpressRequireAuth())

router.post('/', createCollection)
router.get('/', getCollections)
router.delete('/:id', deleteCollection)
router.post('/:id/items', addItemToCollection)

export default router
