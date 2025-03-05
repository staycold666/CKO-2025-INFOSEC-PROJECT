import { PhysicsEngine } from '../services/physicsEngine';
import { GameState, Player, Obstacle, Position } from '../types';

// Create a mock game state for testing
const createMockGameState = (): GameState => {
  return {
    roomId: 'test-room',
    players: {},
    projectiles: {},
    obstacles: [
      // Walls
      { id: 'wall-top', position: { x: 0, y: 0 }, width: 800, height: 20, type: 'wall' },
      { id: 'wall-right', position: { x: 780, y: 0 }, width: 20, height: 600, type: 'wall' },
      { id: 'wall-bottom', position: { x: 0, y: 580 }, width: 800, height: 20, type: 'wall' },
      { id: 'wall-left', position: { x: 0, y: 0 }, width: 20, height: 600, type: 'wall' },
      
      // Test obstacle in the middle
      { id: 'obstacle-1', position: { x: 350, y: 250 }, width: 100, height: 100, type: 'barrier' }
    ],
    status: 'playing',
    timeRemaining: 300,
    winner: null,
    settings: {
      timeLimit: 300,
      scoreLimit: 20,
      mapId: 'test-map',
      friendlyFire: false
    }
  };
};

// Create a mock player for testing
const createMockPlayer = (id: string, position: Position): Player => {
  return {
    id,
    username: `Player ${id}`,
    position,
    rotation: 0,
    health: 100,
    score: 0,
    isActive: true,
    lastShot: 0,
    color: '#FF5252'
  };
};

describe('PhysicsEngine', () => {
  let physicsEngine: PhysicsEngine;
  let gameState: GameState;
  
  beforeEach(() => {
    physicsEngine = new PhysicsEngine();
    gameState = createMockGameState();
    
    // Add two players to the game state
    const player1 = createMockPlayer('player1', { x: 100, y: 100 });
    const player2 = createMockPlayer('player2', { x: 700, y: 500 });
    
    gameState.players = {
      player1,
      player2
    };
  });
  
  describe('calculatePlayerMovement', () => {
    it('should allow valid movement', () => {
      const player = gameState.players.player1;
      const input: Position = { x: 1, y: 0 }; // Move right
      
      const newPosition = physicsEngine.calculatePlayerMovement(player, input, gameState);
      
      expect(newPosition).not.toBeNull();
      if (newPosition) {
        expect(newPosition.x).toBeGreaterThan(player.position.x);
        expect(newPosition.y).toBe(player.position.y);
      }
    });
    
    it('should prevent movement into obstacles', () => {
      // Position player near the obstacle
      gameState.players.player1.position = { x: 330, y: 250 };
      
      const player = gameState.players.player1;
      const input: Position = { x: 1, y: 0 }; // Move right towards obstacle
      
      const newPosition = physicsEngine.calculatePlayerMovement(player, input, gameState);
      
      // Should return null when collision detected
      expect(newPosition).toBeNull();
    });
    
    it('should prevent movement into other players', () => {
      // Position players near each other
      gameState.players.player1.position = { x: 200, y: 200 };
      gameState.players.player2.position = { x: 240, y: 200 };
      
      const player = gameState.players.player1;
      const input: Position = { x: 1, y: 0 }; // Move right towards player2
      
      const newPosition = physicsEngine.calculatePlayerMovement(player, input, gameState);
      
      // Should return null when collision detected
      expect(newPosition).toBeNull();
    });
    
    it('should prevent movement outside boundaries', () => {
      // Position player near the boundary
      gameState.players.player1.position = { x: 21, y: 21 };
      
      const player = gameState.players.player1;
      const input: Position = { x: 0, y: -1 }; // Move up towards boundary
      
      const newPosition = physicsEngine.calculatePlayerMovement(player, input, gameState);
      
      // Should return null when collision detected
      expect(newPosition).toBeNull();
    });
  });
  
  describe('calculateProjectileMovement', () => {
    it('should update projectile position correctly', () => {
      const projectile = physicsEngine.createProjectile('player1', { x: 100, y: 100 }, 0); // Angle 0 = right
      
      const result = physicsEngine.calculateProjectileMovement(projectile, gameState);
      
      expect(result.position).not.toBeNull();
      if (result.position) {
        expect(result.position.x).toBeGreaterThan(projectile.position.x);
        expect(result.position.y).toBe(projectile.position.y);
      }
      expect(result.hitPlayerId).toBeNull();
    });
    
    it('should detect collision with obstacles', () => {
      // Position projectile right at the edge of the obstacle
      const projectile = physicsEngine.createProjectile('player1', { x: 345, y: 300 }, 0); // Angle 0 = right
      
      const result = physicsEngine.calculateProjectileMovement(projectile, gameState);
      
      // Should return null position when collision detected
      expect(result.position).toBeNull();
      expect(result.hitPlayerId).toBeNull();
    });
    
    it('should detect collision with players', () => {
      // Position projectile near player2
      const projectile = physicsEngine.createProjectile('player1', { x: 680, y: 500 }, 0); // Angle 0 = right
      
      const result = physicsEngine.calculateProjectileMovement(projectile, gameState);
      
      // Should return null position and hit player ID
      expect(result.position).toBeNull();
      expect(result.hitPlayerId).toBe('player2');
    });
  });
  
  describe('generatePlayerPositions', () => {
    it('should generate correct number of positions', () => {
      const positions = physicsEngine.generatePlayerPositions(4);
      
      expect(positions.length).toBe(4);
    });
    
    it('should generate positions for different player counts', () => {
      // Test with different player counts
      [1, 2, 3, 4, 6].forEach(count => {
        const positions = physicsEngine.generatePlayerPositions(count);
        expect(positions.length).toBe(count);
      });
    });
  });
  
  describe('generateObstacles', () => {
    it('should generate obstacles for default map', () => {
      const obstacles = physicsEngine.generateObstacles();
      
      expect(obstacles.length).toBeGreaterThan(0);
      expect(obstacles.some(o => o.type === 'wall')).toBe(true);
    });
    
    it('should generate obstacles for different maps', () => {
      const map1Obstacles = physicsEngine.generateObstacles('default');
      const map2Obstacles = physicsEngine.generateObstacles('map2');
      const map3Obstacles = physicsEngine.generateObstacles('map3');
      
      // Different maps should have different obstacle counts or configurations
      expect(map1Obstacles).not.toEqual(map2Obstacles);
      expect(map2Obstacles).not.toEqual(map3Obstacles);
    });
  });
});