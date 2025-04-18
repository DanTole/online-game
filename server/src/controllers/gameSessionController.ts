import { Request, Response } from 'express';
import { GameSession, GameSessionDocument } from '../models/gameSession';
import { Lobby, LobbyDocument } from '../models/Lobby';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';

export const createGameSession = async (req: AuthRequest, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ message: 'Game already in progress' });
    }

    if (!req.user || !lobby.host.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can start a game session' });
    }

    const gameSession = {
      lobbyId: lobby._id,
      players: lobby.currentPlayers.map(player => ({
        playerId: player.playerId,
        username: player.username,
        score: 0,
        isReady: player.isReady
      })),
      status: 'waiting',
      createdAt: new Date()
    };

    lobby.status = 'playing';
    await lobby.save();

    res.status(201).json(gameSession);
  } catch (error) {
    console.error('Error creating game session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const joinGameSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const gameSession = await GameSession.findById(sessionId);
    if (!gameSession) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    if (gameSession.status !== 'waiting') {
      return res.status(400).json({ message: 'Game session is not accepting new players' });
    }

    if (gameSession.players.length >= gameSession.maxPlayers) {
      return res.status(400).json({ message: 'Game session is full' });
    }

    const isAlreadyJoined = gameSession.players.some(
      player => player.userId.toString() === req.user!._id.toString()
    );

    if (isAlreadyJoined) {
      return res.status(400).json({ message: 'Player already joined the session' });
    }

    gameSession.players.push({
      userId: req.user._id,
      ready: false,
      score: 0,
    });

    await gameSession.save();
    res.json(gameSession);
  } catch (error) {
    console.error('Error joining game session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getGameSession = async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    const gameSession = {
      lobbyId: lobby._id,
      players: lobby.currentPlayers.map(player => ({
        playerId: player.playerId,
        username: player.username,
        score: 0,
        isReady: player.isReady
      })),
      status: lobby.status,
      createdAt: lobby.createdAt
    };

    res.json(gameSession);
  } catch (error) {
    console.error('Error getting game session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePlayerReady = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { ready } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const gameSession = await GameSession.findById(sessionId);
    if (!gameSession) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    if (gameSession.status !== 'waiting') {
      return res.status(400).json({ message: 'Game session is not in waiting state' });
    }

    const playerIndex = gameSession.players.findIndex(
      player => player.userId.toString() === req.user!._id.toString()
    );

    if (playerIndex === -1) {
      return res.status(404).json({ message: 'Player not found in game session' });
    }

    gameSession.players[playerIndex].ready = ready;
    await gameSession.save();

    // Check if all players are ready to start the game
    const allPlayersReady = gameSession.players.every(player => player.ready);
    if (allPlayersReady && gameSession.players.length >= 2) {
      gameSession.status = 'playing';
      await gameSession.save();
    }

    res.json(gameSession);
  } catch (error) {
    console.error('Error updating player ready status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateGameSession = async (req: AuthRequest, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { status } = req.body;
    
    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    if (!req.user || !lobby.host.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can update the game session' });
    }

    if (status) {
      lobby.status = status;
    }

    await lobby.save();

    res.json({ message: 'Game session updated successfully' });
  } catch (error) {
    console.error('Error updating game session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const endGameSession = async (req: AuthRequest, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    if (!req.user || !lobby.host.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can end the game session' });
    }

    lobby.endGame();
    await lobby.save();

    res.json({ message: 'Game session ended successfully' });
  } catch (error) {
    console.error('Error ending game session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 