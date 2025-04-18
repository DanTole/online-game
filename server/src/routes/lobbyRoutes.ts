import express from 'express';
import { 
  createLobby, 
  getLobbies, 
  getLobby, 
  joinLobby, 
  leaveLobby, 
  startGame 
} from '../controllers/lobbyController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getLobbies);
router.get('/:id', getLobby);

// Protected routes
router.post('/', auth, createLobby);
router.post('/:id/join', auth, joinLobby);
router.post('/:id/leave', auth, leaveLobby);
router.post('/:id/start', auth, startGame);

export default router; 