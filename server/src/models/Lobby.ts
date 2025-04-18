import mongoose, { Document, Model, Types } from 'mongoose';
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
  players: Types.ObjectId[];
  gameType: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

export interface LobbyMethods {
  addPlayer(playerId: Types.ObjectId, username: string): Promise<void>;
  removePlayer(playerId: Types.ObjectId): Promise<void>;
  canJoin(playerId: Types.ObjectId, password?: string): boolean;
  togglePlayerReady(playerId: Types.ObjectId): boolean;
  startGame(): boolean;
  endGame(): void;
}

export type LobbyDocument = Document<unknown, {}, ILobby> & 
  Omit<ILobby & { _id: Types.ObjectId } & { __v: number }, keyof LobbyMethods> & 
  LobbyMethods;

const lobbySchema = new mongoose.Schema<ILobby, Model<ILobby, {}, LobbyMethods>>({
  name: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxPlayers: { type: Number, required: true, min: 2, max: 8 },
  currentPlayers: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    isReady: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  }],
  isPrivate: { type: Boolean, default: false },
  password: { type: String },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  gameType: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
}, { timestamps: true });

lobbySchema.methods.addPlayer = async function(this: LobbyDocument, playerId: Types.ObjectId, username: string) {
  if (this.players.length >= this.maxPlayers) {
    throw new Error('Lobby is full');
  }
  if (this.players.some(id => id.equals(playerId))) {
    throw new Error('Player already in lobby');
  }
  this.players.push(playerId);
  this.currentPlayers.push({
    playerId,
    username,
    isReady: false,
    joinedAt: new Date()
  });
  await this.save();
};

lobbySchema.methods.removePlayer = async function(this: LobbyDocument, playerId: Types.ObjectId) {
  this.players = this.players.filter(id => !id.equals(playerId));
  this.currentPlayers = this.currentPlayers.filter(p => !p.playerId.equals(playerId));
  if (this.players.length === 0) {
    await this.deleteOne();
  } else if (this.host.equals(playerId) && this.players.length > 0) {
    this.host = this.players[0];
    await this.save();
  } else {
    await this.save();
  }
};

lobbySchema.methods.canJoin = function(this: LobbyDocument, playerId: Types.ObjectId, password?: string) {
  if (this.isPrivate && this.password !== password) {
    return false;
  }
  if (this.players.some(id => id.equals(playerId))) {
    return false;
  }
  return this.players.length < this.maxPlayers;
};

lobbySchema.methods.togglePlayerReady = function(this: LobbyDocument, playerId: Types.ObjectId): boolean {
  const player = this.currentPlayers.find(p => p.playerId.equals(playerId));
  if (!player) return false;
  player.isReady = !player.isReady;
  return true;
};

lobbySchema.methods.startGame = function(this: LobbyDocument): boolean {
  if (this.status !== 'waiting') return false;
  if (this.currentPlayers.length < 2) return false;
  if (!this.currentPlayers.every(p => p.isReady)) return false;
  this.status = 'playing';
  return true;
};

lobbySchema.methods.endGame = function(this: LobbyDocument): void {
  this.status = 'finished';
};

export const Lobby = mongoose.model<ILobby, Model<ILobby, {}, LobbyMethods>>('Lobby', lobbySchema); 