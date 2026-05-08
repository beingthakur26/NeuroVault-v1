import express from 'express';
import { createItem, getItems, searchItems, resurfaceItems, getGraphData, getRelatedItems, markReviewed, updateItemCollection, addHighlight } from '../controllers/item.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createItem);
router.get('/', getItems);
router.get('/search', searchItems);
router.get('/resurface', resurfaceItems);
router.post('/:id/review', markReviewed);
router.get('/graph', getGraphData);
router.get('/:id/related', getRelatedItems);
router.put('/:id/collection', updateItemCollection);
router.post('/:id/highlights', addHighlight);

export default router;
