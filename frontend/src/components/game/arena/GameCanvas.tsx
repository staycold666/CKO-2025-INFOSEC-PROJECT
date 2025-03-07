import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '../../../hooks/useRedux';
import { GameState, Player, Projectile, Obstacle } from '../../../types';
import { PhysicsEngine } from '../physics/PhysicsEngine';

interface GameCanvasProps {
  width: number;
  height: number;
  onShoot: (position: { x: number; y: number }, angle: number) => void;
  currentPlayerId?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  width, 
  height, 
  onShoot,
  currentPlayerId 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  
  const gameState = useAppSelector(state => state.game as GameState);
  
  // Initialize physics engine
  useEffect(() => {
    if (gameState) {
      physicsEngineRef.current = new PhysicsEngine(gameState, width, height);
    }
  }, [gameState, width, height]);
  
  // Update physics engine when game state changes
  useEffect(() => {
    if (physicsEngineRef.current) {
      physicsEngineRef.current.updateGameState(gameState);
    }
  }, [gameState]);
  
  // Handle shooting on mouse click
  useEffect(() => {
    if (!canvasRef.current || gameState.status !== 'playing' || !currentPlayerId) return;
    
    const handleClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Get current player position
      const player = gameState.players[currentPlayerId];
      if (!player) return;
      
      // Calculate direction angle in radians
      const dx = x - player.position.x;
      const dy = y - player.position.y;
      const angle = Math.atan2(dy, dx);
      
      // Call the onShoot callback
      onShoot(player.position, angle);
    };
    
    canvasRef.current.addEventListener('click', handleClick);
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [gameState.status, gameState.players, currentPlayerId, onShoot]);
  
  // Render game on canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const renderGame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw obstacles
      renderObstacles(ctx, gameState.obstacles);
      
      // Draw players
      renderPlayers(ctx, gameState.players, currentPlayerId);
      
      // Draw projectiles
      renderProjectiles(ctx, gameState.projectiles);
      
      // Draw game status
      renderGameStatus(ctx, gameState);
      
      // Request next frame
      requestAnimationFrame(renderGame);
    };
    
    renderGame();
  }, [gameState, currentPlayerId, width, height]);
  
  // Render obstacles
  const renderObstacles = (ctx: CanvasRenderingContext2D, obstacles: Obstacle[]) => {
    obstacles.forEach(obstacle => {
      // Different colors for different obstacle types
      switch (obstacle.type) {
        case 'wall':
          ctx.fillStyle = '#555555';
          break;
        case 'barrier':
          ctx.fillStyle = '#777777';
          break;
        case 'cover':
          ctx.fillStyle = '#999999';
          break;
        default:
          ctx.fillStyle = '#555555';
      }
      
      ctx.fillRect(obstacle.position.x, obstacle.position.y, obstacle.width, obstacle.height);
    });
  };
  
  // Render players
  const renderPlayers = (ctx: CanvasRenderingContext2D, players: Record<string, Player>, currentPlayerId?: string) => {
    Object.values(players).forEach(player => {
      // Highlight current player
      const isCurrentPlayer = player.id === currentPlayerId;
      
      // Draw player body
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw player direction indicator
      const dirX = player.position.x + Math.cos(player.rotation) * 25;
      const dirY = player.position.y + Math.sin(player.rotation) * 25;
      ctx.strokeStyle = isCurrentPlayer ? '#000000' : '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.position.x, player.position.y);
      ctx.lineTo(dirX, dirY);
      ctx.stroke();
      
      // Draw player name
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.username, player.position.x, player.position.y - 30);
      
      // Draw health bar
      const healthBarWidth = 40;
      const healthPercentage = player.health / 100;
      
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(player.position.x - healthBarWidth / 2, player.position.y - 25, healthBarWidth, 5);
      
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        player.position.x - healthBarWidth / 2,
        player.position.y - 25,
        healthBarWidth * healthPercentage,
        5
      );
      
      // Add a border for the current player
      if (isCurrentPlayer) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, 23, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };
  
  // Render projectiles
  const renderProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Record<string, Projectile>) => {
    Object.values(projectiles).forEach(projectile => {
      // Safety check for valid position
      if (!projectile.position ||
          !Number.isFinite(projectile.position.x) ||
          !Number.isFinite(projectile.position.y)) {
        console.warn('Invalid projectile position:', projectile);
        return;
      }
      
      try {
        // Draw projectile (the simple red dot)
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Only render trail if we have valid velocity values
        if (projectile.velocity &&
            Number.isFinite(projectile.velocity.x) &&
            Number.isFinite(projectile.velocity.y) &&
            (projectile.velocity.x !== 0 || projectile.velocity.y !== 0)) {
          
          // Calculate trail point safely (avoid division by zero)
          const trailLength = 10;
          let trailX = projectile.position.x;
          let trailY = projectile.position.y;
          
          // Move back from projectile position in opposite direction of velocity
          trailX -= projectile.velocity.x * trailLength / Math.max(1, Math.abs(projectile.velocity.x));
          trailY -= projectile.velocity.y * trailLength / Math.max(1, Math.abs(projectile.velocity.y));
          
          // Check if the calculated trail point is valid
          if (Number.isFinite(trailX) && Number.isFinite(trailY)) {
            // Create gradient for trail
            const gradient = ctx.createLinearGradient(
              trailX, trailY,
              projectile.position.x, projectile.position.y
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');
            
            // Draw trail
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(trailX, trailY);
            ctx.lineTo(projectile.position.x, projectile.position.y);
            ctx.stroke();
          }
        }
      } catch (err) {
        console.error('Error rendering projectile:', err);
      }
    });
  };
  
  // Render game status
  const renderGameStatus = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
    if (gameState.status === 'countdown') {
      // Draw countdown
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(gameState.timeRemaining).toString(), width / 2, height / 2);
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid #000', backgroundColor: '#f0f0f0' }}
    />
  );
};

export default GameCanvas;
