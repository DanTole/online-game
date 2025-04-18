import mongoose, { Document, Schema, Types } from 'mongoose';

export interface GameSessionDocument extends Document {
  lobbyId: Types.ObjectId;
  status: 'waiting' | 'playing' | 'finished';
  players: {
    userId: Types.ObjectId;
    ready: boolean;
    score: number;
  }[];
  currentTurn: number;
  maxPlayers: number;
  createdAt: Date;
  updatedAt: Date;
}

const gameSessionSchema = new Schema<GameSessionDocument>(
  {
    lobbyId: {
      type: Schema.Types.ObjectId,
      ref: 'Lobby',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'playing', 'finished'],
      default: 'waiting',
    },
    players: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      ready: {
        type: Boolean,
        default: false,
      },
      score: {
        type: Number,
        default: 0,
      },
    }],
    currentTurn: {
      type: Number,
      default: 0,
    },
    maxPlayers: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
gameSessionSchema.index({ lobbyId: 1 });
gameSessionSchema.index({ status: 1 });

export const GameSession = mongoose.model<GameSessionDocument>('GameSession', gameSessionSchema); 