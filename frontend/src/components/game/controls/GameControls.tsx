import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../../hooks/useRedux';
import { GameState, Position } from '../../../types';
import { PhysicsEngine } from '../physics/PhysicsEngine';

interface GameControlsProps {
  onMove: (position: Position) => void;
  onRotate: (rotation: number) => void;
  onShoot: (position: Position, angle: number) => void;
  currentPlayerId?: string;
  canvasWidth: number;
  canvasHeight: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  onMove,
  onRotate,
  onShoot,
  currentPlayerId,
  canvasWidth,
  canvasHeight
}) => {
  // Simplified key state tracking with direct key codes
  const [keysPressed, setKeysPressed] = useState(new Set<number>());
  const [lastShootTime, setLastShootTime] = useState(0);
  
  const gameState = useAppSelector(state => state.game as GameState);
  
  // Key constants
  const KEY_W = 87;
  const KEY_A = 65;
  const KEY_S = 83;
  const KEY_D = 68;
  const KEY_UP = 38;
  const KEY_DOWN = 40;
  const KEY_LEFT = 37;
  const KEY_RIGHT = 39;
  const KEY_SPACE = 32;
  
  // Basic key event handlers
  useEffect(() => {
    console.log('Setting up keyboard handlers');
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyCode = e.keyCode || e.which;
      console.log(`Key down: ${e.key} (${keyCode})`);
      
      // Prevent default for game control keys
      if ([KEY_W, KEY_A, KEY_S, KEY_D, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_SPACE].includes(keyCode)) {
        e.preventDefault();
        
        // Add to pressed keys
        setKeysPressed(prev => {
          const newSet = new Set(prev);
          newSet.add(keyCode);
          return newSet;
        });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const keyCode = e.keyCode || e.which;
      console.log(`Key up: ${e.key} (${keyCode})`);
      
      // Remove from pressed keys
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyCode);
        return newSet;
      });
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Main game loop to process keyboard input
  useEffect(() => {
    if (gameState.status !== 'playing') {
      return;
    }
    
    console.log('Setting up game control loop. Current player:', currentPlayerId);
    
    // Find a player ID to use
    const playerIdToUse = currentPlayerId || Object.keys(gameState.players)[0];
    if (!playerIdToUse) {
      console.log('No player ID available');
      return;
    }
    
    const gameLoop = setInterval(() => {
      // Get current keys
      const keys = Array.from(keysPressed);
      console.log('Current keys:', keys);
      
      // 1. Handle movement (WASD)
      let moveX = 0;
      let moveY = 0;
      
      if (keys.includes(KEY_W)) moveY -= 1;
      if (keys.includes(KEY_S)) moveY += 1;
      if (keys.includes(KEY_A)) moveX -= 1;
      if (keys.includes(KEY_D)) moveX += 1;
      
      // If we have movement
      if (moveX !== 0 || moveY !== 0) {
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
          const length = Math.sqrt(moveX * moveX + moveY * moveY);
          moveX /= length;
          moveY /= length;
        }
        
        const position = { x: moveX, y: moveY };
        console.log('Moving:', position);
        onMove(position);
      }
      
      // 2. Handle rotation (arrow keys)
      const player = gameState.players[playerIdToUse];
      if (player) {
        let angle = player.rotation || 0;
        let rotationChanged = false;
        
        // Calculate angle based on arrow keys
        if (keys.includes(KEY_UP) && !keys.includes(KEY_DOWN)) {
          if (keys.includes(KEY_LEFT) && !keys.includes(KEY_RIGHT)) {
            angle = -3 * Math.PI / 4; // Up-Left
          } else if (keys.includes(KEY_RIGHT) && !keys.includes(KEY_LEFT)) {
            angle = -Math.PI / 4; // Up-Right
          } else {
            angle = -Math.PI / 2; // Up
          }
          rotationChanged = true;
        } else if (keys.includes(KEY_DOWN) && !keys.includes(KEY_UP)) {
          if (keys.includes(KEY_LEFT) && !keys.includes(KEY_RIGHT)) {
            angle = 3 * Math.PI / 4; // Down-Left
          } else if (keys.includes(KEY_RIGHT) && !keys.includes(KEY_LEFT)) {
            angle = Math.PI / 4; // Down-Right
          } else {
            angle = Math.PI / 2; // Down
          }
          rotationChanged = true;
        } else if (keys.includes(KEY_LEFT) && !keys.includes(KEY_RIGHT)) {
          angle = Math.PI; // Left
          rotationChanged = true;
        } else if (keys.includes(KEY_RIGHT) && !keys.includes(KEY_LEFT)) {
          angle = 0; // Right
          rotationChanged = true;
        }
        
        if (rotationChanged) {
          console.log('Rotating to:', angle);
          onRotate(angle);
        }
        
        // 3. Handle shooting (spacebar)
        if (keys.includes(KEY_SPACE)) {
          const now = Date.now();
          // Limit to shooting every 300ms
          if (now - lastShootTime > 300) {
            console.log('Shooting!');
            
            // Get player position and rotation for shooting
            const shootPosition = {
              x: player.position.x + Math.cos(angle) * 30,
              y: player.position.y + Math.sin(angle) * 30
            };
            
            onShoot(shootPosition, angle);
            setLastShootTime(now);
          }
        }
      }
    }, 33); // ~30 FPS
    
    return () => clearInterval(gameLoop);
  }, [
    gameState, 
    currentPlayerId, 
    keysPressed, 
    lastShootTime, 
    onMove, 
    onRotate, 
    onShoot, 
    canvasWidth, 
    canvasHeight
  ]);
  
  // Render an invisible div to capture key events
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10
      }}
    />
  );
};

export default GameControls;
