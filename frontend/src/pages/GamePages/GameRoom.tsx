import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { leaveGame, startGame } from '../../store/slices/gameSlice';
import { leaveRoom } from '../../store/slices/lobbySlice';
import socketService from '../../services/socket/socketService';
import { GameState, Player } from '../../types';

const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const gameState = useAppSelector(
    (state) => state.game as GameState
  );
  
  const { currentRoom } = useAppSelector(
    (state) => state.lobby as { currentRoom: any }
  );
  
  const { user } = useAppSelector(
    (state) => state.auth as { user: any }
  );
  
  const isHost = currentRoom?.host.id === user?.id;

  // Connect to socket on component mount
  useEffect(() => {
    if (!roomId) {
      navigate('/lobby');
      return;
    }
    
    socketService.connect();
    socketService.joinRoom(roomId);
    
    // Clean up on unmount
    return () => {
      if (roomId) {
        socketService.leaveRoom(roomId);
      }
      socketService.disconnect();
    };
  }, [roomId, navigate]);

  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prevKeys) => ({ ...prevKeys, [e.key]: true }));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prevKeys) => ({ ...prevKeys, [e.key]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle player movement based on key presses
  useEffect(() => {
    if (gameState.status !== 'playing') return;
    
    const moveInterval = setInterval(() => {
      let moved = false;
      const position = { x: 0, y: 0 };
      
      if (keys['ArrowUp'] || keys['w']) {
        position.y = -5;
        moved = true;
      }
      if (keys['ArrowDown'] || keys['s']) {
        position.y = 5;
        moved = true;
      }
      if (keys['ArrowLeft'] || keys['a']) {
        position.x = -5;
        moved = true;
      }
      if (keys['ArrowRight'] || keys['d']) {
        position.x = 5;
        moved = true;
      }
      
      if (moved) {
        socketService.movePlayer(position);
      }
    }, 50);
    
    return () => clearInterval(moveInterval);
  }, [keys, gameState.status]);

  // Handle shooting on mouse click
  useEffect(() => {
    if (!canvasRef.current || gameState.status !== 'playing') return;
    
    const handleClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate direction angle in radians
      const playerPosition = getPlayerPosition();
      if (!playerPosition) return;
      
      const dx = x - playerPosition.x;
      const dy = y - playerPosition.y;
      const angle = Math.atan2(dy, dx);
      
      socketService.shoot(playerPosition, angle);
    };
    
    canvasRef.current.addEventListener('click', handleClick);
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [gameState.status]);

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
      ctx.fillStyle = '#555555';
      gameState.obstacles.forEach((obstacle) => {
        ctx.fillRect(obstacle.position.x, obstacle.position.y, obstacle.width, obstacle.height);
      });
      
      // Draw players
      Object.values(gameState.players).forEach((player) => {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
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
      });
      
      // Draw projectiles
      ctx.fillStyle = '#ff0000';
      Object.values(gameState.projectiles).forEach((projectile) => {
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Request next frame
      requestAnimationFrame(renderGame);
    };
    
    renderGame();
  }, [gameState]);

  const getPlayerPosition = (): { x: number; y: number } | null => {
    if (!user) return null;
    
    const player = Object.values(gameState.players).find(
      (p) => p.id === user.id
    );
    
    return player ? player.position : null;
  };

  const handleStartGame = () => {
    if (!roomId || !isHost) return;
    
    socketService.startGame(roomId);
    dispatch(startGame({ timeLimit: currentRoom.settings.timeLimit }));
  };

  const handleLeaveGame = () => {
    if (!roomId || !user) return;
    
    dispatch(leaveGame());
    dispatch(leaveRoom({ roomId, userId: user.id }));
    navigate('/lobby');
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
    },
    button: {
      backgroundColor: '#3182ce',
      color: 'white',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: '0.5rem',
    },
    leaveButton: {
      backgroundColor: '#e53e3e',
      color: 'white',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    gameContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    canvas: {
      border: '1px solid #000',
      backgroundColor: '#f0f0f0',
    },
    scoreBoard: {
      width: '100%',
      marginTop: '1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    scoreHeader: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      padding: '0.5rem',
      backgroundColor: '#4a5568',
      color: 'white',
      fontWeight: 'bold',
    },
    scoreRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      padding: '0.5rem',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: 'white',
    },
    waitingRoom: {
      textAlign: 'center' as const,
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '4px',
      border: '1px solid #e2e8f0',
      marginTop: '2rem',
    },
    playerList: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '1rem',
      marginBottom: '2rem',
    },
    playerCard: {
      padding: '1rem',
      backgroundColor: '#f7fafc',
      borderRadius: '4px',
      border: '1px solid #e2e8f0',
      textAlign: 'center' as const,
    },
    gameOver: {
      textAlign: 'center' as const,
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '4px',
      border: '1px solid #e2e8f0',
      marginTop: '2rem',
    },
    winnerText: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
    },
  };

  // Render waiting room if game not started
  if (gameState.status === 'waiting') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Game Room: {currentRoom?.name}</h1>
          <div>
            {isHost && (
              <button
                style={styles.button}
                onClick={handleStartGame}
                disabled={!currentRoom || currentRoom.players.length < 2}
              >
                Start Game
              </button>
            )}
            <button style={styles.leaveButton} onClick={handleLeaveGame}>
              Leave Room
            </button>
          </div>
        </div>
        
        <div style={styles.waitingRoom}>
          <h2>Waiting for players...</h2>
          
          <div style={styles.playerList}>
            {currentRoom?.players.map((player: any) => (
              <div key={player.id} style={styles.playerCard}>
                <div>{player.username}</div>
                {player.id === currentRoom.host.id && <div>(Host)</div>}
              </div>
            ))}
          </div>
          
          {isHost && currentRoom?.players.length < 2 && (
            <p>Need at least 2 players to start the game.</p>
          )}
          
          {!isHost && (
            <p>Waiting for the host to start the game.</p>
          )}
        </div>
      </div>
    );
  }

  // Render game over screen
  if (gameState.status === 'finished') {
    const winner = gameState.winner 
      ? Object.values(gameState.players).find(p => p.id === gameState.winner)
      : null;
    
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Game Over</h1>
          <button style={styles.leaveButton} onClick={handleLeaveGame}>
            Return to Lobby
          </button>
        </div>
        
        <div style={styles.gameOver}>
          <h2 style={styles.winnerText}>
            {winner 
              ? `Winner: ${winner.username}` 
              : 'Game Ended in a Draw'}
          </h2>
          
          <div style={styles.scoreBoard}>
            <div style={styles.scoreHeader}>
              <div>Player</div>
              <div>Score</div>
              <div>Health</div>
              <div>Status</div>
            </div>
            
            {Object.values(gameState.players)
              .sort((a, b) => b.score - a.score)
              .map((player) => (
                <div key={player.id} style={styles.scoreRow}>
                  <div>{player.username}</div>
                  <div>{player.score}</div>
                  <div>{player.health}</div>
                  <div>{player.isActive ? 'Active' : 'Eliminated'}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Render game canvas
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          {gameState.status === 'countdown' ? 'Get Ready!' : 'Game In Progress'}
        </h1>
        <div>
          <span>Time: {Math.floor(gameState.timeRemaining / 60)}:{(gameState.timeRemaining % 60).toString().padStart(2, '0')}</span>
          <button style={styles.leaveButton} onClick={handleLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>
      
      <div style={styles.gameContainer}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={styles.canvas}
        />
        
        <div style={styles.scoreBoard}>
          <div style={styles.scoreHeader}>
            <div>Player</div>
            <div>Score</div>
            <div>Health</div>
            <div>Status</div>
          </div>
          
          {Object.values(gameState.players)
            .sort((a, b) => b.score - a.score)
            .map((player) => (
              <div key={player.id} style={styles.scoreRow}>
                <div>{player.username}</div>
                <div>{player.score}</div>
                <div>{player.health}</div>
                <div>{player.isActive ? 'Active' : 'Eliminated'}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GameRoom;