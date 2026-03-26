import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './src/config/db.js';
import itemRoutes from './src/routes/item.routes.js';
import startWorker from './src/workers/item.worker.js';
import { initQdrant } from './src/config/qdrant.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Qdrant
initQdrant();

// Initialize worker
startWorker();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/items', itemRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
