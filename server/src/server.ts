import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/authRoutes';
import queueRoutes from './routes/queueRoutes';
import { MatchmakingService } from './services/matchmakingService';
import { WebSocketServer } from './services/websocketServer';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);

// Initialize services
const matchmakingService = MatchmakingService.getInstance();
const webSocketServer = WebSocketServer.getInstance(httpServer);

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start matchmaking service
    matchmakingService.start();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 