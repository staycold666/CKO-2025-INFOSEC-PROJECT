// User related types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  stats?: UserStats;
}

export interface UserStats {
  wins: number;
  losses: number;
  totalGames: number;
  totalScore: number;
  accuracy: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Game related types
export interface GameRoom {
  id: string;
  name: string;
  host: User;
  players: User[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  settings: GameSettings;
}

export interface GameSettings {
  timeLimit: number; // in seconds
  scoreLimit: number;
  mapId: string;
  friendlyFire: boolean;
}

export interface Player {
  id: string;
  username: string;
  position: Position;
  rotation: number;
  health: number;
  score: number;
  isActive: boolean;
  lastShot: number; // timestamp
  color: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Projectile {
  id: string;
  playerId: string;
  position: Position;
  velocity: Position;
  damage: number;
  createdAt: number; // timestamp
}

export interface GameState {
  roomId: string | null;
  players: Record<string, Player>;
  projectiles: Record<string, Projectile>;
  obstacles: Obstacle[];
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';
  timeRemaining: number;
  winner: string | null;
}

export interface Obstacle {
  id: string;
  position: Position;
  width: number;
  height: number;
  type: 'wall' | 'barrier' | 'cover';
}

// Socket related types
export interface SocketEvent {
  type: string;
  payload: any;
}

// API related types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}