import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';

import { authenticateUser } from './middleware/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import limiter from './utils/limiter.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(express.json());
app.use(cors({ origin: corsOrigins }));
app.disable('x-powered-by');

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.get('/token-check', limiter, authenticateUser, (req, res) => {
  res.status(200).json({ isAuthenticated: true });
});

// Liveness probe for Docker and load balancers; never touches the database
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Production: serve the built client, with an SPA fallback for client-side routes.
// Registered after the API routes so it never shadows them.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(import.meta.dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('/{*splat}', limiter, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Connect to MongoDB and start server
try {
  await mongoose.connect(process.env.DB_CONNECTION_STRING);
  logger.info('Database connected');
} catch (err) {
  logger.error('Database connection failed', err);
  process.exit(1);
}

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
