import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { IUser } from '../types';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id) as IUser;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is requesting their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && !req.user.isAdmin) {
      res.status(401).json({ message: 'Not authorized to access this profile' });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      stats: user.stats,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const user = await User.findById(req.params.id) as IUser;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is updating their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && !req.user.isAdmin) {
      res.status(401).json({ message: 'Not authorized to update this profile' });
      return;
    }

    // Update fields
    if (req.body.username) user.username = req.body.username;
    if (req.body.avatar) user.avatar = req.body.avatar;

    // Save user
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      isAdmin: updatedUser.isAdmin,
      stats: updatedUser.stats
    });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user stats
// @route   GET /api/users/:id/stats
// @access  Private
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id) as IUser;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is requesting their own stats or is an admin
    if (req.user._id.toString() !== req.params.id && !req.user.isAdmin) {
      res.status(401).json({ message: 'Not authorized to access these stats' });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      stats: user.stats
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};