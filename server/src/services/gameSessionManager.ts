import { GameSession } from '../models/GameSession';
import { IGameSession, IGameState, IGameEvent, IGameCommand, IGameSessionManager } from '../types/game';
import { Types } from 'mongoose';

export class GameSessionManager implements IGameSessionManager {
  private static instance: GameSessionManager;

  private constructor() {}

  public static getInstance(): GameSessionManager {
    if (!GameSessionManager.instance) {
      GameSessionManager.instance = new GameSessionManager();
    }
    return GameSessionManager.instance;
  }

  public async createSession(gameType: string, hostId: string): Promise<IGameSession> {
    const session = new GameSession({
      gameType,
      state: {
        gameId: new Types.ObjectId().toString(),
        gameType,
        status: 'waiting',
        players: [{
          userId: hostId,
          username: 'Host', // This will be updated with actual username
          isReady: false,
          isHost: true,
          score: 0,
          playerData: {}
        }],
        spectators: [],
        gameData: {}
      },
      events: [],
      commands: []
    });

    await session.save();
    return session;
  }

  public async joinSession(sessionId: string, userId: string): Promise<IGameSession> {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if player is already in the session
    const existingPlayer = session.state.players.find(p => p.userId === userId);
    if (existingPlayer) {
      return session;
    }

    // Add player to the session
    session.state.players.push({
      userId,
      username: 'Player', // This will be updated with actual username
      isReady: false,
      isHost: false,
      score: 0,
      playerData: {}
    });

    await session.save();
    return session;
  }

  public async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Remove player from the session
    session.state.players = session.state.players.filter(p => p.userId !== userId);

    // If no players left, end the session
    if (session.state.players.length === 0) {
      await this.endSession(sessionId);
    } else {
      // If host left, assign new host
      if (!session.state.players.some(p => p.isHost)) {
        session.state.players[0].isHost = true;
      }
      await session.save();
    }
  }

  public async updateState(sessionId: string, state: Partial<IGameState>): Promise<void> {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    Object.assign(session.state, state);
    await session.save();
  }

  public async addEvent(sessionId: string, event: IGameEvent): Promise<void> {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.events.push(event);
    await session.save();
  }

  public async addCommand(sessionId: string, command: IGameCommand): Promise<void> {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.commands.push(command);
    await session.save();
  }

  public async getSession(sessionId: string): Promise<IGameSession | null> {
    return GameSession.findById(sessionId);
  }

  public async endSession(sessionId: string): Promise<void> {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.state.status = 'finished';
    await session.save();
  }
} 