import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#6366f1', // Indigo 500
  }
}, {
  timestamps: true,
});

// A user cannot have two collections with the exact same name
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
