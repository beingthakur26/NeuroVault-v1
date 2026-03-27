import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  type: {
    type: String,
    enum: ['article', 'tweet', 'image', 'video', 'pdf', 'note'],
    required: true
  },
  content: {
    type: String, 
    // The raw extracted text, useful if we need to re-embed later
  },
  summary: {
    type: String,
  },
  tags: [{
    type: String
  }],
  vectorId: {
    type: String, // ID in Qdrant
  },
  favicon: String,
  imageUrl: String, // e.g. Cloudinary stored image
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  aiStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  }
}, { timestamps: true })

const Item = mongoose.model('Item', itemSchema)
export default Item
