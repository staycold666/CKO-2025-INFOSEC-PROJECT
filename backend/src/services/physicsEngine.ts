import { Position, Obstacle, Player, Projectile, GameState } from '../types';

export class PhysicsEngine {
  private readonly PLAYER_RADIUS = 20;
  private readonly PROJECTILE_RADIUS = 5;
  private readonly PLAYER_SPEED = 5;
  private readonly PROJECTILE_SPEED = 10;
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 600;

  /**
   * Calculate new player position based on input
   * @param player The player to move
   * @param input The movement input vector
   * @param gameState The game state with obstacles and other players
   * @returns The new position if valid, null if collision detected
   */
  calculatePlayerMovement(
    player: Player,
    input: Position,
    gameState: GameState
  ): Position | null {
    // Normalize input vector if needed
    let normalizedInput = { ...input };
    if (input.x !== 0 && input.y !== 0) {
      const length = Math.sqrt(input.x * input.x + input.y * input.y);
      normalizedInput = {
        x: input.x / length,
        y: input.y / length
      };
    }

    // Calculate new position
    const newPosition: Position = {
      x: player.position.x + normalizedInput.x * this.PLAYER_SPEED,
      y: player.position.y + normalizedInput.y * this.PLAYER_SPEED
    };

    // Check for collisions with obstacles
    if (this.checkPlayerObstacleCollision(newPosition, gameState.obstacles)) {
      return null;
    }

    // Check for collisions with boundaries
    if (this.checkBoundaryCollision(newPosition, this.PLAYER_RADIUS)) {
      return null;
    }

    // Check for collisions with other players
    if (this.checkPlayerPlayerCollision(player.id, newPosition, gameState.players)) {
      return null;
    }

    return newPosition;
  }

  /**
   * Calculate new projectile position
   * @param projectile The projectile to move
   * @param gameState The game state with obstacles and players
   * @returns The new position if valid, null if collision detected
   */
  calculateProjectileMovement(
    projectile: Projectile,
    gameState: GameState
  ): { position: Position | null; hitPlayerId: string | null } {
    // Calculate new position
    const newPosition: Position = {
      x: projectile.position.x + projectile.velocity.x,
      y: projectile.position.y + projectile.velocity.y
    };

    // Check for collisions with obstacles
    if (this.checkProjectileObstacleCollision(newPosition, gameState.obstacles)) {
      return { position: null, hitPlayerId: null };
    }

    // Check for collisions with boundaries
    if (this.checkBoundaryCollision(newPosition, this.PROJECTILE_RADIUS)) {
      return { position: null, hitPlayerId: null };
    }

    // Check for collisions with players
    const hitPlayerId = this.checkProjectilePlayerCollision(
      projectile.playerId,
      newPosition,
      gameState.players,
      gameState.settings.friendlyFire
    );
    
    if (hitPlayerId) {
      return { position: null, hitPlayerId };
    }

    return { position: newPosition, hitPlayerId: null };
  }

  /**
   * Create a new projectile
   * @param playerId The ID of the player shooting
   * @param position The starting position
   * @param angle The angle in radians
   * @returns A new projectile object
   */
  createProjectile(playerId: string, position: Position, angle: number): Projectile {
    // Calculate velocity based on angle
    const velocity: Position = {
      x: Math.cos(angle) * this.PROJECTILE_SPEED,
      y: Math.sin(angle) * this.PROJECTILE_SPEED
    };

    return {
      id: `${playerId}-${Date.now()}`,
      playerId,
      position: { ...position },
      velocity,
      damage: 10,
      createdAt: Date.now()
    };
  }

