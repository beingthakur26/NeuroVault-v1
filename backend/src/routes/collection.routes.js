import express from 'express';
import { createCollection, getCollections, deleteCollection } from '../controllers/collection.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createCollection);
router.get('/', getCollections);
router.delete('/:id', deleteCollection);

export default router;
