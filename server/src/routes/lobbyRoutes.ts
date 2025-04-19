import { Router } from 'express';
import { 
  createLobby, 
  getLobbies, 
  getLobby, 
  joinLobby, 
  leaveLobby,
  toggleReady,
  startGame,
  endGame 
} from '../controllers/lobbyController';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = Router();

// Public routes
router.get('/', getLobbies);
router.get('/:id', getLobby);

// Protected routes
router.post('/', auth, (req, res) => createLobby(req as AuthRequest, res));
router.post('/:id/join', auth, (req, res) => joinLobby(req as AuthRequest, res));
router.post('/:id/leave', auth, (req, res) => leaveLobby(req as AuthRequest, res));
router.post('/:id/ready', auth, (req, res) => toggleReady(req as AuthRequest, res));
router.post('/:id/start', auth, (req, res) => startGame(req as AuthRequest, res));
router.post('/:id/end', auth, (req, res) => endGame(req as AuthRequest, res));

export default router; 