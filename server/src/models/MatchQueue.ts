import mongoose, { Document, Model, Types } from 'mongoose';
import { IUser } from './User';

export interface IQueueEntry extends Document {
  player: Types.ObjectId;
  rating: number;
  gameType: string;
  joinedAt: Date;
  status: 'waiting' | 'matched' | 'cancelled';
  matchId?: Types.ObjectId;
}

const queueEntrySchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['1v1', '2v2', '3v3', '4v4']
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['waiting', 'matched', 'cancelled'],
    default: 'waiting'
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession'
  }
}, {
  timestamps: true
});

// Index for faster queries
queueEntrySchema.index({ status: 1, gameType: 1, rating: 1 });
queueEntrySchema.index({ player: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'waiting' } });

export const QueueEntry = mongoose.model<IQueueEntry>('QueueEntry', queueEntrySchema); 