import express from 'express';
import { createItem, getItems, searchItems, resurfaceItems, getGraphData, getRelatedItems } from '../controllers/item.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createItem);
router.get('/', getItems);
router.get('/search', searchItems);
router.get('/resurface', resurfaceItems);
router.get('/graph', getGraphData);
router.get('/:id/related', getRelatedItems);

export default router;
