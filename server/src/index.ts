import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import userRoutes from './routes/userRoutes';
import lobbyRoutes from './routes/lobbyRoutes';
import gameSessionRoutes from './routes/gameSessionRoutes';
import rankingRoutes from './routes/rankingRoutes';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/lobbies', lobbyRoutes);
app.use('/api/game-sessions', gameSessionRoutes);
app.use('/api/rankings', rankingRoutes);

// Redis connection
let redis: Redis | null = null;
if (process.env.NODE_ENV === 'production') {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: () => null // Disable retries
    });
    console.log('Connected to Redis');
  } catch (error) {
    console.warn('Failed to connect to Redis, running without Redis');
  }
} else {
  console.log('Redis disabled in development mode');
}

// MongoDB Connection
let mongoServer: MongoMemoryServer;
async function connectDB() {
  try {
    if (process.env.NODE_ENV === 'development') {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB Memory Server');
    } else {
      await mongoose.connect(process.env.MONGODB_URI || '');
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: process.env.NODE_ENV === 'development' ? 'memory' : 'connected',
    redis: 'disabled'
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize server
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, server, io }; 