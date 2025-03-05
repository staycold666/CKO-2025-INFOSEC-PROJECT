import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Position, Player, Projectile, Obstacle, GameState } from '../types';
import { PhysicsEngine } from './physicsEngine';

// Initialize physics engine
const physicsEngine = new PhysicsEngine();

// Game rooms storage
const gameRooms: Record<string, GameState> = {};

// Game loop interval
const GAME_TICK_RATE = 60; // 60 updates per second
const TICK_INTERVAL = 1000 / GAME_TICK_RATE;

// Create game events
export const createGameEvents = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>) => {
  // Game update loop
  setInterval(() => {
    updateGames(io);
  }, TICK_INTERVAL);

  // Socket connection
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Authenticate user
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('No token provided');
      socket.disconnect();
      return;
    }

    // Join room
    socket.on('room:join', ({ roomId }) => {
      console.log(`User ${socket.id} joining room ${roomId}`);
      
      // Join socket room
      socket.join(roomId);
      
      // If game room doesn't exist yet, it will be created when the game starts
      if (!gameRooms[roomId]) {
        console.log(`Game room ${roomId} doesn't exist yet`);
      }
    });

    // Leave room
    socket.on('room:leave', ({ roomId }) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      
      // Leave socket room
      socket.leave(roomId);
      
      // Remove player from game room if it exists
      if (gameRooms[roomId] && gameRooms[roomId].players[socket.id]) {
        delete gameRooms[roomId].players[socket.id];
        
        // Notify other players
        socket.to(roomId).emit('player:leave', { playerId: socket.id });
        
        // If no players left, delete the game room
        if (Object.keys(gameRooms[roomId].players).length === 0) {
          delete gameRooms[roomId];
        }
      }
    });

    // Start game
    socket.on('game:start', ({ roomId }) => {
      console.log(`Starting game in room ${roomId}`);
      
      // Create game room if it doesn't exist
      if (!gameRooms[roomId]) {
        gameRooms[roomId] = {
          roomId: roomId,
          players: {},
          projectiles: {},
          obstacles: physicsEngine.generateObstacles('map1'),
          status: 'countdown',
          timeRemaining: 5, // 5 second countdown
          winner: null,
          settings: {
            timeLimit: 300, // 5 minutes
            scoreLimit: 20,
            mapId: 'map1',
            friendlyFire: false
          }
        };
      } else {
        // Reset game room
        gameRooms[roomId].status = 'countdown';
        gameRooms[roomId].timeRemaining = 5;
        gameRooms[roomId].winner = null;
        gameRooms[roomId].projectiles = {};
      }
      
      // Notify all players in the room
      io.to(roomId).emit('game:countdown', { timeRemaining: 5 });
    });

    // Player movement
    socket.on('player:move', ({ position }) => {
      // Find the game room the player is in
      const roomId = findPlayerRoom(socket.id);
      if (!roomId) return;
      
      // Update player position
      const gameState = gameRooms[roomId];
      if (gameState && gameState.players[socket.id]) {
        const player = gameState.players[socket.id];
        
        // Calculate new position using physics engine
        const newPosition = physicsEngine.calculatePlayerMovement(player, position, gameState);
        
        if (newPosition) {
          // Update player position
          player.position = newPosition;
          
          // Broadcast position update to other players
          socket.to(roomId).emit('player:move', {
            playerId: socket.id,
            position: player.position
          });
        }
      }
    });

    // Player rotation
    socket.on('player:rotate', ({ rotation }) => {
      // Find the game room the player is in
      const roomId = findPlayerRoom(socket.id);
      if (!roomId) return;
      
      // Update player rotation
      const gameState = gameRooms[roomId];
      if (gameState && gameState.players[socket.id]) {
        gameState.players[socket.id].rotation = rotation;
        
        // Broadcast rotation update to other players
        socket.to(roomId).emit('player:rotate', {
          playerId: socket.id,
          rotation
        });
      }
    });

    // Player shoot
    socket.on('player:shoot', ({ position, direction }) => {
      // Find the game room the player is in
      const roomId = findPlayerRoom(socket.id);
      if (!roomId) return;
      
      // Check if player can shoot
      const gameState = gameRooms[roomId];
      if (gameState && gameState.players[socket.id]) {
        const player = gameState.players[socket.id];
        const now = Date.now();
        
        // Rate limit shooting (500ms cooldown)
        if (now - player.lastShot < 500) return;
        
        // Update last shot time
        player.lastShot = now;
        
        // Create projectile using physics engine
        const projectile = physicsEngine.createProjectile(socket.id, position, direction);
        
        // Add projectile to game state
        gameState.projectiles[projectile.id] = projectile;
        
        // Broadcast projectile creation to all players
        io.to(roomId).emit('projectile:create', projectile);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Find the game room the player is in
      const roomId = findPlayerRoom(socket.id);
      if (roomId) {
        // Remove player from game room
        if (gameRooms[roomId] && gameRooms[roomId].players[socket.id]) {
          delete gameRooms[roomId].players[socket.id];
          
          // Notify other players
          socket.to(roomId).emit('player:leave', { playerId: socket.id });
          
          // If no players left, delete the game room
          if (Object.keys(gameRooms[roomId].players).length === 0) {
            delete gameRooms[roomId];
          }
        }
      }
    });
  });
};