  /**
   * Check if a player collides with an obstacle
   * @param position The player position
   * @param obstacles The list of obstacles
   * @returns True if collision detected, false otherwise
   */
  private checkPlayerObstacleCollision(position: Position, obstacles: Obstacle[]): boolean {
    for (const obstacle of obstacles) {
      // AABB collision detection with circle
      const closestX = Math.max(obstacle.position.x, Math.min(position.x, obstacle.position.x + obstacle.width));
      const closestY = Math.max(obstacle.position.y, Math.min(position.y, obstacle.position.y + obstacle.height));
      
      // Calculate distance between closest point and circle center
      const distanceX = position.x - closestX;
      const distanceY = position.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than radius squared
      if (distanceSquared < this.PLAYER_RADIUS * this.PLAYER_RADIUS) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }

  /**
   * Check if a projectile collides with an obstacle
   * @param position The projectile position
   * @param obstacles The list of obstacles
   * @returns True if collision detected, false otherwise
   */
  private checkProjectileObstacleCollision(position: Position, obstacles: Obstacle[]): boolean {
    for (const obstacle of obstacles) {
      // AABB collision detection with circle
      const closestX = Math.max(obstacle.position.x, Math.min(position.x, obstacle.position.x + obstacle.width));
      const closestY = Math.max(obstacle.position.y, Math.min(position.y, obstacle.position.y + obstacle.height));
      
      // Calculate distance between closest point and circle center
      const distanceX = position.x - closestX;
      const distanceY = position.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than radius squared
      if (distanceSquared < this.PROJECTILE_RADIUS * this.PROJECTILE_RADIUS) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }

  /**
   * Check if a player collides with another player
   * @param playerId The ID of the player to check
   * @param position The player position
   * @param players The map of players
   * @returns True if collision detected, false otherwise
   */
  private checkPlayerPlayerCollision(
    playerId: string,
    position: Position,
    players: Record<string, Player>
  ): boolean {
    for (const id in players) {
      // Skip self
      if (id === playerId) continue;
      
      const otherPlayer = players[id];
      
      // Skip inactive players
      if (!otherPlayer.isActive) continue;
      
      // Calculate distance between players
      const distanceX = position.x - otherPlayer.position.x;
      const distanceY = position.y - otherPlayer.position.y;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than sum of radii squared
      const minDistance = this.PLAYER_RADIUS * 2;
      if (distanceSquared < minDistance * minDistance) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }

  /**
   * Check if a projectile collides with a player
   * @param shooterId The ID of the player who shot the projectile
   * @param position The projectile position
   * @param players The map of players
   * @param friendlyFire Whether friendly fire is enabled
   * @returns The ID of the hit player, or null if no collision
   */
  private checkProjectilePlayerCollision(
    shooterId: string,
    position: Position,
    players: Record<string, Player>,
    friendlyFire: boolean
  ): string | null {
    for (const id in players) {
      // Skip shooter if friendly fire is disabled
      if (id === shooterId && !friendlyFire) continue;
      
      const player = players[id];
      
      // Skip inactive players
      if (!player.isActive) continue;
      
      // Calculate distance between projectile and player
      const distanceX = position.x - player.position.x;
      const distanceY = position.y - player.position.y;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than sum of radii squared
      const minDistance = this.PROJECTILE_RADIUS + this.PLAYER_RADIUS;
      if (distanceSquared < minDistance * minDistance) {
        return id; // Collision detected, return player ID
      }
    }
    
    return null; // No collision
  }

  /**
   * Check if an object collides with the canvas boundaries
   * @param position The object position
   * @param radius The object radius
   * @returns True if collision detected, false otherwise
   */
  private checkBoundaryCollision(position: Position, radius: number): boolean {
    return (
      position.x - radius < 0 ||
      position.x + radius > this.CANVAS_WIDTH ||
      position.y - radius < 0 ||
      position.y + radius > this.CANVAS_HEIGHT
    );
  }

  /**
   * Generate random player positions for a given number of players
   * @param numPlayers The number of players
   * @returns An array of positions
   */
  generatePlayerPositions(numPlayers: number): Position[] {
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
  }

  /**
   * Generate obstacles for a map
   * @param mapId The ID of the map
   * @returns An array of obstacles
   */
  generateObstacles(mapId: string = 'default'): Obstacle[] {
    // Default map
    if (mapId === 'default') {
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
    }
    
    // Map 2: Symmetrical arena
    if (mapId === 'map2') {
      return [
        // Walls
        { id: 'wall-top', position: { x: 0, y: 0 }, width: 800, height: 20, type: 'wall' },
        { id: 'wall-right', position: { x: 780, y: 0 }, width: 20, height: 600, type: 'wall' },
        { id: 'wall-bottom', position: { x: 0, y: 580 }, width: 800, height: 20, type: 'wall' },
        { id: 'wall-left', position: { x: 0, y: 0 }, width: 20, height: 600, type: 'wall' },
        
        // Center structure
        { id: 'center-1', position: { x: 350, y: 250 }, width: 100, height: 100, type: 'barrier' },
        
        // Corner covers
        { id: 'cover-1', position: { x: 100, y: 100 }, width: 50, height: 50, type: 'cover' },
        { id: 'cover-2', position: { x: 650, y: 100 }, width: 50, height: 50, type: 'cover' },
        { id: 'cover-3', position: { x: 100, y: 450 }, width: 50, height: 50, type: 'cover' },
        { id: 'cover-4', position: { x: 650, y: 450 }, width: 50, height: 50, type: 'cover' },
        
        // Side barriers
        { id: 'barrier-1', position: { x: 200, y: 200 }, width: 50, height: 200, type: 'barrier' },
        { id: 'barrier-2', position: { x: 550, y: 200 }, width: 50, height: 200, type: 'barrier' }
      ];
    }
    
    // Map 3: Open arena with minimal cover
    if (mapId === 'map3') {
      return [
        // Walls
        { id: 'wall-top', position: { x: 0, y: 0 }, width: 800, height: 20, type: 'wall' },
        { id: 'wall-right', position: { x: 780, y: 0 }, width: 20, height: 600, type: 'wall' },
        { id: 'wall-bottom', position: { x: 0, y: 580 }, width: 800, height: 20, type: 'wall' },
        { id: 'wall-left', position: { x: 0, y: 0 }, width: 20, height: 600, type: 'wall' },
        
        // Minimal cover
        { id: 'cover-1', position: { x: 200, y: 200 }, width: 50, height: 50, type: 'cover' },
        { id: 'cover-2', position: { x: 550, y: 200 }, width: 50, height: 50, type: 'cover' },
        { id: 'cover-3', position: { x: 200, y: 350 }, width: 50, height: 50, type: 'cover' },
        { id: 'cover-4', position: { x: 550, y: 350 }, width: 50, height: 50, type: 'cover' },
        { id: 'cover-5', position: { x: 375, y: 275 }, width: 50, height: 50, type: 'cover' }
      ];
    }
    
    // Default to the first map if mapId is not recognized
    return this.generateObstacles('default');
  }
}