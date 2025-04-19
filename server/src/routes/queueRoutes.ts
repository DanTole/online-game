import express, { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import { Queue } from '../models/Queue';
import { User } from '../models/User';

const router = express.Router();

// Middleware to handle AuthRequest type
const handleAuthRequest = (handler: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthRequest, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Join queue
router.post('/join', handleAuthRequest(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const queue = await Queue.findOne();
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  if (queue.players.includes(user._id)) {
    return res.status(400).json({ error: 'Already in queue' });
  }

  queue.players.push(user._id);
  await queue.save();

  res.json({ message: 'Joined queue successfully' });
}));

// Leave queue
router.post('/leave', handleAuthRequest(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const queue = await Queue.findOne();
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  queue.players = queue.players.filter(playerId => playerId.toString() !== user._id.toString());
  await queue.save();

  res.json({ message: 'Left queue successfully' });
}));

// Get queue status
router.get('/status', handleAuthRequest(async (req: AuthRequest, res: Response) => {
  const queue = await Queue.findOne().populate('players', 'username rating');
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  res.json({
    players: queue.players,
    isMatchmakingActive: queue.isMatchmakingActive
  });
}));

// Admin routes
router.post('/start', handleAuthRequest(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await User.findById(req.user.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const queue = await Queue.findOne();
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  queue.isMatchmakingActive = true;
  await queue.save();

  res.json({ message: 'Matchmaking started' });
}));

router.post('/stop', handleAuthRequest(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await User.findById(req.user.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const queue = await Queue.findOne();
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  queue.isMatchmakingActive = false;
  await queue.save();

  res.json({ message: 'Matchmaking stopped' });
}));

export default router; 