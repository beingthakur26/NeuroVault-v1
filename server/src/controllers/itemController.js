import Item from '../models/Item.js'
import User from '../models/User.js'
import { searchSimilar, deleteVector } from '../services/qdrantService.js'
import { generateEmbeddings } from '../services/aiService.js'
import { extractContentFromUrl } from '../services/extractorService.js'
import { aiQueue, processItemLogic } from '../workers/aiWorker.js'

export const saveItem = async (req, res) => {
  try {
    const { url, title, content: manualNotes, type = 'article', manualTags = [], favicon, imageUrl } = req.body
    
    // 1. Get user
    const clerkId = req.auth.userId
    let user = await User.findOne({ clerkId })
    if (!user) {
      user = await User.create({ clerkId, email: 'unknown' }) // Ideally synced via webhook
    }

    // 2. Extract Data from URL automatically
    let finalTitle = title || url
    let extractedContent = manualNotes || ''
    let finalType = type

    if (url) {
      const extracted = await extractContentFromUrl(url)
      finalTitle = extracted.title && extracted.title !== url ? extracted.title : finalTitle
      finalType = extracted.type
      // Append manually typed notes to the automatically extracted content
      extractedContent = manualNotes ? `[USER NOTES]: ${manualNotes}\n\n[EXTRACTED CONTENT]: ${extracted.content}` : extracted.content
    }

    // 3. Save to MongoDB as 'pending'
    const newItem = await Item.create({
      userId: user._id,
      title: finalTitle,
      url,
      type: finalType,
      content: extractedContent,
      tags: manualTags,
      favicon,
      imageUrl,
      aiStatus: 'pending' // Flag for worker
    })

    const payload = {
      itemId: newItem._id.toString(),
      vectorId: newItem.vectorId,
      extractedContent: extractedContent,
      finalTitle: finalTitle,
      finalType: finalType,
      combinedTags: manualTags,
      userId: user._id.toString()
    }

    if (aiQueue) {
      // 4a. Push exact context to Background AI Worker Queue
      await aiQueue.add('process-item', payload)
    } else {
      // 4b. No Redis? Run process independently (detached execution)
      processItemLogic(payload).catch(console.error)
    }

    res.status(201).json({ success: true, item: newItem })
  } catch (error) {
    console.error("Save Item Error:", error)
    res.status(500).json({ success: false, error: 'Failed to save item' })
  }
}

export const searchItems = async (req, res) => {
  try {
    const { query } = req.query
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })

    if (!query) {
      // Return recent items if no query
      const items = await Item.find({ userId: user?._id }).sort({ createdAt: -1 }).limit(50)
      return res.json({ success: true, items })
    }

    // Semantic Search
    const vector = await generateEmbeddings(query)
    const similar = await searchSimilar(vector, 10, {
      must: [{ key: "userId", match: { value: user?._id?.toString() } }]
    })

    // Fetch full records from Mongo using vectorId (since Qdrant IDs are UUIDs)
    const ids = similar.map(s => s.id)
    const items = await Item.find({ vectorId: { $in: ids } })

    // Sort items to match Qdrant order
    const sortedItems = ids.map(id => items.find(i => i.vectorId === id)).filter(Boolean)

    res.json({ success: true, items: sortedItems })
  } catch (error) {
    console.error("Search Error:", error)
    res.status(500).json({ success: false, error: 'Failed to search items' })
  }
}

export const getGraphData = async (req, res) => {
  try {
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const items = await Item.find({ userId: user._id }).lean()
    
    const nodes = items.map(item => ({
      id: item._id.toString(),
      name: item.title,
      val: 1,
      group: item.type === 'video' ? 1 : item.type === 'pdf' ? 2 : 3,
      tags: item.tags || []
    }))

    const links = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sharedTags = nodes[i].tags.filter(t => nodes[j].tags.includes(t))
        if (sharedTags.length > 0) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: sharedTags.length
          })
        }
      }
    }

    res.json({ nodes, links })
  } catch (error) {
    console.error("Graph Error:", error)
    res.status(500).json({ error: 'Failed to generate graph' })
  }
}

export const getResurfacedItems = async (req, res) => {
  try {
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Simulate "Forgotten Memories" by picking 3 random items
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    let items = await Item.aggregate([
      { $match: { userId: user._id, createdAt: { $lt: oneDayAgo } } },
      { $sample: { size: 2 } }
    ])

    if (items.length === 0) {
      // Fallback: Just get any 2 random items
      items = await Item.aggregate([
        { $match: { userId: user._id } },
        { $sample: { size: 2 } }
      ])
    }

    res.json({ success: true, items })
  } catch (error) {
    console.error("Resurface Error:", error)
    res.status(500).json({ success: false, error: 'Failed to fetch resurfaced items' })
  }
}

export const getTopicClusters = async (req, res) => {
  try {
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Group items by tags, count them, and return top 3 clusters
    const clusters = await Item.aggregate([
      { $match: { userId: user._id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 }, items: { $push: { title: "$title", _id: "$_id" } } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ])

    res.json({ success: true, clusters })
  } catch (error) {
    console.error("Clusters Error:", error)
    res.status(500).json({ success: false, error: 'Failed to generate clusters' })
  }
}

export const getItemById = async (req, res) => {
  try {
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const item = await Item.findOne({ _id: req.params.id, userId: user._id })
    if (!item) return res.status(404).json({ error: 'Item not found' })

    res.json({ success: true, item })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' })
  }
}

export const deleteItem = async (req, res) => {
  try {
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const item = await Item.findOneAndDelete({ _id: req.params.id, userId: user._id })
    if (!item) return res.status(404).json({ error: 'Item not found' })

    // Also delete the vector from Qdrant if it exists
    if (item.vectorId) {
      await deleteVector(item.vectorId).catch(console.error)
    }

    res.json({ success: true, message: 'Item deleted safely' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' })
  }
}
