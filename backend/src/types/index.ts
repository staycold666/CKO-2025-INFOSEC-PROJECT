import { Document } from 'mongoose';

// User interfaces
export interface IUserStats {
  wins: number;
  losses: number;
  totalGames: number;
  totalScore: number;
  accuracy: number;
}

export interface IUser extends Document {
  _id: any;
  username: string;
  email: string;
  password: string;
  avatar: string;
  isAdmin: boolean;
  stats: IUserStats;
  matchPassword(enteredPassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

// Room interfaces
export interface IGameSettings {
  timeLimit: number;
  scoreLimit: number;
  mapId: string;
  friendlyFire: boolean;
}

export interface IRoom extends Document {
  name: string;
  host: IUser['_id'];
  players: IUser['_id'][];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  settings: IGameSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Game interfaces
export interface IPlayerResult {
  player: IUser['_id'];
  score: number;
  kills: number;
  deaths: number;
  accuracy: number;
}

export interface IGame extends Document {
  room: IRoom['_id'];
  players: IPlayerResult[];
  winner: IUser['_id'] | null;
  duration: number;
  mapId: string;
  settings: {
    timeLimit: number;
    scoreLimit: number;
    friendlyFire: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Game state interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  username: string;
  position: Position;
  rotation: number;
  health: number;
  score: number;
  isActive: boolean;
  lastShot: number;
  color: string;
}

export interface Projectile {
  id: string;
  playerId: string;
  position: Position;
  velocity: Position;
  damage: number;
  createdAt: number;
}

export interface Obstacle {
  id: string;
  position: Position;
  width: number;
  height: number;
  type: 'wall' | 'barrier' | 'cover';
}

export interface GameState {
  roomId: string;
  players: Record<string, Player>;
  projectiles: Record<string, Projectile>;
  obstacles: Obstacle[];
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';
  timeRemaining: number;
  winner: string | null;
  settings: IGameSettings;
}