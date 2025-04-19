import mongoose, { Schema, Document } from 'mongoose';
import { IGameSession, IGameState, IGameEvent, IGameCommand } from '../types/game';

const gameStateSchema = new Schema<IGameState>({
  gameId: { type: String, required: true },
  gameType: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'playing', 'paused', 'finished'],
    default: 'waiting'
  },
  players: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    isReady: { type: Boolean, default: false },
    isHost: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    playerData: { type: Schema.Types.Mixed, default: {} }
  }],
  spectators: [{ type: String }],
  gameData: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const gameEventSchema = new Schema<IGameEvent>({
  type: { type: String, required: true },
  timestamp: { type: Number, required: true },
  playerId: { type: String },
  data: { type: Schema.Types.Mixed, default: {} }
});

const gameCommandSchema = new Schema<IGameCommand>({
  type: { type: String, required: true },
  playerId: { type: String, required: true },
  timestamp: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, default: {} }
});

const gameSessionSchema = new Schema<IGameSession>({
  gameType: { type: String, required: true },
  state: gameStateSchema,
  events: [gameEventSchema],
  commands: [gameCommandSchema]
}, { timestamps: true });

// Indexes for faster queries
gameSessionSchema.index({ 'state.gameId': 1 });
gameSessionSchema.index({ 'state.players.userId': 1 });
gameSessionSchema.index({ 'state.status': 1 });

export const GameSession = mongoose.model<IGameSession>('GameSession', gameSessionSchema); 