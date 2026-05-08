import axios from 'axios';
import Item from '../models/Item.js';
import { addItemToQueue } from '../services/queue.service.js';
import { generateEmbedding } from '../services/ai.service.js';
import { searchVectors } from '../services/vector.service.js';

import { isValidUrl } from '../utils/scraper.js';

export const createItem = async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.auth.userId;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ message: 'A valid public URL is required' });
    }

    // Check for existing URL for this user (Pre-emptive deduplication)
    const existingUrl = await Item.findOne({ userId, url });
    if (existingUrl) {
      return res.status(409).json({ 
        message: 'You have already saved this URL', 
        itemId: existingUrl._id 
      });
    }

    const newItem = new Item({
      userId,
      title: 'Scraping in progress...',
      content: 'Content will appear shortly.',
      url,
      status: 'processing',
    });

    await newItem.save();
    await addItemToQueue({ itemId: newItem._id, url });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create Item Error:', error.message);
    res.status(500).json({ message: 'Failed to process item' });
  }
};

export const getItems = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const items = await Item.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    console.error('Get Items Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
};

export const searchItems = async (req, res) => {
  try {
    const { q, tag, type, since } = req.query;
    const userId = req.auth.userId;

    if (!q && !tag && !type) {
      return res.status(400).json({ message: 'Search query or filter is required' });
    }

    const filters = {};
    if (tag) filters.tag = tag;
    if (type) filters.type = type;

    // 1. Build MongoDB Query (Keyword + Filters)
    const mongoQuery = { userId };
    if (q) mongoQuery.$text = { $search: q };
    if (tag) mongoQuery.tags = tag;
    if (type) mongoQuery.type = type;
    if (since) mongoQuery.createdAt = { $gte: new Date(since) };

    // 2. Perform Searches in Parallel
    const [keywordResults, queryEmbedding] = await Promise.all([
      Item.find(mongoQuery, q ? { score: { $meta: 'textScore' } } : {}).sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 }).limit(20),
      q ? generateEmbedding(q) : Promise.resolve(null)
    ]);

    let finalResults = [...keywordResults];

    // 3. Perform Vector Search (if query exists)
    if (queryEmbedding && queryEmbedding.length > 0) {
      const vectorResults = await searchVectors(queryEmbedding, 15, userId, filters);
      const vectorItemIds = vectorResults.map(r => r.id);
      
      const semanticItems = await Item.find({ 
        _id: { $in: vectorItemIds }, 
        userId,
        // Don't duplicate items already found via keyword
        _id: { $nin: keywordResults.map(i => i._id) }
      });

      // Merge and prioritize
      finalResults = [...finalResults, ...semanticItems];
    }

    res.status(200).json(finalResults);
  } catch (error) {
    console.error('Search Items Error:', error.message);
    res.status(500).json({ message: 'Failed to search items' });
  }
};

export const resurfaceItems = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const now = new Date();

    // Find items due for review (nextReviewAt is in the past or now)
    const items = await Item.find({
      userId,
      status: 'completed',
      nextReviewAt: { $lte: now }
    })
    .sort({ reviewCount: 1, createdAt: -1 })
    .limit(10);

    // If no items are strictly "due", provide a few interesting random ones to keep the flow
    if (items.length === 0) {
      const fallbackItems = await Item.aggregate([
        { $match: { userId, status: 'completed' } },
        { $sample: { size: 3 } }
      ]);
      return res.status(200).json(fallbackItems);
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Resurface Items Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch items for resurfacing' });
  }
};

export const markReviewed = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.body; // 1-5 (1: Forgot, 5: Perfect)
    const userId = req.auth.userId;

    const item = await Item.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Simplified SM-2 Algorithm
    let newInterval = item.interval || 1;
    if (quality >= 3) {
      if (item.reviewCount === 0) {
        newInterval = 1;
      } else if (item.reviewCount === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(newInterval * (1.5 + (quality * 0.1)));
      }
      item.reviewCount += 1;
    } else {
      newInterval = 1; // Reset if forgotten
      item.reviewCount = 0;
    }

    // Cap interval at 365 days for now
    if (newInterval > 365) newInterval = 365;

    item.interval = newInterval;
    item.lastReviewedAt = new Date();
    item.nextReviewAt = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

    await item.save();
    res.status(200).json({ message: 'Review recorded', nextReview: item.nextReviewAt });
  } catch (error) {
    console.error('Mark Reviewed Error:', error.message);
    res.status(500).json({ message: 'Failed to update review status' });
  }
};

export const getGraphData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const items = await Item.find({ userId, status: 'completed' });

    const nodes = items.map(item => ({
      id: item._id,
      title: item.title,
      type: 'item'
    }));

    // Create links based on shared tags
    const links = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const sharedTags = items[i].tags.filter(tag => items[j].tags.includes(tag));
        if (sharedTags.length > 0) {
          links.push({
            source: items[i]._id,
            target: items[j]._id,
            value: sharedTags.length,
            tags: sharedTags
          });
        }
      }
    }

    res.status(200).json({ nodes, links });
  } catch (error) {
    console.error('Graph Data Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch graph data' });
  }
};

export const getRelatedItems = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    const item = await Item.findOne({ _id: id, userId });
    if (!item || !item.embedding || item.embedding.length === 0) {
      return res.status(404).json({ message: 'Item not found or not processed' });
    }

    // Use current item's embedding to find similar ones
    const vectorResults = await searchVectors(item.embedding, 6, userId); // Top 5 + self
    
    // Filter out the current item and enrich
    const relatedIds = vectorResults
      .filter(r => r.id !== id)
      .map(r => r.id);

    const relatedItems = await Item.find({ _id: { $in: relatedIds }, userId });

    res.status(200).json(relatedItems);
  } catch (error) {
    console.error('Related Items Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch related items' });
  }
};

export const updateItemCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { collectionId } = req.body;
    const userId = req.auth.userId;

    const item = await Item.findOneAndUpdate(
      { _id: id, userId },
      { collectionId: collectionId || null },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update collection' });
  }
};

export const addHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, note, color } = req.body;
    const userId = req.auth.userId;

    if (!text) return res.status(400).json({ message: 'Highlight text is required' });

    const item = await Item.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.highlights.push({ text, note, color });
    await item.save();

    res.status(201).json(item.highlights[item.highlights.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add highlight' });
  }
};
