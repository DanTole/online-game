import { Schema, model, Document, Types, Model } from 'mongoose';
import { IUser } from './User';

export interface PlayerState {
  playerId: Types.ObjectId;
  username: string;
  isReady: boolean;
  joinedAt: Date;
}

export interface ILobby {
  name: string;
  host: Types.ObjectId;
  maxPlayers: number;
  currentPlayers: PlayerState[];
  isPrivate: boolean;
  password?: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

export interface LobbyMethods {
  canJoin(playerId: Types.ObjectId): boolean;
  addPlayer(playerId: Types.ObjectId, username: string): boolean;
  removePlayer(playerId: Types.ObjectId): boolean;
  togglePlayerReady(playerId: Types.ObjectId): boolean;
  startGame(): boolean;
  endGame(): void;
}

export interface LobbyModel extends Model<ILobby, {}, LobbyMethods> {}

export type LobbyDocument = Document<Types.ObjectId, {}, ILobby> & ILobby & LobbyMethods;

const lobbySchema = new Schema<ILobby, LobbyModel, LobbyMethods>({
  name: { type: String, required: true },
  host: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  maxPlayers: { type: Number, required: true, min: 2, max: 8 },
  currentPlayers: [{
    playerId: { type: Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    isReady: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  }],
  isPrivate: { type: Boolean, default: false },
  password: { type: String },
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' }
}, { timestamps: true });

lobbySchema.methods.canJoin = function(playerId: Types.ObjectId): boolean {
  if (this.status !== 'waiting') return false;
  if (this.currentPlayers.length >= this.maxPlayers) return false;
  return !this.currentPlayers.some((p: PlayerState) => p.playerId.equals(playerId));
};

lobbySchema.methods.addPlayer = function(playerId: Types.ObjectId, username: string): boolean {
  if (!this.canJoin(playerId)) return false;
  this.currentPlayers.push({
    playerId,
    username,
    isReady: false,
    joinedAt: new Date()
  });
  return true;
};

lobbySchema.methods.removePlayer = function(playerId: Types.ObjectId): boolean {
  const index = this.currentPlayers.findIndex((p: PlayerState) => p.playerId.equals(playerId));
  if (index === -1) return false;
  this.currentPlayers.splice(index, 1);
  return true;
};

lobbySchema.methods.togglePlayerReady = function(playerId: Types.ObjectId): boolean {
  const player = this.currentPlayers.find((p: PlayerState) => p.playerId.equals(playerId));
  if (!player) return false;
  player.isReady = !player.isReady;
  return true;
};

lobbySchema.methods.startGame = function(): boolean {
  if (this.status !== 'waiting') return false;
  if (this.currentPlayers.length < 2) return false;
  if (!this.currentPlayers.every((p: PlayerState) => p.isReady)) return false;
  this.status = 'playing';
  return true;
};

lobbySchema.methods.endGame = function(): void {
  this.status = 'finished';
};

export const Lobby = model<ILobby, LobbyModel>('Lobby', lobbySchema); 