import mongoose from 'mongoose';
import { IRoom } from '../types';

// Game settings schema
const gameSettingsSchema = new mongoose.Schema({
  timeLimit: {
    type: Number,
    default: 300, // 5 minutes
    min: 60,
    max: 600
  },
  scoreLimit: {
    type: Number,
    default: 20,
    min: 5,
    max: 50
  },
  mapId: {
    type: String,
    default: 'map1'
  },
  friendlyFire: {
    type: Boolean,
    default: false
  }
});

// Room schema
const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    maxPlayers: {
      type: Number,
      default: 8,
      min: 2,
      max: 16
    },
    status: {
      type: String,
      enum: ['waiting', 'playing', 'finished'],
      default: 'waiting'
    },
    settings: {
      type: gameSettingsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Create model
const Room = mongoose.model<IRoom>('Room', roomSchema);

export default Room;