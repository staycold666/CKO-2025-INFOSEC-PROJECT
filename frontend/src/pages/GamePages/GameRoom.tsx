import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { leaveGame, startGame } from '../../store/slices/gameSlice';
import { leaveRoom } from '../../store/slices/lobbySlice';
import socketService from '../../services/socket/socketService';
import { GameState, Player, Position } from '../../types';
import GameCanvas from '../../components/game/arena/GameCanvas';
import GameControls from '../../components/game/controls/GameControls';

const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const canvasWidth = 800;
  const canvasHeight = 600;
  
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

  // Handle player movement
  const handlePlayerMove = useCallback((position: Position) => {
    if (gameState.status !== 'playing') return;
    socketService.movePlayer(position);
  }, [gameState.status]);

  // Handle player rotation
  const handlePlayerRotate = useCallback((rotation: number) => {
    if (gameState.status !== 'playing') return;
    socketService.rotatePlayer(rotation);
  }, [gameState.status]);

  // Handle player shooting
  const handlePlayerShoot = useCallback((position: Position, angle: number) => {
    if (gameState.status !== 'playing') return;
    socketService.shoot(position, angle);
  }, [gameState.status]);

  const handleStartGame = useCallback(() => {
    if (!roomId || !isHost) return;
    
    socketService.startGame(roomId);
    dispatch(startGame({ timeLimit: currentRoom.settings.timeLimit }));
  }, [roomId, isHost, dispatch, currentRoom]);

  const handleLeaveGame = useCallback(() => {
    if (!roomId || !user) return;
    
    dispatch(leaveGame());
    dispatch(leaveRoom({ roomId, userId: user.id }));
    navigate('/lobby');
  }, [roomId, user, dispatch, navigate]);

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
      position: 'relative' as const,
    },
    canvas: {
      border: '1px solid #000',
      backgroundColor: '#f0f0f0',
    },
    // Controls Panel Styles
    controlsPanel: {
      position: 'absolute' as const,
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 100,
      width: '200px',
    },
    controlsTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginTop: '0',
      marginBottom: '10px',
      textAlign: 'center' as const,
    },
    controlsList: {
      listStyleType: 'none',
      padding: '0',
      margin: '0',
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
                disabled={!currentRoom}
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
          
          {/* TEMPORARY: Removed minimum player requirement message */}
          
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
      
      <div style={styles.gameContainer} ref={gameContainerRef}>
        <GameCanvas
          width={canvasWidth}
          height={canvasHeight}
          onShoot={handlePlayerShoot}
          currentPlayerId={user?.id}
        />
        
        {gameState.status === 'playing' && (
          <GameControls
            onMove={handlePlayerMove}
            onRotate={handlePlayerRotate}
            onShoot={handlePlayerShoot}
            currentPlayerId={user?.id}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        )}
        
        {/* Controls Panel */}
        <div style={styles.controlsPanel}>
          <h3 style={styles.controlsTitle}>Game Controls</h3>
          <ul style={styles.controlsList}>
            <li><strong>Move:</strong> WASD or Arrow Keys</li>
            <li><strong>Aim:</strong> Arrow Keys</li>
            <li><strong>Shoot:</strong> Spacebar</li>
          </ul>
        </div>
        
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
