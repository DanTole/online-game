import mongoose, { Schema, Document } from 'mongoose';

export interface IQueue extends Document {
  players: mongoose.Types.ObjectId[];
  isMatchmakingActive: boolean;
}

const queueSchema = new Schema<IQueue>({
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isMatchmakingActive: { type: Boolean, default: false }
});

export const Queue = mongoose.model<IQueue>('Queue', queueSchema); 