// Helper function to find which room a player is in
const findPlayerRoom = (playerId: string): string | null => {
  for (const roomId in gameRooms) {
    if (gameRooms[roomId].players[playerId]) {
      return roomId;
    }
  }
  return null;
};

// Collision detection is now handled by the physics engine

// Obstacles are now generated by the physics engine

// Update all game rooms
const updateGames = (io: Server) => {
  for (const roomId in gameRooms) {
    const gameState = gameRooms[roomId];
    
    // Update game based on status
    switch (gameState.status) {
      case 'countdown':
        updateCountdown(io, roomId, gameState);
        break;
      case 'playing':
        updatePlaying(io, roomId, gameState);
        break;
      case 'finished':
        // No updates needed for finished games
        break;
      default:
        break;
    }
  }
};

// Update countdown phase
const updateCountdown = (io: Server, roomId: string, gameState: GameState) => {
  // Decrease time remaining
  gameState.timeRemaining -= TICK_INTERVAL / 1000;
  
  // Check if countdown is finished
  if (gameState.timeRemaining <= 0) {
    // Start the game
    gameState.status = 'playing';
    gameState.timeRemaining = gameState.settings.timeLimit;
    
    // Initialize players if not already done
    const players = Object.keys(gameState.players);
    if (players.length === 0) {
      // Get players from socket room
      const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
      if (socketsInRoom) {
        const playerPositions = physicsEngine.generatePlayerPositions(socketsInRoom.size);
        let i = 0;
        
        for (const socketId of socketsInRoom) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            // Get user data from socket
            const userData = socket.data.user || { id: socketId, username: `Player ${i + 1}` };
            
            // Create player
            gameState.players[socketId] = {
              id: socketId,
              username: userData.username,
              position: playerPositions[i] || { x: 400, y: 300 },
              rotation: 0,
              health: 100,
              score: 0,
              isActive: true,
              lastShot: 0,
              color: getPlayerColor(i)
            };
            
            i++;
          }
        }
      }
    }
    
    // Notify all players that the game has started
    io.to(roomId).emit('game:start');
    
    // Send initial game state
    io.to(roomId).emit('game:sync', gameState);
  } else {
    // Send countdown update every second
    if (Math.floor(gameState.timeRemaining) !== Math.floor(gameState.timeRemaining + TICK_INTERVAL / 1000)) {
      io.to(roomId).emit('game:time', Math.floor(gameState.timeRemaining));
    }
  }
};

