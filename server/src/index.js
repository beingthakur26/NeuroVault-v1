import 'dotenv/config';

console.log("ENV CHECK:", process.env.MISTRAL_API_KEY ? "Loaded" : "Missing");

import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import connectDB from './config/db.js'
import itemRoutes from './routes/itemRoutes.js'
import collectionRoutes from './routes/collectionRoutes.js'
import { initQdrant } from './services/qdrantService.js'
import './workers/aiWorker.js'

// Connect tracking
connectDB()
initQdrant()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() })
})

// Protected route example
app.get('/api/me', ClerkExpressRequireAuth(), (req, res) => {
  res.json({ user: req.auth })
})

// Mount API routes
app.use('/api/items', itemRoutes)
app.use('/api/collections', collectionRoutes)

app.listen(PORT, () => {
  console.log(`NeuroVault Server running on port ${PORT}`)
})
