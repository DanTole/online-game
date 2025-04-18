import mongoose from 'mongoose';
import { IUser } from './User';

export interface ILobby extends mongoose.Document {
  name: string;
  host: IUser['_id'];
  maxPlayers: number;
  currentPlayers: IUser['_id'][];
  status: 'waiting' | 'playing' | 'finished';
  gameType: string;
  settings: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const lobbySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 2,
    max: 8,
    default: 4
  },
  currentPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  gameType: {
    type: String,
    required: true,
    enum: ['chess', 'checkers', 'tic-tac-toe'] // Add more game types as needed
  },
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
lobbySchema.index({ status: 1, gameType: 1 });
lobbySchema.index({ host: 1 });
lobbySchema.index({ currentPlayers: 1 });

// Validate max players
lobbySchema.pre('save', function(next) {
  if (this.currentPlayers.length > this.maxPlayers) {
    throw new Error('Cannot exceed maximum number of players');
  }
  next();
});

export const Lobby = mongoose.model<ILobby>('Lobby', lobbySchema); 