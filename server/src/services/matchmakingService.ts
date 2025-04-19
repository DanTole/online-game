import { QueueEntry, IQueueEntry } from '../models/MatchQueue';
import { Lobby } from '../models/Lobby';
import { Types } from 'mongoose';

const RATING_RANGE = 200; // Maximum rating difference between matched players
const MAX_WAIT_TIME = 300000; // 5 minutes in milliseconds
const MIN_PLAYERS = 2; // Minimum players needed for a match

export class MatchmakingService {
  private static instance: MatchmakingService;
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService();
    }
    return MatchmakingService.instance;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.interval = setInterval(() => this.processQueue(), 5000); // Check every 5 seconds
  }

  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  private async processQueue(): Promise<void> {
    try {
      // Get all waiting players
      const waitingPlayers = await QueueEntry.find({
        status: 'waiting',
        joinedAt: { $gte: new Date(Date.now() - MAX_WAIT_TIME) }
      }).populate('player');

      // Group players by game type
      const playersByGameType = waitingPlayers.reduce((acc, entry) => {
        if (!acc[entry.gameType]) {
          acc[entry.gameType] = [];
        }
        acc[entry.gameType].push(entry);
        return acc;
      }, {} as Record<string, IQueueEntry[]>);

      // Process each game type
      for (const [gameType, players] of Object.entries(playersByGameType)) {
        if (players.length >= MIN_PLAYERS) {
          await this.matchPlayers(players, gameType);
        }
      }
    } catch (error) {
      console.error('Error in matchmaking process:', error);
    }
  }

  private async matchPlayers(players: IQueueEntry[], gameType: string): Promise<void> {
    // Sort players by rating
    players.sort((a, b) => a.rating - b.rating);

    const matches: IQueueEntry[][] = [];
    let currentMatch: IQueueEntry[] = [];

    for (const player of players) {
      if (currentMatch.length === 0) {
        currentMatch.push(player);
      } else {
        const lastPlayer = currentMatch[currentMatch.length - 1];
        if (Math.abs(player.rating - lastPlayer.rating) <= RATING_RANGE) {
          currentMatch.push(player);
        } else {
          if (currentMatch.length >= MIN_PLAYERS) {
            matches.push([...currentMatch]);
          }
          currentMatch = [player];
        }
      }
    }

    if (currentMatch.length >= MIN_PLAYERS) {
      matches.push(currentMatch);
    }

    // Create lobbies for each match
    for (const match of matches) {
      await this.createLobby(match, gameType);
    }
  }

  private async createLobby(players: IQueueEntry[], gameType: string): Promise<void> {
    const session = await QueueEntry.startSession();
    session.startTransaction();

    try {
      // Create a new lobby
      const lobby = new Lobby({
        name: `Match ${Date.now()}`,
        host: players[0].player,
        maxPlayers: players.length,
        isPrivate: false,
        gameType,
        players: players.map(p => p.player),
        currentPlayers: players.map(p => ({
          playerId: p.player,
          username: (p.player as any).username,
          isReady: false,
          joinedAt: new Date()
        }))
      });

      await lobby.save();

      // Update queue entries
      await QueueEntry.updateMany(
        { _id: { $in: players.map(p => p._id) } },
        { 
          status: 'matched',
          matchId: lobby._id
        }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
} 