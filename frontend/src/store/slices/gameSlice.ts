import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Player, Projectile, Obstacle, Position } from '../../types';

// Initial state
const initialState: GameState = {
  roomId: null,
  players: {},
  projectiles: {},
  obstacles: [],
  status: 'waiting',
  timeRemaining: 0,
  winner: null,
};

// Slice
const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Game setup
    joinGame: (state, action: PayloadAction<{ roomId: string }>) => {
      state.roomId = action.payload.roomId;
      state.status = 'waiting';
      state.winner = null;
    },
    leaveGame: (state) => {
      return initialState;
    },
    startGame: (state, action: PayloadAction<{ timeLimit: number }>) => {
      state.status = 'countdown';
      state.timeRemaining = action.payload.timeLimit;
    },
    startPlaying: (state) => {
      state.status = 'playing';
    },
    endGame: (state, action: PayloadAction<{ winner: string | null }>) => {
      state.status = 'finished';
      state.winner = action.payload.winner;
    },
    
    // Player management
    addPlayer: (state, action: PayloadAction<Player>) => {
      state.players[action.payload.id] = action.payload;
    },
    removePlayer: (state, action: PayloadAction<{ playerId: string }>) => {
      delete state.players[action.payload.playerId];
    },
    updatePlayerPosition: (state, action: PayloadAction<{ playerId: string; position: Position }>) => {
      if (state.players[action.payload.playerId]) {
        state.players[action.payload.playerId].position = action.payload.position;
      }
    },
    updatePlayerRotation: (state, action: PayloadAction<{ playerId: string; rotation: number }>) => {
      if (state.players[action.payload.playerId]) {
        state.players[action.payload.playerId].rotation = action.payload.rotation;
      }
    },
    updatePlayerHealth: (state, action: PayloadAction<{ playerId: string; health: number }>) => {
      if (state.players[action.payload.playerId]) {
        state.players[action.payload.playerId].health = action.payload.health;
      }
    },
    updatePlayerScore: (state, action: PayloadAction<{ playerId: string; score: number }>) => {
      if (state.players[action.payload.playerId]) {
        state.players[action.payload.playerId].score = action.payload.score;
      }
    },
    
    // Projectile management
    addProjectile: (state, action: PayloadAction<Projectile>) => {
      state.projectiles[action.payload.id] = action.payload;
    },
    removeProjectile: (state, action: PayloadAction<{ projectileId: string }>) => {
      delete state.projectiles[action.payload.projectileId];
    },
    updateProjectilePosition: (state, action: PayloadAction<{ projectileId: string; position: Position }>) => {
      if (state.projectiles[action.payload.projectileId]) {
        state.projectiles[action.payload.projectileId].position = action.payload.position;
      }
    },
    
    // Obstacle management
    setObstacles: (state, action: PayloadAction<Obstacle[]>) => {
      state.obstacles = action.payload;
    },
    
    // Time management
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    
    // Full state update (for synchronization)
    syncGameState: (state, action: PayloadAction<GameState>) => {
      return action.payload;
    },
  },
});

export const {
  joinGame,
  leaveGame,
  startGame,
  startPlaying,
  endGame,
  addPlayer,
  removePlayer,
  updatePlayerPosition,
  updatePlayerRotation,
  updatePlayerHealth,
  updatePlayerScore,
  addProjectile,
  removeProjectile,
  updateProjectilePosition,
  setObstacles,
  updateTimeRemaining,
  syncGameState,
} = gameSlice.actions;

export default gameSlice.reducer;