import express from 'express';
import { body } from 'express-validator';
import { 
  getRooms, 
  getRoom, 
  createRoom, 
  updateRoomSettings, 
  joinRoom, 
  leaveRoom, 
  startGame 
} from '../controllers/roomController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private
router.get('/', protect, getRooms);

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', protect, getRoom);

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post(
  '/',
  [
    protect,
    body('name', 'Name is required').not().isEmpty(),
    body('settings.timeLimit', 'Time limit must be between 60 and 600 seconds').optional().isInt({ min: 60, max: 600 }),
    body('settings.scoreLimit', 'Score limit must be between 5 and 50').optional().isInt({ min: 5, max: 50 }),
    body('settings.mapId', 'Map ID is required').optional().not().isEmpty(),
    body('settings.friendlyFire', 'Friendly fire must be a boolean').optional().isBoolean()
  ],
  createRoom
);

// @route   PUT /api/rooms/:id/settings
// @desc    Update room settings
// @access  Private
router.put(
  '/:id/settings',
  [
    protect,
    body('settings.timeLimit', 'Time limit must be between 60 and 600 seconds').optional().isInt({ min: 60, max: 600 }),
    body('settings.scoreLimit', 'Score limit must be between 5 and 50').optional().isInt({ min: 5, max: 50 }),
    body('settings.mapId', 'Map ID is required').optional().not().isEmpty(),
    body('settings.friendlyFire', 'Friendly fire must be a boolean').optional().isBoolean()
  ],
  updateRoomSettings
);

// @route   POST /api/rooms/:id/join
// @desc    Join a room
// @access  Private
router.post('/:id/join', protect, joinRoom);

// @route   POST /api/rooms/:id/leave
// @desc    Leave a room
// @access  Private
router.post('/:id/leave', protect, leaveRoom);

// @route   POST /api/rooms/:id/start
// @desc    Start a game
// @access  Private
router.post('/:id/start', protect, startGame);

export default router;