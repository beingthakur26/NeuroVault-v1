import express from 'express';
import { uploadFile } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, uploadFile);

export default router;
