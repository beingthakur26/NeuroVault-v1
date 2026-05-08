import multer from 'multer';
// import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Item from '../models/Item.js';
import { generateSummaryAndTags, generateEmbedding } from '../services/ai.service.js';
import { upsertVector } from '../services/vector.service.js';


// Setup local storage for MVP
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
});

export const uploadFile = [
  upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const userId = req.auth.userId;
      const fileUrl = `/uploads/${file.filename}`;
      
      let content = 'Media file';
      let type = 'document';

      // Parse PDF (Temporarily Disabled due to native dependency issues)
      if (file.mimetype === 'application/pdf') {
        content = 'PDF Document (Text extraction disabled)';
      } else if (file.mimetype.startsWith('image/')) {
        type = 'image';
      } else {
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      // Pre-emptive deduplication via content hash if we extracted text
      let hash = null;
      if (content.length > 50) {
        hash = crypto.createHash('md5').update(content).digest('hex');
        const duplicate = await Item.findOne({ userId, contentHash: hash });
        if (duplicate) {
          // Clean up the uploaded file since it's a duplicate
          fs.unlinkSync(file.path);
          return res.status(409).json({ message: 'Duplicate document detected', itemId: duplicate._id });
        }
      }

      // Create initial DB entry
      const newItem = new Item({
        userId,
        title: file.originalname,
        content: content.substring(0, 500) + '...',
        url: fileUrl, // Local path relative
        type,
        status: 'processing',
        contentHash: hash
      });

      await newItem.save();

      // Background processing for AI directly here (since file payloads aren't great for Redis queues immediately, or we just process synchronously for now)
      processFileAsynchronously(newItem._id, content, userId, file.originalname, fileUrl);

      res.status(201).json(newItem);

    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  }
];

// Async background processing for extracting embeddings so we don't block the request
const processFileAsynchronously = async (itemId, fullContent, userId, title, url) => {
  try {
    const item = await Item.findById(itemId);
    if (!item) return;

    if (fullContent.length > 50) {
      const { summary, tags } = await generateSummaryAndTags(fullContent);
      const embedding = await generateEmbedding(fullContent);

      if (embedding?.length > 0) {
        await upsertVector(itemId, embedding, { title, url, userId });
      }

      item.summary = summary;
      item.tags = tags;
      item.embedding = embedding;
    }

    item.status = 'completed';
    await item.save();
  } catch (err) {
    console.error(`Async processing failed for item ${itemId}:`, err);
    await Item.findByIdAndUpdate(itemId, { status: 'failed' });
  }
};
