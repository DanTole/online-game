import { Request, Response } from 'express';
import { PlayerRanking, IPlayerRanking } from '../models/PlayerRanking';
import { AuthRequest } from '../types/auth';

export const getPlayerRanking = async (req: AuthRequest, res: Response) => {
  try {
    const ranking = await PlayerRanking.findOne({ player: req.user._id });
    if (!ranking) {
      return res.status(404).json({ message: 'Player ranking not found' });
    }
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching player ranking', error });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const rankings = await PlayerRanking.find()
      .sort({ rating: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate('player', 'username displayName');
    
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error });
  }
};

export const updateRanking = async (playerId: string, result: 'win' | 'loss' | 'draw'): Promise<IPlayerRanking> => {
  try {
    const ranking = await PlayerRanking.findOne({ player: playerId });
    if (!ranking) {
      const newRanking = new PlayerRanking({ player: playerId });
      await newRanking.save();
      return updateRanking(playerId, result);
    }

    // Update basic stats
    ranking.gamesPlayed += 1;
    if (result === 'win') {
      ranking.wins += 1;
      ranking.streak = Math.max(1, ranking.streak + 1);
    } else if (result === 'loss') {
      ranking.losses += 1;
      ranking.streak = Math.min(-1, ranking.streak - 1);
    } else {
      ranking.draws += 1;
      ranking.streak = 0;
    }

    // Calculate new rating using Elo rating system
    const K = 32; // K-factor
    const expectedScore = 1 / (1 + Math.pow(10, (ranking.rating - 1000) / 400));
    const actualScore = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
    const ratingChange = Math.round(K * (actualScore - expectedScore));
    ranking.rating = Math.max(0, ranking.rating + ratingChange);

    ranking.lastPlayed = new Date();
    await ranking.save();
    return ranking;
  } catch (error) {
    console.error('Error updating ranking:', error);
    throw error;
  }
};

export const findMatch = async (req: AuthRequest, res: Response) => {
  try {
    const playerRanking = await PlayerRanking.findOne({ player: req.user._id });
    if (!playerRanking) {
      return res.status(404).json({ message: 'Player ranking not found' });
    }

    // Find players within a reasonable rating range
    const ratingRange = 200;
    const potentialMatches = await PlayerRanking.find({
      player: { $ne: req.user._id },
      rating: {
        $gte: playerRanking.rating - ratingRange,
        $lte: playerRanking.rating + ratingRange
      }
    }).populate('player', 'username displayName');

    if (potentialMatches.length === 0) {
      return res.status(404).json({ message: 'No suitable matches found' });
    }

    // Sort by rating difference and return the best match
    const bestMatch = potentialMatches.reduce((best, current) => {
      const currentDiff = Math.abs(current.rating - playerRanking.rating);
      const bestDiff = Math.abs(best.rating - playerRanking.rating);
      return currentDiff < bestDiff ? current : best;
    });

    res.json({
      match: bestMatch,
      ratingDifference: Math.abs(bestMatch.rating - playerRanking.rating)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error finding match', error });
  }
}; 