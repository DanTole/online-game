import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Lobby, ILobby, LobbyDocument, PlayerState } from '../models/Lobby';
import { IUser } from '../models/User';
import { AuthRequest } from '../types/auth';

interface PopulatedLobby extends Omit<ILobby, 'host' | 'players'> {
  _id: Types.ObjectId;
  host: IUser;
  players: IUser[];
  currentPlayers: PlayerState[];
}

const toLeanLobby = (lobby: LobbyDocument): PopulatedLobby => ({
  _id: lobby._id,
  name: lobby.name,
  host: lobby.host as unknown as IUser,
  maxPlayers: lobby.maxPlayers,
  isPrivate: lobby.isPrivate,
  password: lobby.password,
  players: lobby.players as unknown as IUser[],
  gameType: lobby.gameType,
  status: lobby.status,
  currentPlayers: lobby.currentPlayers,
  createdAt: lobby.createdAt,
  updatedAt: lobby.updatedAt
});

export const createLobby = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as IUser;
    const { name, maxPlayers, isPrivate, password, gameType } = req.body;

    const lobby = new Lobby({
      name,
      host: user._id,
      maxPlayers,
      isPrivate,
      password,
      gameType,
      players: [user._id]
    });

    await lobby.save();
    res.status(201).json(toLeanLobby(lobby));
  } catch (error) {
    res.status(500).json({ message: 'Error creating lobby', error });
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
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    if (!lobby.canJoin(req.user._id.toString())) {
      return res.status(400).json({ message: 'Cannot join lobby' });
    }

    await lobby.addPlayer(req.user._id.toString());
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

    const { lobbyId } = req.params;
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    await lobby.removePlayer(req.user._id.toString());
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

    const { lobbyId } = req.params;
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    const success = lobby.togglePlayerReady(req.user._id.toString());
    if (!success) {
      return res.status(400).json({ message: 'Failed to toggle ready status' });
    }

    res.json(toLeanLobby(lobby));
  } catch (error) {
    res.status(500).json({ message: 'Error toggling ready status', error });
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