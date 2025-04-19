import mongoose, { Document, Model, Types } from 'mongoose';
import { IUser } from './User';

export interface IPlayerRanking extends Document {
  player: Types.ObjectId;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  lastPlayed: Date;
  rank: string;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
}

const playerRankingSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    default: 1000,
    min: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  winRate: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  },
  rank: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'],
    default: 'Bronze'
  },
  streak: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate win rate before saving
playerRankingSchema.pre('save', function(this: IPlayerRanking) {
  if (this.gamesPlayed > 0) {
    this.winRate = (this.wins / this.gamesPlayed) * 100;
  }
});

// Update rank based on rating
playerRankingSchema.pre('save', function(this: IPlayerRanking) {
  if (this.rating >= 2500) this.rank = 'Grandmaster';
  else if (this.rating >= 2000) this.rank = 'Master';
  else if (this.rating >= 1750) this.rank = 'Diamond';
  else if (this.rating >= 1500) this.rank = 'Platinum';
  else if (this.rating >= 1250) this.rank = 'Gold';
  else if (this.rating >= 1000) this.rank = 'Silver';
  else this.rank = 'Bronze';
});

export const PlayerRanking = mongoose.model<IPlayerRanking>('PlayerRanking', playerRankingSchema); 