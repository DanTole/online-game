import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { GameSessionManager } from './gameSessionManager';
import { IWsMessage, WsMessageType } from '../types/game';
import { verifyToken } from '../middleware/auth';
import { Types } from 'mongoose';

interface SocketData {
  user: {
    _id: Types.ObjectId;
    username: string;
  };
}

export class WebSocketServer {
  private static instance: WebSocketServer;
  private io: Server<SocketData>;
  private gameSessionManager: GameSessionManager;

  private constructor(httpServer: HttpServer) {
    this.io = new Server<SocketData>(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.gameSessionManager = GameSessionManager.getInstance();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  public static getInstance(httpServer?: HttpServer): WebSocketServer {
    if (!WebSocketServer.instance && httpServer) {
      WebSocketServer.instance = new WebSocketServer(httpServer);
    }
    return WebSocketServer.instance;
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = await verifyToken(token);
        socket.data.user = {
          _id: new Types.ObjectId(decoded.id),
          username: decoded.username
        };
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.user.username}`);

      // Join game session
      socket.on('game:join', async (sessionId: string) => {
        try {
          const session = await this.gameSessionManager.joinSession(
            sessionId,
            socket.data.user._id.toString()
          );
          socket.join(sessionId);
          this.io.to(sessionId).emit('game:state', {
            type: 'game:state',
            data: session.state,
            timestamp: Date.now()
          });
        } catch (error) {
          socket.emit('game:error', {
            type: 'game:error',
            data: { message: 'Failed to join game' },
            timestamp: Date.now()
          });
        }
      });

      // Leave game session
      socket.on('game:leave', async (sessionId: string) => {
        try {
          await this.gameSessionManager.leaveSession(
            sessionId,
            socket.data.user._id.toString()
          );
          socket.leave(sessionId);
          this.io.to(sessionId).emit('game:state', {
            type: 'game:state',
            data: (await this.gameSessionManager.getSession(sessionId))?.state,
            timestamp: Date.now()
          });
        } catch (error) {
          socket.emit('game:error', {
            type: 'game:error',
            data: { message: 'Failed to leave game' },
            timestamp: Date.now()
          });
        }
      });

      // Game command
      socket.on('game:command', async (sessionId: string, command: any) => {
        try {
          await this.gameSessionManager.addCommand(sessionId, {
            type: command.type,
            playerId: socket.data.user._id.toString(),
            timestamp: Date.now(),
            data: command.data
          });

          this.io.to(sessionId).emit('game:command', {
            type: 'game:command',
            data: command,
            timestamp: Date.now()
          });
        } catch (error) {
          socket.emit('game:error', {
            type: 'game:error',
            data: { message: 'Failed to process command' },
            timestamp: Date.now()
          });
        }
      });

      // Disconnect
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.data.user.username}`);
        // Handle any cleanup needed
      });
    });
  }

  public broadcastToSession(sessionId: string, message: IWsMessage): void {
    this.io.to(sessionId).emit(message.type, message);
  }

  public emitToUser(userId: string, message: IWsMessage): void {
    const sockets = Array.from(this.io.sockets.sockets.values());
    for (const socket of sockets) {
      if (socket.data.user._id.toString() === userId) {
        socket.emit(message.type, message);
      }
    }
  }
} 