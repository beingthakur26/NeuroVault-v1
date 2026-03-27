import Collection from '../models/Collection.js'
import Item from '../models/Item.js'
import User from '../models/User.js'

export const createCollection = async (req, res) => {
  try {
    const { name, parentId } = req.body
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const newCollection = await Collection.create({
      userId: user._id,
      name,
      parentId: parentId || null
    })

    res.status(201).json({ success: true, collection: newCollection })
  } catch (error) {
    console.error("Create collection error", error)
    res.status(500).json({ error: 'Failed to create collection' })
  }
}

export const getCollections = async (req, res) => {
  try {
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const collections = await Collection.find({ userId: user._id })
    res.json({ success: true, collections })
  } catch (error) {
    console.error("Get collections error", error)
    res.status(500).json({ error: 'Failed' })
  }
}

export const deleteCollection = async (req, res) => {
  try {
    const clerkId = req.auth.userId
    const user = await User.findOne({ clerkId })
    
    // Safety check, ensure user owns the collection
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, userId: user._id })
    if (!collection) return res.status(404).json({ error: 'Not found' })

    // Optional: remove this collection reference from all items
    await Item.updateMany(
      { collections: collection._id },
      { $pull: { collections: collection._id } }
    )

    res.json({ success: true })
  } catch (error) {
    console.error("Delete collection error", error)
    res.status(500).json({ error: 'Failed' })
  }
}

export const addItemToCollection = async (req, res) => {
  try {
    const { itemId } = req.body
    const collectionId = req.params.id
    const clerkId = req.auth.userId
    
    const user = await User.findOne({ clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Verify ownership
    const collection = await Collection.findOne({ _id: collectionId, userId: user._id })
    if (!collection) return res.status(404).json({ error: 'Collection not found' })

    const item = await Item.findOneAndUpdate(
      { _id: itemId, userId: user._id },
      { $addToSet: { collections: collectionId } }, // addToSet prevents duplicates
      { new: true }
    )
    if (!item) return res.status(404).json({ error: 'Item not found' })

    res.json({ success: true, item })
  } catch (error) {
    console.error("Add item to collection error", error)
    res.status(500).json({ error: 'Failed' })
  }
}
