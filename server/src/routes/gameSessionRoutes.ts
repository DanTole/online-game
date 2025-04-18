import express from 'express';
import {
  createGameSession,
  joinGameSession,
  getGameSession,
  updatePlayerReady,
} from '../controllers/gameSessionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Create a new game session
router.post('/', authenticateToken, createGameSession);

// Join an existing game session
router.post('/:sessionId/join', authenticateToken, joinGameSession);

// Get game session details
router.get('/:sessionId', getGameSession);

// Update player ready status
router.put('/:sessionId/ready', authenticateToken, updatePlayerReady);

export default router; 