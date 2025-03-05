import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import { IUser } from '../types';

// Generate JWT token
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'default_jwt_secret';
  
  // Using any to bypass TypeScript's strict checking for jwt.sign
  return jwt.sign({ id }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { username, email, password } = req.body;

  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        message: 'Database not available. Please try again later.',
        devNote: 'MongoDB connection is not established. Start MongoDB to enable database features.'
      });
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      if (userExists.email === email) {
        res.status(400).json({ message: 'Email already in use' });
        return;
      } else {
        res.status(400).json({ message: 'Username already taken' });
        return;
      }
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password
    }) as IUser;

    if (user) {
      // Generate token
      const token = generateToken(user._id.toString());

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        stats: user.stats,
        token
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        message: 'Database not available. Please try again later.',
        devNote: 'MongoDB connection is not established. Start MongoDB to enable database features.'
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email }) as IUser;

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      stats: user.stats,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        message: 'Database not available. Please try again later.',
        devNote: 'MongoDB connection is not established. Start MongoDB to enable database features.'
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      stats: user.stats
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};