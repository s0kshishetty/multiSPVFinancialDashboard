import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing. Add it to backend/.env before starting the server.');
  }
  return secret;
};

// This middleware protects API routes by requiring a valid JWT in the Authorization header.
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret()) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const signAuthToken = (user: AuthUser) => {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '1d' });
};
