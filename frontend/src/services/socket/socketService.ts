import { io, Socket } from 'socket.io-client';
import { store } from '../../store';
import {
  addPlayer,
  removePlayer,
  updatePlayerPosition,
  updatePlayerRotation,
  updatePlayerHealth,
  updatePlayerScore,
  addProjectile,
  removeProjectile,
  updateProjectilePosition,
  syncGameState,
  startPlaying,
  endGame,
  updateTimeRemaining,
} from '../../store/slices/gameSlice';
import { updateRoomStatus } from '../../store/slices/lobbySlice';
import { Player, Projectile, Position, GameState } from '../../types';

class SocketService {
  private socket: Socket | null = null;
  private readonly API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Initialize socket connection
  connect() {
    if (this.socket) return;

    // Make sure we have a token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot connect to socket');
      return;
    }

    this.socket = io(this.API_URL, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    this.setupEventListeners();
    console.log('Socket connection initialized');
  }

  // Disconnect socket
  disconnect() {
    if (!this.socket) return;

    this.socket.disconnect();
    this.socket = null;
  }

  // Setup event listeners
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    // Game events
    this.socket.on('game:start', () => {
      store.dispatch(startPlaying());
    });

    this.socket.on('game:end', ({ winner }: { winner: string | null }) => {
      store.dispatch(endGame({ winner }));
      const state = store.getState() as { game: { roomId: string | null } };
      store.dispatch(updateRoomStatus({
        roomId: state.game.roomId || '',
        status: 'finished'
      }));
    });

    this.socket.on('game:sync', (gameState: GameState) => {
      store.dispatch(syncGameState(gameState));
    });

    this.socket.on('game:time', (time: number) => {
      store.dispatch(updateTimeRemaining(time));
    });

    // Player events
    this.socket.on('player:join', (player: Player) => {
      store.dispatch(addPlayer(player));
    });

    this.socket.on('player:leave', ({ playerId }: { playerId: string }) => {
      store.dispatch(removePlayer({ playerId }));
    });

    this.socket.on('player:move', ({ playerId, position }: { playerId: string; position: Position }) => {
      store.dispatch(updatePlayerPosition({ playerId, position }));
    });

    this.socket.on('player:rotate', ({ playerId, rotation }: { playerId: string; rotation: number }) => {
      store.dispatch(updatePlayerRotation({ playerId, rotation }));
    });

    this.socket.on('player:health', ({ playerId, health }: { playerId: string; health: number }) => {
      store.dispatch(updatePlayerHealth({ playerId, health }));
    });

    this.socket.on('player:score', ({ playerId, score }: { playerId: string; score: number }) => {
      store.dispatch(updatePlayerScore({ playerId, score }));
    });

    // Projectile events
    this.socket.on('projectile:create', (projectile: Projectile) => {
      store.dispatch(addProjectile(projectile));
    });

    this.socket.on('projectile:remove', ({ projectileId }: { projectileId: string }) => {
      store.dispatch(removeProjectile({ projectileId }));
    });

    this.socket.on('projectile:move', ({ projectileId, position }: { projectileId: string; position: Position }) => {
      store.dispatch(updateProjectilePosition({ projectileId, position }));
    });
  }

  // Emit events
  joinRoom(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('room:join', { roomId });
  }

  leaveRoom(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('room:leave', { roomId });
  }

  startGame(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('game:start', { roomId });
  }

  movePlayer(position: Position) {
    if (!this.socket) return;
    this.socket.emit('player:move', { position });
  }

  rotatePlayer(rotation: number) {
    if (!this.socket) return;
    this.socket.emit('player:rotate', { rotation });
  }

  shoot(position: Position, direction: number) {
    if (!this.socket) return;
    this.socket.emit('player:shoot', { position, direction });
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;