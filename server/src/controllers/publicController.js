import Collection from '../models/Collection.js'
import Item from '../models/Item.js'

export const getPublicCollection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findOne({ _id: id, isPublic: true }).lean();
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found or is private' });
    }
    
    const items = await Item.find({ collections: collection._id }).sort({ createdAt: -1 }).lean();
    
    res.json({ success: true, collection, items });
  } catch (error) {
    console.error("Public Collection Fetch Error:", error)
    res.status(500).json({ error: 'Failed to access public resource' });
  }
}
