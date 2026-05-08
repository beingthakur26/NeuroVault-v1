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
    enum: ['processing', 'completed', 'failed', 'retrying'],
    default: 'processing',
  },
  // Spaced Repetition Fields
  reviewCount: { type: Number, default: 0 },
  interval: { type: Number, default: 1 }, // In days
  nextReviewAt: { type: Date, default: Date.now },
  lastReviewedAt: { type: Date },
  
  // Phase 9 Fields
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    default: null,
  },
  highlights: [{
    text: String,
    note: String,
    createdAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});

itemSchema.index({ userId: 1, url: 1 }, { unique: true });

// Keyword Search Index
itemSchema.index({ 
  title: 'text', 
  content: 'text', 
  summary: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    tags: 5,
    summary: 3,
    content: 1
  },
  name: 'ItemTextIndex'
});

const Item = mongoose.model('Item', itemSchema);

export default Item;
