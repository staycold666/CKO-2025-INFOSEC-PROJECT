import express from 'express';
import { body } from 'express-validator';
import { getUserProfile, updateUserProfile, getUserStats } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', protect, getUserProfile);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put(
  '/:id',
  [
    protect,
    body('username', 'Username is required').optional(),
    body('avatar', 'Avatar URL must be valid').optional().isURL()
  ],
  updateUserProfile
);

// @route   GET /api/users/:id/stats
// @desc    Get user stats
// @access  Private
router.get('/:id/stats', protect, getUserStats);

export default router;