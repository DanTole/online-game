import { Types } from 'mongoose';

export type GameType = 'snake' | string; // Allow for future game types

export interface IGameState {
  gameId: string;
  gameType: GameType;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  players: IPlayer[];
  spectators: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  gameData: Record<string, any>; // Game-specific data
}

export interface IPlayer {
  userId: string;
  username: string;
  isReady: boolean;
  isHost: boolean;
  score: number;
  playerData: Record<string, any>; // Game-specific player data
}

export interface IGameEvent {
  type: string;
  timestamp: number;
  playerId?: string;
  data: Record<string, any>;
}

export interface IGameCommand {
  type: string;
  playerId: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface IGameSession {
  _id: Types.ObjectId;
  gameType: GameType;
  state: IGameState;
  events: IGameEvent[];
  commands: IGameCommand[];
  createdAt: Date;
  updatedAt: Date;
}

// WebSocket message types
export type WsMessageType = 
  | 'game:state' 
  | 'game:event' 
  | 'game:command' 
  | 'game:error' 
  | 'game:join' 
  | 'game:leave' 
  | 'game:ready' 
  | 'game:start' 
  | 'game:pause' 
  | 'game:resume' 
  | 'game:end';

export interface IWsMessage {
  type: WsMessageType;
  data: Record<string, any>;
  timestamp: number;
}

// Game session manager interface
export interface IGameSessionManager {
  createSession(gameType: GameType, hostId: string): Promise<IGameSession>;
  joinSession(sessionId: string, userId: string): Promise<IGameSession>;
  leaveSession(sessionId: string, userId: string): Promise<void>;
  updateState(sessionId: string, state: Partial<IGameState>): Promise<void>;
  addEvent(sessionId: string, event: IGameEvent): Promise<void>;
  addCommand(sessionId: string, command: IGameCommand): Promise<void>;
  getSession(sessionId: string): Promise<IGameSession | null>;
  endSession(sessionId: string): Promise<void>;
} 