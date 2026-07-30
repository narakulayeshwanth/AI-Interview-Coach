import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, targetRole, experienceLevel } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email, and password are required');

  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already registered', 409);

  const user = await User.create({ name, email, password, targetRole, experienceLevel });
  const token = signToken(user._id.toString());

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { _id: user._id, name: user.name, email: user.email, targetRole: user.targetRole, xp: 0, level: 1, streak: 0 },
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required');

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update streak
  const today = new Date().toDateString();
  const lastActive = user.lastActiveDate?.toDateString();
  if (lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActive === yesterday.toDateString()) {
      user.streak += 1;
    } else if (lastActive !== today) {
      user.streak = 1;
    }
    user.lastActiveDate = new Date();
    await user.save();
  }

  const token = signToken(user._id.toString());
  res.json({
    success: true,
    data: {
      token,
      user: { _id: user._id, name: user.name, email: user.email, targetRole: user.targetRole, xp: user.xp, level: user.level, streak: user.streak },
    },
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId).select('-password');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const allowed = ['name', 'targetRole', 'experienceLevel', 'avatarUrl'];
  const updates: Record<string, unknown> = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
};
