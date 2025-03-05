import mongoose from 'mongoose';
import { IGame } from '../types';

// Player result schema
const playerResultSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  kills: {
    type: Number,
    default: 0
  },
  deaths: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  }
});

// Game schema
const gameSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    players: [playerResultSchema],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    duration: {
      type: Number, // in seconds
      required: true
    },
    mapId: {
      type: String,
      required: true
    },
    settings: {
      timeLimit: {
        type: Number,
        required: true
      },
      scoreLimit: {
        type: Number,
        required: true
      },
      friendlyFire: {
        type: Boolean,
        required: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Create model
const Game = mongoose.model<IGame>('Game', gameSchema);

export default Game;