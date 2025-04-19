import { Request, Response } from 'express';
import { QueueEntry } from '../models/MatchQueue';
import { AuthRequest } from '../types/auth';
import { MatchmakingService } from '../services/matchmakingService';

const matchmakingService = MatchmakingService.getInstance();

export const joinQueue = async (req: AuthRequest, res: Response) => {
  try {
    const { gameType } = req.body;
    const userId = req.user._id;

    // Check if user is already in queue
    const existingEntry = await QueueEntry.findOne({
      player: userId,
      status: 'waiting'
    });

    if (existingEntry) {
      return res.status(400).json({ message: 'Already in queue' });
    }

    // Create new queue entry
    const queueEntry = new QueueEntry({
      player: userId,
      rating: req.user.rating || 1000, // Default rating if not set
      gameType,
      status: 'waiting'
    });

    await queueEntry.save();
    res.json({ message: 'Joined queue successfully', queueEntry });
  } catch (error) {
    res.status(500).json({ message: 'Error joining queue', error });
  }
};

export const leaveQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const queueEntry = await QueueEntry.findOneAndUpdate(
      { player: userId, status: 'waiting' },
      { status: 'cancelled' },
      { new: true }
    );

    if (!queueEntry) {
      return res.status(404).json({ message: 'Not in queue' });
    }

    res.json({ message: 'Left queue successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving queue', error });
  }
};

export const getQueueStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const queueEntry = await QueueEntry.findOne({
      player: userId,
      status: 'waiting'
    });

    if (!queueEntry) {
      return res.status(404).json({ message: 'Not in queue' });
    }

    const queueSize = await QueueEntry.countDocuments({
      gameType: queueEntry.gameType,
      status: 'waiting'
    });

    res.json({
      position: queueSize,
      waitTime: Date.now() - queueEntry.joinedAt.getTime(),
      gameType: queueEntry.gameType
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting queue status', error });
  }
};

export const startMatchmaking = async () => {
  await matchmakingService.start();
};

export const stopMatchmaking = () => {
  matchmakingService.stop();
}; 