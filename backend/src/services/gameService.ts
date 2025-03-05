import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

// Game state interfaces
interface Position {
  x: number;
  y: number;
}

interface Player {
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

interface Projectile {
  id: string;
  playerId: string;
  position: Position;
  velocity: Position;
  damage: number;
  createdAt: number;
}

interface Obstacle {
  id: string;
  position: Position;
  width: number;
  height: number;
  type: 'wall' | 'barrier' | 'cover';
}

interface GameRoom {
  id: string;
  players: Record<string, Player>;
  projectiles: Record<string, Projectile>;
  obstacles: Obstacle[];
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';
  timeRemaining: number;
  winner: string | null;
  settings: {
    timeLimit: number;
    scoreLimit: number;
    mapId: string;
    friendlyFire: boolean;
  };
}

// Game rooms storage
const gameRooms: Record<string, GameRoom> = {};

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
          id: roomId,
          players: {},
          projectiles: {},
          obstacles: generateObstacles(),
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
      const gameRoom = gameRooms[roomId];
      if (gameRoom && gameRoom.players[socket.id]) {
        const player = gameRoom.players[socket.id];
        
        // Calculate new position
        const newX = player.position.x + position.x;
        const newY = player.position.y + position.y;
        
        // Check for collisions with obstacles
        if (!checkCollision(newX, newY, gameRoom.obstacles)) {
          player.position.x = newX;
          player.position.y = newY;
          
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
      const gameRoom = gameRooms[roomId];
      if (gameRoom && gameRoom.players[socket.id]) {
        gameRoom.players[socket.id].rotation = rotation;
        
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
      const gameRoom = gameRooms[roomId];
      if (gameRoom && gameRoom.players[socket.id]) {
        const player = gameRoom.players[socket.id];
        const now = Date.now();
        
        // Rate limit shooting (500ms cooldown)
        if (now - player.lastShot < 500) return;
        
        // Update last shot time
        player.lastShot = now;
        
        // Create projectile
        const projectileId = `${socket.id}-${now}`;
        const projectile: Projectile = {
          id: projectileId,
          playerId: socket.id,
          position: { ...position },
          velocity: {
            x: Math.cos(direction) * 10,
            y: Math.sin(direction) * 10
          },
          damage: 10,
          createdAt: now
        };
        
        // Add projectile to game room
        gameRoom.projectiles[projectileId] = projectile;
        
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

// Helper function to check collision with obstacles
const checkCollision = (x: number, y: number, obstacles: Obstacle[]): boolean => {
  // Player radius
  const playerRadius = 20;
  
  // Check collision with each obstacle
  for (const obstacle of obstacles) {
    // Simple AABB collision check with player as a circle
    const closestX = Math.max(obstacle.position.x, Math.min(x, obstacle.position.x + obstacle.width));
    const closestY = Math.max(obstacle.position.y, Math.min(y, obstacle.position.y + obstacle.height));
    
    // Calculate distance between closest point and circle center
    const distanceX = x - closestX;
    const distanceY = y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    // Check if distance is less than radius squared
    if (distanceSquared < playerRadius * playerRadius) {
      return true; // Collision detected
    }
  }
  
  return false; // No collision
};

// Helper function to generate obstacles for a map
const generateObstacles = (): Obstacle[] => {
  // Simple map with some obstacles
  return [
    // Walls
    { id: 'wall-top', position: { x: 0, y: 0 }, width: 800, height: 20, type: 'wall' },
    { id: 'wall-right', position: { x: 780, y: 0 }, width: 20, height: 600, type: 'wall' },
    { id: 'wall-bottom', position: { x: 0, y: 580 }, width: 800, height: 20, type: 'wall' },
    { id: 'wall-left', position: { x: 0, y: 0 }, width: 20, height: 600, type: 'wall' },
    
    // Barriers
    { id: 'barrier-1', position: { x: 200, y: 150 }, width: 50, height: 200, type: 'barrier' },
    { id: 'barrier-2', position: { x: 550, y: 250 }, width: 50, height: 200, type: 'barrier' },
    
    // Cover
    { id: 'cover-1', position: { x: 350, y: 100 }, width: 100, height: 50, type: 'cover' },
    { id: 'cover-2', position: { x: 350, y: 450 }, width: 100, height: 50, type: 'cover' },
    { id: 'cover-3', position: { x: 150, y: 300 }, width: 50, height: 50, type: 'cover' },
    { id: 'cover-4', position: { x: 600, y: 300 }, width: 50, height: 50, type: 'cover' }
  ];
};

// Update all game rooms
const updateGames = (io: Server) => {
  for (const roomId in gameRooms) {
    const gameRoom = gameRooms[roomId];
    
    // Update game based on status
    switch (gameRoom.status) {
      case 'countdown':
        updateCountdown(io, roomId, gameRoom);
        break;
      case 'playing':
        updatePlaying(io, roomId, gameRoom);
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
const updateCountdown = (io: Server, roomId: string, gameRoom: GameRoom) => {
  // Decrease time remaining
  gameRoom.timeRemaining -= TICK_INTERVAL / 1000;
  
  // Check if countdown is finished
  if (gameRoom.timeRemaining <= 0) {
    // Start the game
    gameRoom.status = 'playing';
    gameRoom.timeRemaining = gameRoom.settings.timeLimit;
    
    // Initialize players if not already done
    const players = Object.keys(gameRoom.players);
    if (players.length === 0) {
      // Get players from socket room
      const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
      if (socketsInRoom) {
        const playerPositions = generatePlayerPositions(socketsInRoom.size);
        let i = 0;
        
        for (const socketId of socketsInRoom) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            // Get user data from socket
            const userData = socket.data.user || { id: socketId, username: `Player ${i + 1}` };
            
            // Create player
            gameRoom.players[socketId] = {
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
    io.to(roomId).emit('game:sync', gameRoom);
  } else {
    // Send countdown update every second
    if (Math.floor(gameRoom.timeRemaining) !== Math.floor(gameRoom.timeRemaining + TICK_INTERVAL / 1000)) {
      io.to(roomId).emit('game:time', Math.floor(gameRoom.timeRemaining));
    }
  }
};

// Update playing phase
const updatePlaying = (io: Server, roomId: string, gameRoom: GameRoom) => {
  // Decrease time remaining
  gameRoom.timeRemaining -= TICK_INTERVAL / 1000;
  
  // Update projectiles
  updateProjectiles(io, roomId, gameRoom);
  
  // Check win conditions
  checkWinConditions(io, roomId, gameRoom);
  
  // Send time update every second
  if (Math.floor(gameRoom.timeRemaining) !== Math.floor(gameRoom.timeRemaining + TICK_INTERVAL / 1000)) {
    io.to(roomId).emit('game:time', Math.floor(gameRoom.timeRemaining));
  }
  
  // Periodically sync full game state (every 5 seconds)
  if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - TICK_INTERVAL) / 5000)) {
    io.to(roomId).emit('game:sync', gameRoom);
  }
};

// Update projectiles
const updateProjectiles = (io: Server, roomId: string, gameRoom: GameRoom) => {
  const projectilesToRemove: string[] = [];
  
  // Update each projectile
  for (const projectileId in gameRoom.projectiles) {
    const projectile = gameRoom.projectiles[projectileId];
    
    // Update position
    projectile.position.x += projectile.velocity.x;
    projectile.position.y += projectile.velocity.y;
    
    // Check for collisions with obstacles
    if (checkProjectileObstacleCollision(projectile, gameRoom.obstacles)) {
      projectilesToRemove.push(projectileId);
      continue;
    }
    
    // Check for collisions with players
    const hitPlayer = checkProjectilePlayerCollision(projectile, gameRoom);
    if (hitPlayer) {
      projectilesToRemove.push(projectileId);
      
      // Update player health
      const player = gameRoom.players[hitPlayer];
      player.health -= projectile.damage;
      
      // Check if player is eliminated
      if (player.health <= 0) {
        player.health = 0;
        player.isActive = false;
        
        // Award point to shooter
        const shooter = gameRoom.players[projectile.playerId];
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
      
      continue;
    }
    
    // Check if projectile is out of bounds
    if (
      projectile.position.x < 0 ||
      projectile.position.x > 800 ||
      projectile.position.y < 0 ||
      projectile.position.y > 600
    ) {
      projectilesToRemove.push(projectileId);
      continue;
    }
    
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
    delete gameRoom.projectiles[projectileId];
    
    // Notify all players
    io.to(roomId).emit('projectile:remove', { projectileId });
  }
};

// Check projectile collision with obstacles
const checkProjectileObstacleCollision = (projectile: Projectile, obstacles: Obstacle[]): boolean => {
  // Projectile radius
  const projectileRadius = 5;
  
  // Check collision with each obstacle
  for (const obstacle of obstacles) {
    // Simple AABB collision check with projectile as a circle
    const closestX = Math.max(obstacle.position.x, Math.min(projectile.position.x, obstacle.position.x + obstacle.width));
    const closestY = Math.max(obstacle.position.y, Math.min(projectile.position.y, obstacle.position.y + obstacle.height));
    
    // Calculate distance between closest point and circle center
    const distanceX = projectile.position.x - closestX;
    const distanceY = projectile.position.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    // Check if distance is less than radius squared
    if (distanceSquared < projectileRadius * projectileRadius) {
      return true; // Collision detected
    }
  }
  
  return false; // No collision
};

// Check projectile collision with players
const checkProjectilePlayerCollision = (projectile: Projectile, gameRoom: GameRoom): string | null => {
  // Projectile radius
  const projectileRadius = 5;
  
  // Player radius
  const playerRadius = 20;
  
  // Combined radius for collision check
  const combinedRadius = projectileRadius + playerRadius;
  
  // Check collision with each player
  for (const playerId in gameRoom.players) {
    const player = gameRoom.players[playerId];
    
    // Skip inactive players
    if (!player.isActive) continue;
    
    // Skip shooter if friendly fire is disabled
    if (playerId === projectile.playerId && !gameRoom.settings.friendlyFire) continue;
    
    // Calculate distance between projectile and player
    const distanceX = projectile.position.x - player.position.x;
    const distanceY = projectile.position.y - player.position.y;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    // Check if distance is less than combined radius squared
    if (distanceSquared < combinedRadius * combinedRadius) {
      return playerId; // Collision detected
    }
  }
  
  return null; // No collision
};

// Check win conditions
const checkWinConditions = (io: Server, roomId: string, gameRoom: GameRoom) => {
  // Check if time is up
  if (gameRoom.timeRemaining <= 0) {
    endGame(io, roomId, gameRoom);
    return;
  }
  
  // Check if any player reached the score limit
  for (const playerId in gameRoom.players) {
    const player = gameRoom.players[playerId];
    if (player.score >= gameRoom.settings.scoreLimit) {
      gameRoom.winner = playerId;
      endGame(io, roomId, gameRoom);
      return;
    }
  }
  
  // Check if only one player is active
  const activePlayers = Object.values(gameRoom.players).filter(player => player.isActive);
  if (activePlayers.length === 1 && Object.keys(gameRoom.players).length > 1) {
    gameRoom.winner = activePlayers[0].id;
    endGame(io, roomId, gameRoom);
    return;
  }
  
  // Check if no players are active
  if (activePlayers.length === 0 && Object.keys(gameRoom.players).length > 0) {
    endGame(io, roomId, gameRoom);
    return;
  }
};

// End game
const endGame = (io: Server, roomId: string, gameRoom: GameRoom) => {
  // Set game status to finished
  gameRoom.status = 'finished';
  
  // Notify all players
  io.to(roomId).emit('game:end', { winner: gameRoom.winner });
};

// Generate player positions
const generatePlayerPositions = (numPlayers: number): Position[] => {
  const positions: Position[] = [];
  
  // Generate positions based on number of players
  switch (numPlayers) {
    case 1:
      positions.push({ x: 400, y: 300 });
      break;
    case 2:
      positions.push({ x: 200, y: 300 });
      positions.push({ x: 600, y: 300 });
      break;
    case 3:
      positions.push({ x: 400, y: 150 });
      positions.push({ x: 200, y: 450 });
      positions.push({ x: 600, y: 450 });
      break;
    case 4:
      positions.push({ x: 200, y: 150 });
      positions.push({ x: 600, y: 150 });
      positions.push({ x: 200, y: 450 });
      positions.push({ x: 600, y: 450 });
      break;
    default:
      // For more than 4 players, distribute them in a circle
      const radius = 200;
      const center = { x: 400, y: 300 };
      
      for (let i = 0; i < numPlayers; i++) {
        const angle = (i / numPlayers) * 2 * Math.PI;
        positions.push({
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle)
        });
      }
      break;
  }
  
  return positions;
};

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