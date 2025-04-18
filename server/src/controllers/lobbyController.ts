import { Request, Response } from 'express';
import { Lobby, LobbyDocument, PlayerState } from '../models/Lobby';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';

interface PopulatedLobby {
  _id: Types.ObjectId;
  name: string;
  host: Types.ObjectId;
  maxPlayers: number;
  currentPlayers: PlayerState[];
  isPrivate: boolean;
  password?: string;
  gameType: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to convert Mongoose document to lean lobby object
const toLeanLobby = (doc: LobbyDocument): PopulatedLobby => ({
  _id: doc._id,
  name: doc.name,
  host: doc.host,
  maxPlayers: doc.maxPlayers,
  currentPlayers: doc.currentPlayers,
  isPrivate: doc.isPrivate,
  password: doc.password,
  gameType: doc.gameType,
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export const createLobby = async (req: AuthRequest, res: Response) => {
  try {
    const { name, maxPlayers, isPrivate, password, gameType } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = new Lobby({
      name,
      host: req.user._id,
      maxPlayers,
      isPrivate,
      password,
      gameType,
      players: [req.user._id],
      currentPlayers: [{
        playerId: req.user._id,
        username: req.body.username,
        isReady: false,
        joinedAt: new Date()
      }]
    });

    await lobby.save();
    res.status(201).json(toLeanLobby(lobby));
  } catch (error) {
    console.error('Error creating lobby:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLobbies = async (req: Request, res: Response) => {
  try {
    const lobbies = await Lobby.find({ status: 'waiting' });
    res.json(lobbies.map(toLeanLobby));
  } catch (error) {
    console.error('Error getting lobbies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLobby = async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const lobby = await Lobby.findById(lobbyId);

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    res.json(toLeanLobby(lobby));
  } catch (error) {
    console.error('Error getting lobby:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const joinLobby = async (req: AuthRequest, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { password } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    if (!lobby.canJoin(req.user._id, password)) {
      return res.status(400).json({ message: 'Cannot join lobby' });
    }

    await lobby.addPlayer(req.user._id, req.body.username);
    res.json(toLeanLobby(lobby));
  } catch (error) {
    console.error('Error joining lobby:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const leaveLobby = async (req: AuthRequest, res: Response) => {
  try {
    const { lobbyId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    await lobby.removePlayer(req.user._id);
    res.json({ message: 'Successfully left lobby' });
  } catch (error) {
    console.error('Error leaving lobby:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleReady = async (req: AuthRequest, res: Response) => {
  try {
    const { lobbyId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    const success = lobby.togglePlayerReady(req.user._id);
    if (!success) {
      return res.status(400).json({ message: 'Failed to toggle ready status' });
    }

    await lobby.save();
    res.json(toLeanLobby(lobby));
  } catch (error) {
    console.error('Error toggling ready status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const startGame = async (req: AuthRequest, res: Response) => {
  try {
    const { lobbyId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    if (!lobby.host.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can start the game' });
    }

    const success = lobby.startGame();
    if (!success) {
      return res.status(400).json({ message: 'Cannot start game' });
    }

    await lobby.save();
    res.json(toLeanLobby(lobby));
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const endGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    // Only host can end the game
    if (!lobby.host.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only host can end the game' });
    }

    lobby.endGame();
    await lobby.save();
    res.json(toLeanLobby(lobby));
  } catch (error) {
    res.status(500).json({ message: 'Error ending game', error });
  }
}; 