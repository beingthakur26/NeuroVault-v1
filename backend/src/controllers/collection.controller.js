import Collection from '../models/Collection.js';
import Item from '../models/Item.js';

export const createCollection = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.auth.userId;

    if (!name) return res.status(400).json({ message: 'Collection name is required' });

    const newCollection = new Collection({ userId, name, description, color });
    await newCollection.save();

    res.status(201).json(newCollection);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A collection with this name already exists' });
    res.status(500).json({ message: 'Failed to create collection' });
  }
};

export const getCollections = async (req, res) => {
  try {
    const userId = req.auth.userId;
    // Get collections and inject item counts
    const collections = await Collection.find({ userId }).sort({ createdAt: -1 }).lean();
    
    // An alternative is using aggregate, but since users usually have few collections, parallel counting is fine
    for (let c of collections) {
      c.itemCount = await Item.countDocuments({ collectionId: c._id });
    }

    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    const collection = await Collection.findOneAndDelete({ _id: id, userId });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    // Optional: Unlink items from this collection (orphan them) rather than deleting them
    await Item.updateMany({ collectionId: id }, { $set: { collectionId: null } });

    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete collection' });
  }
};
