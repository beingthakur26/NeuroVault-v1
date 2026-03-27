import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)
export default User
