import { Request, Response } from 'express';
import { Lobby, LobbyDocument, PlayerState } from '../models/Lobby';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    username: string;
  };
}

interface PopulatedLobby {
  _id: Types.ObjectId;
  name: string;
  host: Types.ObjectId;
  maxPlayers: number;
  currentPlayers: PlayerState[];
  isPrivate: boolean;
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
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export const createLobby = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, maxPlayers, isPrivate, password } = req.body;

    const lobby = await Lobby.create({
      name,
      host: req.user._id,
      maxPlayers,
      isPrivate,
      password,
      currentPlayers: [{
        playerId: req.user._id,
        username: req.user.username,
        isReady: false,
        joinedAt: new Date()
      }]
    });

    res.status(201).json(toLeanLobby(lobby));
  } catch (error) {
    res.status(400).json({ message: 'Error creating lobby', error });
  }
};

export const getLobbies = async (req: Request, res: Response) => {
  try {
    const lobbies = await Lobby.find({ status: 'waiting' })
      .select('-password')
      .lean();
    res.json(lobbies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lobbies', error });
  }
};

export const getLobby = async (req: Request, res: Response) => {
  try {
    const lobby = await Lobby.findById(req.params.id)
      .select('-password')
      .lean();
    
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    res.json(lobby);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lobby', error });
  }
};

export const joinLobby = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { password } = req.body;
    const lobby = await Lobby.findById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    if (lobby.isPrivate && lobby.password !== password) {
      return res.status(403).json({ message: 'Invalid password' });
    }

    if (!lobby.canJoin(req.user._id)) {
      return res.status(400).json({ message: 'Cannot join lobby' });
    }

    const success = lobby.addPlayer(req.user._id, req.user.username);
    if (!success) {
      return res.status(400).json({ message: 'Failed to join lobby' });
    }

    await lobby.save();
    res.json(toLeanLobby(lobby));
  } catch (error) {
    res.status(500).json({ message: 'Error joining lobby', error });
  }
};

export const leaveLobby = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    const success = lobby.removePlayer(req.user._id);
    if (!success) {
      return res.status(400).json({ message: 'Failed to leave lobby' });
    }

    // If no players left, delete the lobby
    if (lobby.currentPlayers.length === 0) {
      await lobby.deleteOne();
      return res.json({ message: 'Lobby deleted' });
    }

    // If host left, assign new host
    if (lobby.host.equals(req.user._id)) {
      lobby.host = lobby.currentPlayers[0].playerId;
    }

    await lobby.save();
    res.json(toLeanLobby(lobby));
  } catch (error) {
    res.status(500).json({ message: 'Error leaving lobby', error });
  }
};

export const toggleReady = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    const success = lobby.togglePlayerReady(req.user._id);
    if (!success) {
      return res.status(400).json({ message: 'Failed to toggle ready state' });
    }

    await lobby.save();
    res.json(toLeanLobby(lobby));
  } catch (error) {
    res.status(500).json({ message: 'Error toggling ready state', error });
  }
};

export const startGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    // Only host can start the game
    if (!lobby.host.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only host can start the game' });
    }

    const success = lobby.startGame();
    if (!success) {
      return res.status(400).json({ message: 'Cannot start game' });
    }

    await lobby.save();
    res.json(toLeanLobby(lobby));
  } catch (error) {
    res.status(500).json({ message: 'Error starting game', error });
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