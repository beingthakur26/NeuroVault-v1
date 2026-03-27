import Item from '../models/Item.js'
import User from '../models/User.js'
import { searchSimilar, deleteVector } from '../services/qdrantService.js'
import { generateEmbeddings, getMistralClient } from '../services/aiService.js'
import { extractContentFromUrl } from '../services/extractorService.js'
import { aiQueue, processItemLogic } from '../workers/aiWorker.js'

export const uploadItemImage = async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: "No image file provided" })

    const clerkId = req.auth.userId
    let user = await User.findOne({ clerkId })
    if (!user) {
      user = await User.create({ clerkId, email: 'unknown' })
    }

    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    
    // Process via Mistral Vision
    const client = getMistralClient()
    if (!client) {
      return res.status(500).json({ error: "AI Vision Service unavailable" })
    }

    const response = await client.chat.complete({
      model: 'pixtral-12b-2409',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "Analyze this image and describe it in extremely high detail. Extract all readable text exactly as written. Identify core objects and intent." },
            { type: 'image_url', imageUrl: base64Image }
          ]
        }
      ]
    })

    const visionDescription = response.choices[0].message.content

    // Save as Item
    const newItem = await Item.create({
      userId: user._id,
      title: "Vision Captured Note",
      url: "",
      type: "image",
      content: `[VISION OCR & ANALYSIS]:\n\n${visionDescription}`,
      tags: [],
      aiStatus: 'pending' // Vectorize it
    })

    const payload = {
      itemId: newItem._id.toString(),
      vectorId: newItem.vectorId,
      extractedContent: newItem.content,
      finalTitle: newItem.title,
      finalType: newItem.type,
      combinedTags: [],
      userId: user._id.toString()
    }

    if (aiQueue) {
      await aiQueue.add('process-item', payload)
    } else {
      processItemLogic(payload).catch(console.error)
    }

    res.status(201).json({ success: true, item: newItem })
  } catch (error) {
    console.error("Upload Image Error:", error)
    res.status(500).json({ error: "Failed to parse image via Vision AI" })
  }
}

export const saveItem = async (req, res) => {
  try {
    const { url, title, content: manualNotes, type = 'article', manualTags = [], favicon, imageUrl } = req.body
    
    // 1. Get user
    const clerkId = req.auth.userId
    let user = await User.findOne({ clerkId })
    if (!user) {
      user = await User.create({ clerkId, email: 'unknown' }) // Ideally synced via webhook
    }

    // 2. Extract Data conditionally (Skip if Text Snippet is explicitly passed without a physical URL or if flagged as raw highlight text)
    let finalTitle = title || url || "Text Highlight"
    let extractedContent = manualNotes || ''
    let finalType = type

    if (url && type !== 'highlight') {
      const extracted = await extractContentFromUrl(url)
      finalTitle = extracted.title && extracted.title !== url ? extracted.title : finalTitle
      finalType = extracted.type
      // Append manually typed notes to the automatically extracted content
      extractedContent = manualNotes ? `[USER NOTES]: ${manualNotes}\n\n[EXTRACTED CONTENT]: ${extracted.content}` : extracted.content
    } else if (type === 'highlight') {
      // Direct raw text insertion (like a highlighted snippet from the web or extension)
      extractedContent = `[HIGHLIGHT SAVED]:\n\n${manualNotes}\n\n[SOURCE URL]: ${url || 'Unknown'}`
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
    const { query, collection } = req.query
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })

    let baseMatch = { userId: user._id }
    if (collection) {
      baseMatch.collections = collection
    }

    if (!query) {
      // Return recent items if no query
      const items = await Item.find(baseMatch).sort({ createdAt: -1 }).limit(50)
      return res.json({ success: true, items })
    }

    // 1. Semantic Search via Qdrant
    let sortedItems = []
    try {
      const vector = await generateEmbeddings(query)
      const similar = await searchSimilar(vector, 10, {
        must: [{ key: "userId", match: { value: user?._id?.toString() } }]
      })
      const ids = similar.map(s => s.id)
      const semanticItems = await Item.find({ vectorId: { $in: ids }, ...baseMatch })
      sortedItems = ids.map(id => semanticItems.find(i => i.vectorId === id)).filter(Boolean)
    } catch (e) {
      console.error("Semantic Search fallback:", e)
    }

    // 2. Exact Keyword Search via MongoDB Regex (Title & Tags)
    const keywordItems = await Item.find({
      ...baseMatch,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    }).limit(10)

    // 3. Merge and Deduplicate Results
    const combined = [...sortedItems]
    const existingIds = new Set(combined.map(i => i._id.toString()))

    for (const item of keywordItems) {
      if (!existingIds.has(item._id.toString())) {
        combined.push(item)
        existingIds.add(item._id.toString())
      }
    }

    res.json({ success: true, items: combined })
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

export const updateItemContent = async (req, res) => {
  try {
    const { content } = req.body
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, userId: user._id },
      { content },
      { new: true }
    )
    if (!item) return res.status(404).json({ error: 'Item not found' })

    // If it has a vectorId, we queue it to update definitions
    if (item.vectorId && aiQueue) {
      const payload = {
        itemId: item._id.toString(),
        vectorId: item.vectorId,
        extractedContent: item.content,
        finalTitle: item.title,
        finalType: item.type,
        combinedTags: item.tags,
        userId: user._id.toString()
      }
      await aiQueue.add('process-item', payload)
    }

    res.json({ success: true, item })
  } catch (error) {
    console.error("Update Content Error:", error)
    res.status(500).json({ error: 'Failed to update item content' })
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
