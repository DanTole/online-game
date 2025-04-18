import { Request, Response } from 'express';
import { Lobby, ILobby } from '../models/Lobby';
import { User, IUser } from '../models/User';
import { Types, Document } from 'mongoose';

interface AuthRequest extends Request {
  user?: IUser & { _id: Types.ObjectId };
}

interface PopulatedLobby extends ILobby {
  host: Types.ObjectId;
  currentPlayers: Types.ObjectId[];
}

export const createLobby = async (req: AuthRequest, res: Response) => {
  try {
    const { name, maxPlayers, gameType, settings } = req.body;
    
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const lobby = new Lobby({
      name,
      host: req.user._id,
      maxPlayers,
      gameType,
      settings,
      currentPlayers: [req.user._id]
    });

    await lobby.save();
    res.status(201).json(lobby);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create lobby' });
  }
};

export const getLobbies = async (req: Request, res: Response) => {
  try {
    const { gameType, status } = req.query;
    const query: any = {};

    if (gameType) query.gameType = gameType;
    if (status) query.status = status;

    const lobbies = await Lobby.find(query)
      .populate('host', 'username displayName avatar')
      .populate('currentPlayers', 'username displayName avatar');
    
    res.json(lobbies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobbies' });
  }
};

export const getLobby = async (req: Request, res: Response) => {
  try {
    const lobby = await Lobby.findById(req.params.id)
      .populate('host', 'username displayName avatar')
      .populate('currentPlayers', 'username displayName avatar');
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    res.json(lobby);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobby' });
  }
};

export const joinLobby = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const lobby = await Lobby.findById(req.params.id) as PopulatedLobby;
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ error: 'Lobby is not accepting players' });
    }

    const userId = req.user._id;
    if (lobby.currentPlayers.some((player: Types.ObjectId) => player.equals(userId))) {
      return res.status(400).json({ error: 'Already in lobby' });
    }

    if (lobby.currentPlayers.length >= lobby.maxPlayers) {
      return res.status(400).json({ error: 'Lobby is full' });
    }

    lobby.currentPlayers.push(userId);
    await lobby.save();

    res.json(lobby);
  } catch (error) {
    res.status(400).json({ error: 'Failed to join lobby' });
  }
};

export const leaveLobby = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const lobby = await Lobby.findById(req.params.id) as PopulatedLobby;
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    const userId = req.user._id;
    if (!lobby.currentPlayers.some((player: Types.ObjectId) => player.equals(userId))) {
      return res.status(400).json({ error: 'Not in lobby' });
    }

    // If host leaves, assign new host or delete lobby
    if (lobby.host.equals(userId)) {
      if (lobby.currentPlayers.length > 1) {
        // Assign new host
        const newHost = lobby.currentPlayers.find((player: Types.ObjectId) => !player.equals(userId));
        if (newHost) {
          lobby.host = newHost;
        }
      } else {
        // Delete lobby if no players left
        await lobby.deleteOne();
        return res.json({ message: 'Lobby deleted' });
      }
    }

    lobby.currentPlayers = lobby.currentPlayers.filter(
      (player: Types.ObjectId) => !player.equals(userId)
    );
    await lobby.save();

    res.json(lobby);
  } catch (error) {
    res.status(400).json({ error: 'Failed to leave lobby' });
  }
};

export const startGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const lobby = await Lobby.findById(req.params.id) as PopulatedLobby;
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (!lobby.host.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only host can start the game' });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' });
    }

    if (lobby.currentPlayers.length < 2) {
      return res.status(400).json({ error: 'Not enough players' });
    }

    lobby.status = 'playing';
    await lobby.save();

    res.json(lobby);
  } catch (error) {
    res.status(400).json({ error: 'Failed to start game' });
  }
}; 