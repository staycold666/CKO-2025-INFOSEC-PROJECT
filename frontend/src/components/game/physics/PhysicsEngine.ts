import { Player, Projectile, Obstacle, Position, GameState } from '../../../types';

export class PhysicsEngine {
  private gameState: GameState;
  private canvasWidth: number;
  private canvasHeight: number;
  private playerRadius: number = 20;
  private projectileRadius: number = 5;
  private playerSpeed: number = 5;
  private projectileSpeed: number = 10;

  constructor(gameState: GameState, canvasWidth: number, canvasHeight: number) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  // Update the game state
  updateGameState(gameState: GameState): void {
    this.gameState = gameState;
  }

  // Calculate new player position based on input
  calculatePlayerMovement(playerId: string, input: { x: number; y: number }): Position | null {
    const player = this.gameState.players[playerId];
    if (!player) return null;

    // Calculate new position
    const newPosition: Position = {
      x: player.position.x + input.x * this.playerSpeed,
      y: player.position.y + input.y * this.playerSpeed
    };

    // Check for collisions with obstacles
    if (this.checkPlayerObstacleCollision(newPosition)) {
      return null;
    }

    // Check for collisions with boundaries
    if (this.checkBoundaryCollision(newPosition, this.playerRadius)) {
      return null;
    }

    // Check for collisions with other players
    if (this.checkPlayerPlayerCollision(playerId, newPosition)) {
      return null;
    }

    return newPosition;
  }

  // Calculate new projectile position
  calculateProjectileMovement(projectile: Projectile): Position | null {
    // Calculate new position
    const newPosition: Position = {
      x: projectile.position.x + projectile.velocity.x,
      y: projectile.position.y + projectile.velocity.y
    };

    // Check for collisions with obstacles
    if (this.checkProjectileObstacleCollision(newPosition)) {
      return null; // Projectile hit an obstacle
    }

    // Check for collisions with boundaries
    if (this.checkBoundaryCollision(newPosition, this.projectileRadius)) {
      return null; // Projectile hit a boundary
    }

    // Check for collisions with players
    const hitPlayer = this.checkProjectilePlayerCollision(projectile.playerId, newPosition);
    if (hitPlayer) {
      return null; // Projectile hit a player
    }

    return newPosition;
  }

  // Create a new projectile
  createProjectile(playerId: string, angle: number): Projectile {
    const player = this.gameState.players[playerId];
    
    // Calculate velocity based on angle
    const velocity: Position = {
      x: Math.cos(angle) * this.projectileSpeed,
      y: Math.sin(angle) * this.projectileSpeed
    };

    return {
      id: `${playerId}-${Date.now()}`,
      playerId,
      position: { ...player.position },
      velocity,
      damage: 10,
      createdAt: Date.now()
    };
  }

  // Check if a player collides with an obstacle
  private checkPlayerObstacleCollision(position: Position): boolean {
    for (const obstacle of this.gameState.obstacles) {
      // AABB collision detection with circle
      const closestX = Math.max(obstacle.position.x, Math.min(position.x, obstacle.position.x + obstacle.width));
      const closestY = Math.max(obstacle.position.y, Math.min(position.y, obstacle.position.y + obstacle.height));
      
      // Calculate distance between closest point and circle center
      const distanceX = position.x - closestX;
      const distanceY = position.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than radius squared
      if (distanceSquared < this.playerRadius * this.playerRadius) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }

  // Check if a projectile collides with an obstacle
  private checkProjectileObstacleCollision(position: Position): boolean {
    for (const obstacle of this.gameState.obstacles) {
      // AABB collision detection with circle
      const closestX = Math.max(obstacle.position.x, Math.min(position.x, obstacle.position.x + obstacle.width));
      const closestY = Math.max(obstacle.position.y, Math.min(position.y, obstacle.position.y + obstacle.height));
      
      // Calculate distance between closest point and circle center
      const distanceX = position.x - closestX;
      const distanceY = position.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than radius squared
      if (distanceSquared < this.projectileRadius * this.projectileRadius) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }

  // Check if a player collides with another player
  private checkPlayerPlayerCollision(playerId: string, position: Position): boolean {
    for (const id in this.gameState.players) {
      // Skip self
      if (id === playerId) continue;
      
      const otherPlayer = this.gameState.players[id];
      
      // Calculate distance between players
      const distanceX = position.x - otherPlayer.position.x;
      const distanceY = position.y - otherPlayer.position.y;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than sum of radii squared
      const minDistance = this.playerRadius * 2;
      if (distanceSquared < minDistance * minDistance) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }

  // Check if a projectile collides with a player
  private checkProjectilePlayerCollision(shooterId: string, position: Position): string | null {
    for (const id in this.gameState.players) {
      // Skip shooter (no friendly fire)
      if (id === shooterId) continue;
      
      const player = this.gameState.players[id];
      
      // Skip inactive players
      if (!player.isActive) continue;
      
      // Calculate distance between projectile and player
      const distanceX = position.x - player.position.x;
      const distanceY = position.y - player.position.y;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than sum of radii squared
      const minDistance = this.projectileRadius + this.playerRadius;
      if (distanceSquared < minDistance * minDistance) {
        return id; // Collision detected, return player ID
      }
    }
    
    return null; // No collision
  }

  // Check if an object collides with the canvas boundaries
  private checkBoundaryCollision(position: Position, radius: number): boolean {
    return (
      position.x - radius < 0 ||
      position.x + radius > this.canvasWidth ||
      position.y - radius < 0 ||
      position.y + radius > this.canvasHeight
    );
  }
}