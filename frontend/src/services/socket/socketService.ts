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
    if (this.socket) {
      console.log('Socket already connected, skipping connection');
      return;
    }

    // Make sure we have a token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot connect to socket');
      return;
    }

    console.log('Connecting to socket server at:', this.API_URL);
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
    if (!this.socket) {
      console.warn('Socket not connected, attempting to connect before joining room');
      this.connect();
    }
    
    if (!this.socket) {
      console.error('Failed to connect socket, cannot join room');
      return;
    }
    
    console.log('Joining room:', roomId);
    this.socket.emit('room:join', { roomId });
  }

  leaveRoom(roomId: string) {
    if (!this.socket) return;
    console.log('Leaving room:', roomId);
    this.socket.emit('room:leave', { roomId });
  }

  startGame(roomId: string) {
    if (!this.socket) {
      console.warn('Socket not connected, attempting to connect before starting game');
      this.connect();
    }
    
    if (!this.socket) {
      console.error('Failed to connect socket, cannot start game');
      return;
    }
    
    console.log('Starting game in room:', roomId);
    this.socket.emit('game:start', { roomId });
  }

  movePlayer(position: Position) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot move player');
      return;
    }
    
    console.log('Moving player:', position);
    this.socket.emit('player:move', { position });
    
    // TEMPORARY: Update player position locally for testing
    const state = store.getState() as { auth: { user: { id: string } } };
    const playerId = state.auth?.user?.id || Object.keys(
      (store.getState() as any).game?.players || {}
    )[0];
    
    if (playerId) {
      // Calculate new position (simple movement without physics)
      const gameState = (store.getState() as any).game;
      const player = gameState?.players?.[playerId];
      
      if (player) {
        const newPosition = {
          x: player.position.x + position.x * 5, // 5 is player speed
          y: player.position.y + position.y * 5
        };
        
        // Update position in store
        store.dispatch(updatePlayerPosition({
          playerId,
          position: newPosition
        }));
      }
    }
  }

  rotatePlayer(rotation: number) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot rotate player');
      return;
    }
    
    console.log('Rotating player:', rotation);
    this.socket.emit('player:rotate', { rotation });
    
    // TEMPORARY: Update player rotation locally for testing
    const state = store.getState() as { auth: { user: { id: string } } };
    const playerId = state.auth?.user?.id || Object.keys(
      (store.getState() as any).game?.players || {}
    )[0];
    
    if (playerId) {
      store.dispatch(updatePlayerRotation({
        playerId,
        rotation
      }));
    }
  }

  shoot(position: Position, direction: number) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot shoot');
      return;
    }
    
    console.log('Shooting from position:', position, 'direction:', direction);
    this.socket.emit('player:shoot', { position, direction });
    
    // TEMPORARY: Create a local projectile for immediate feedback
    try {
      const state = store.getState() as { auth: { user: { id: string } } };
      const playerId = state.auth?.user?.id || Object.keys(
        (store.getState() as any).game?.players || {}
      )[0];
      
      if (playerId) {
        // Generate a temporary projectile ID
        const projectileId = `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Calculate projectile velocity safely
        const speed = 10;
        // Make sure direction is a valid number
        const safeDirection = Number.isFinite(direction) ? direction : 0;
        const velocity = {
          x: Math.cos(safeDirection) * speed,
          y: Math.sin(safeDirection) * speed
        };
        
        // Ensure no NaN or Infinity values in velocity
        if (!Number.isFinite(velocity.x)) velocity.x = 0;
        if (!Number.isFinite(velocity.y)) velocity.y = 0;
        
        // Create a new projectile
        const projectile: Projectile = {
          id: projectileId,
          playerId: playerId,
          position: { ...position }, // Clone position
          velocity: velocity,
          damage: 10,
          createdAt: Date.now()  // Use current timestamp for createdAt
        };
        
        console.log('Creating local projectile:', projectile);
        store.dispatch(addProjectile(projectile));
        
        // Remove the projectile after a short time
        setTimeout(() => {
          store.dispatch(removeProjectile({ projectileId }));
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating local projectile:', err);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
