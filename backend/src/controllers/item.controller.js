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
    const { q } = req.query;
    const userId = req.auth.userId;

    if (!q) {
      return res.status(400).json({ message: 'Query string "q" is required' });
    }

    // 1. Generate embedding for the query
    const queryEmbedding = await generateEmbedding(q);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return res.status(500).json({ message: 'Failed to process search query' });
    }

    // 2. Search in Qdrant
    // Note: In a production app, we would add a filter in Qdrant for userId.
    const vectorResults = await searchVectors(queryEmbedding, 10);

    // 3. Enrich with MongoDB data (optional, but good for full details)
    const itemIds = vectorResults.map(res => res.id);
    const items = await Item.find({ _id: { $in: itemIds }, userId });

    res.status(200).json(items);
  } catch (error) {
    console.error('Search Items Error:', error.message);
    res.status(500).json({ message: 'Failed to search items' });
  }
};

export const resurfaceItems = async (req, res) => {
  try {
    const userId = req.auth.userId;
    // Get 3 random items
    const items = await Item.aggregate([
      { $match: { userId, status: 'completed' } },
      { $sample: { size: 3 } }
    ]);
    res.status(200).json(items);
  } catch (error) {
    console.error('Resurface Error:', error.message);
    res.status(500).json({ message: 'Failed to resurface items' });
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
    const vectorResults = await searchVectors(item.embedding, 6); // Top 5 + self
    
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
