import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Room from '../models/Room';
import { IRoom, IUser } from '../types';

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
export const getRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find()
      .populate('host', 'username email avatar')
      .populate('players', 'username email avatar');

    res.json(rooms);
  } catch (error: any) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
export const getRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('host', 'username email avatar')
      .populate('players', 'username email avatar');

    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    res.json(room);
  } catch (error: any) {
    console.error('Get room error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
export const createRoom = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { name, settings } = req.body;

    // Create room
    const room = await Room.create({
      name,
      host: req.user._id,
      players: [req.user._id],
      settings: settings || {}
    }) as IRoom;

    // Populate host and players
    const populatedRoom = await Room.findById(room._id)
      .populate('host', 'username email avatar')
      .populate('players', 'username email avatar');

    res.status(201).json(populatedRoom);
  } catch (error: any) {
    console.error('Create room error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update room settings
// @route   PUT /api/rooms/:id/settings
// @access  Private
export const updateRoomSettings = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const room = await Room.findById(req.params.id) as IRoom;

    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    // Check if user is the host
    if (room.host.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Only the host can update room settings' });
      return;
    }

    // Check if game is already in progress
    if (room.status !== 'waiting') {
      res.status(400).json({ message: 'Cannot update settings while game is in progress' });
      return;
    }

    // Update settings
    room.settings = {
      ...room.settings,
      ...req.body.settings
    };

    // Save room
    const updatedRoom = await room.save();

    // Populate host and players
    const populatedRoom = await Room.findById(updatedRoom._id)
      .populate('host', 'username email avatar')
      .populate('players', 'username email avatar');

    res.json(populatedRoom);
  } catch (error: any) {
    console.error('Update room settings error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Join a room
// @route   POST /api/rooms/:id/join
// @access  Private
export const joinRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id) as IRoom;

    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    // Check if game is already in progress
    if (room.status !== 'waiting') {
      res.status(400).json({ message: 'Cannot join a game in progress' });
      return;
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      res.status(400).json({ message: 'Room is full' });
      return;
    }

    // Check if user is already in the room
    if (room.players.some(player => player.toString() === req.user._id.toString())) {
      res.status(400).json({ message: 'You are already in this room' });
      return;
    }

    // Add user to players
    room.players.push(req.user._id);

    // Save room
    const updatedRoom = await room.save();

    // Populate host and players
    const populatedRoom = await Room.findById(updatedRoom._id)
      .populate('host', 'username email avatar')
      .populate('players', 'username email avatar');

    res.json(populatedRoom);
  } catch (error: any) {
    console.error('Join room error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Leave a room
// @route   POST /api/rooms/:id/leave
// @access  Private
export const leaveRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id) as IRoom;

    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    // Check if user is in the room
    if (!room.players.some(player => player.toString() === req.user._id.toString())) {
      res.status(400).json({ message: 'You are not in this room' });
      return;
    }

    // Remove user from players
    room.players = room.players.filter(player => player.toString() !== req.user._id.toString());

    // If host leaves, assign a new host if there are players left
    if (room.host.toString() === req.user._id.toString() && room.players.length > 0) {
      room.host = room.players[0];
    }

    // If no players left, delete the room
    if (room.players.length === 0) {
      await Room.findByIdAndDelete(room._id);
      res.json({ message: 'Room deleted' });
      return;
    }

    // Save room
    const updatedRoom = await room.save();

    // Populate host and players
    const populatedRoom = await Room.findById(updatedRoom._id)
      .populate('host', 'username email avatar')
      .populate('players', 'username email avatar');

    res.json(populatedRoom);
  } catch (error: any) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Start a game
// @route   POST /api/rooms/:id/start
// @access  Private
export const startGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id) as IRoom;

    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    // Check if user is the host
    if (room.host.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Only the host can start the game' });
      return;
    }

    // Check if game is already in progress
    if (room.status !== 'waiting') {
      res.status(400).json({ message: 'Game is already in progress' });
      return;
    }

    // Check if there are enough players
    if (room.players.length < 2) {
      res.status(400).json({ message: 'Need at least 2 players to start the game' });
      return;
    }

    // Update room status
    room.status = 'playing';

    // Save room
    const updatedRoom = await room.save();

    // Populate host and players
    const populatedRoom = await Room.findById(updatedRoom._id)
      .populate('host', 'username email avatar')
      .populate('players', 'username email avatar');

    res.json(populatedRoom);
  } catch (error: any) {
    console.error('Start game error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};