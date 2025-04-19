import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    (req as AuthRequest).user = {
      _id: new Types.ObjectId(decoded.id),
      username: decoded.username,
      password: '', // Not needed for auth middleware
      rating: 0 // Default value
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const verifyToken = async (token: string): Promise<{ id: string; username: string }> => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string };
  } catch (error) {
    throw new Error('Invalid token');
  }
}; 