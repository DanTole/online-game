import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  rating: number;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
} 