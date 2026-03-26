import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  contentHash: {
    type: String,
    index: true,
  },
  type: {
    type: String,
    enum: ['website', 'article', 'note', 'document', 'image'],
    default: 'website',
  },
  tags: {
    type: [String],
    default: [],
  },
  summary: {
    type: String,
    default: '',
  },
  embedding: {
    type: [Number],
    default: [],
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
}, {
  timestamps: true,
});

itemSchema.index({ userId: 1, url: 1 }, { unique: true });

const Item = mongoose.model('Item', itemSchema);

export default Item;
