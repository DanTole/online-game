import { Router } from 'express';
import { getPlayerRanking, getLeaderboard, findMatch } from '../controllers/rankingController';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = Router();

// Public routes
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.get('/me', auth, (req, res) => getPlayerRanking(req as AuthRequest, res));
router.get('/find-match', auth, (req, res) => findMatch(req as AuthRequest, res));

export default router; 