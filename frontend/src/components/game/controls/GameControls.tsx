import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../../hooks/useRedux';
import { GameState, Position } from '../../../types';
import { PhysicsEngine } from '../physics/PhysicsEngine';

interface GameControlsProps {
  onMove: (position: Position) => void;
  onRotate: (rotation: number) => void;
  currentPlayerId?: string;
  canvasWidth: number;
  canvasHeight: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  onMove,
  onRotate,
  currentPlayerId,
  canvasWidth,
  canvasHeight
}) => {
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });
  
  const gameState = useAppSelector(state => state.game as GameState);
  
  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys and WASD
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      
      setKeys(prevKeys => ({ ...prevKeys, [e.key.toLowerCase()]: true }));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prevKeys => ({ ...prevKeys, [e.key.toLowerCase()]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Handle mouse movement for rotation
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentPlayerId || gameState.status !== 'playing') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Calculate rotation angle
    const player = gameState.players[currentPlayerId];
    if (player) {
      const dx = x - player.position.x;
      const dy = y - player.position.y;
      const angle = Math.atan2(dy, dx);
      
      onRotate(angle);
    }
  }, [currentPlayerId, gameState.players, gameState.status, onRotate]);
  
  // Handle player movement based on key presses
  useEffect(() => {
    if (!currentPlayerId || gameState.status !== 'playing') return;
    
    const moveInterval = setInterval(() => {
      let moved = false;
      const position = { x: 0, y: 0 };
      
      // Determine movement direction from keys
      if (keys['arrowup'] || keys['w']) {
        position.y = -1;
        moved = true;
      }
      if (keys['arrowdown'] || keys['s']) {
        position.y = 1;
        moved = true;
      }
      if (keys['arrowleft'] || keys['a']) {
        position.x = -1;
        moved = true;
      }
      if (keys['arrowright'] || keys['d']) {
        position.x = 1;
        moved = true;
      }
      
      // Normalize diagonal movement
      if (position.x !== 0 && position.y !== 0) {
        const length = Math.sqrt(position.x * position.x + position.y * position.y);
        position.x /= length;
        position.y /= length;
      }
      
      if (moved) {
        // Use physics engine to validate movement
        const physicsEngine = new PhysicsEngine(gameState, canvasWidth, canvasHeight);
        const newPosition = physicsEngine.calculatePlayerMovement(currentPlayerId, position);
        
        if (newPosition) {
          onMove(position);
        }
      }
    }, 33); // ~30 FPS
    
    return () => clearInterval(moveInterval);
  }, [keys, gameState, currentPlayerId, onMove, canvasWidth, canvasHeight]);
  
  // Render an invisible div to capture mouse events
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: gameState.status === 'playing' ? 'crosshair' : 'default',
        zIndex: 10
      }}
      onMouseMove={handleMouseMove}
    />
  );
};

export default GameControls;