// Update playing phase
const updatePlaying = (io: Server, roomId: string, gameState: GameState) => {
  // Decrease time remaining
  gameState.timeRemaining -= TICK_INTERVAL / 1000;
  
  // Update projectiles
  updateProjectiles(io, roomId, gameState);
  
  // Check win conditions
  checkWinConditions(io, roomId, gameState);
  
  // Send time update every second
  if (Math.floor(gameState.timeRemaining) !== Math.floor(gameState.timeRemaining + TICK_INTERVAL / 1000)) {
    io.to(roomId).emit('game:time', Math.floor(gameState.timeRemaining));
  }
  
  // Periodically sync full game state (every 5 seconds)
  if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - TICK_INTERVAL) / 5000)) {
    io.to(roomId).emit('game:sync', gameState);
  }
};

// Update projectiles
const updateProjectiles = (io: Server, roomId: string, gameState: GameState) => {
  const projectilesToRemove: string[] = [];
  
  // Update each projectile
  for (const projectileId in gameState.projectiles) {
    const projectile = gameState.projectiles[projectileId];
    
    // Update position using physics engine
    const result = physicsEngine.calculateProjectileMovement(projectile, gameState);
    
    // If collision with obstacle or boundary
    if (!result.position) {
      projectilesToRemove.push(projectileId);
      
      // If hit a player
      if (result.hitPlayerId) {
        // Update player health
        const player = gameState.players[result.hitPlayerId];
        player.health -= projectile.damage;
        
        // Check if player is eliminated
        if (player.health <= 0) {
          player.health = 0;
          player.isActive = false;
          
          // Award point to shooter
          const shooter = gameState.players[projectile.playerId];
          if (shooter) {
            shooter.score += 1;
            
            // Notify all players of score update
            io.to(roomId).emit('player:score', {
              playerId: shooter.id,
              score: shooter.score
            });
          }
          
          // Notify all players of health update
          io.to(roomId).emit('player:health', {
            playerId: player.id,
            health: player.health
          });
        } else {
          // Notify all players of health update
          io.to(roomId).emit('player:health', {
            playerId: player.id,
            health: player.health
          });
        }
      }
      
      continue;
    }
    
    // Update projectile position
    projectile.position = result.position;
    
    // Check if projectile is too old (5 seconds)
    if (Date.now() - projectile.createdAt > 5000) {
      projectilesToRemove.push(projectileId);
      continue;
    }
    
    // Broadcast position update
    io.to(roomId).emit('projectile:move', {
      projectileId,
      position: projectile.position
    });
  }
  
  // Remove projectiles
  for (const projectileId of projectilesToRemove) {
    delete gameState.projectiles[projectileId];
    
    // Notify all players
    io.to(roomId).emit('projectile:remove', { projectileId });
  }
};

// These functions are now handled by the physics engine

// Check win conditions
const checkWinConditions = (io: Server, roomId: string, gameState: GameState) => {
  // Check if time is up
  if (gameState.timeRemaining <= 0) {
    endGame(io, roomId, gameState);
    return;
  }
  
  // Check if any player reached the score limit
  for (const playerId in gameState.players) {
    const player = gameState.players[playerId];
    if (player.score >= gameState.settings.scoreLimit) {
      gameState.winner = playerId;
      endGame(io, roomId, gameState);
      return;
    }
  }
  
  // Check if only one player is active
  const activePlayers = Object.values(gameState.players).filter(player => player.isActive);
  if (activePlayers.length === 1 && Object.keys(gameState.players).length > 1) {
    gameState.winner = activePlayers[0].id;
    endGame(io, roomId, gameState);
    return;
  }
  
  // Check if no players are active
  if (activePlayers.length === 0 && Object.keys(gameState.players).length > 0) {
    endGame(io, roomId, gameState);
    return;
  }
};

// End game
const endGame = (io: Server, roomId: string, gameState: GameState) => {
  // Set game status to finished
  gameState.status = 'finished';
  
  // Notify all players
  io.to(roomId).emit('game:end', { winner: gameState.winner });
};

// Player positions are now generated by the physics engine

// Get player color
const getPlayerColor = (index: number): string => {
  const colors = [
    '#FF5252', // Red
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#FFC107', // Yellow
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FF9800', // Orange
    '#795548'  // Brown
  ];
  
  return colors[index % colors.length];
};