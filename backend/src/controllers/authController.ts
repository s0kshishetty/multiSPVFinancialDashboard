import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, signAuthToken } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

const publicUser = (user: { id: number; email: string; role: string; riskThreshold: string; cashBalance: number }) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  riskThreshold: user.riskThreshold,
  cashBalance: user.cashBalance,
});

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and a password of at least 6 characters are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Passwords are never stored directly. bcrypt stores a one-way hash instead.
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'INVESTOR',
        riskThreshold: 'MEDIUM',
        cashBalance: 500000000,
      },
    });

    const safeUser = publicUser(user);
    const token = signAuthToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = publicUser(user);
    const token = signAuthToken({ id: user.id, email: user.email, role: user.role });

    res.json({ token, user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: publicUser(user) });
};
