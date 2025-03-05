import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchRooms, createRoom, joinRoom } from '../../store/slices/lobbySlice';
import { GameRoom, GameSettings, User } from '../../types';

const Lobby: React.FC = () => {
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    timeLimit: 300,
    scoreLimit: 20,
    mapId: 'map1',
    friendlyFire: false,
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { rooms, currentRoom, isLoading, error } = useAppSelector(
    (state) => state.lobby as { 
      rooms: GameRoom[]; 
      currentRoom: GameRoom | null; 
      isLoading: boolean; 
      error: string | null 
    }
  );
  
  const { user } = useAppSelector(
    (state) => state.auth as { user: User | null }
  );

  // Fetch rooms on component mount
  useEffect(() => {
    dispatch(fetchRooms());
  }, [dispatch]);

  // Navigate to game room if joined
  useEffect(() => {
    if (currentRoom) {
      navigate(`/game/${currentRoom.id}`);
    }
  }, [currentRoom, navigate]);

  // Show error message when error changes
  useEffect(() => {
    if (error) {
      alert(`Error: ${error}`);
    }
  }, [error]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }
    
    dispatch(createRoom({ 
      name: newRoomName, 
      settings, 
      user 
    }));
    
    setNewRoomName('');
    setShowCreateForm(false);
  };

  const handleJoinRoom = (roomId: string) => {
    if (!user) return;
    dispatch(joinRoom({ roomId, user }));
  };

  const handleSettingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings({
      ...settings,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseInt(value, 10) 
          : value,
    });
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
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
    },
    roomList: {
      marginBottom: '2rem',
    },
    roomCard: {
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #e2e8f0',
      marginBottom: '1rem',
      backgroundColor: 'white',
    },
    roomHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
    },
    roomName: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
    },
    roomInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#4a5568',
      fontSize: '0.875rem',
      marginBottom: '1rem',
    },
    joinButton: {
      backgroundColor: '#48bb78',
      color: 'white',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    createForm: {
      backgroundColor: 'white',
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #e2e8f0',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
    },
    select: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    },
    checkbox: {
      marginRight: '0.5rem',
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.5rem',
    },
    cancelButton: {
      backgroundColor: '#e2e8f0',
      color: '#4a5568',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '2rem',
    },
    noRooms: {
      textAlign: 'center' as const,
      padding: '2rem',
      color: '#4a5568',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Game Lobby</h1>
        <button 
          style={styles.button}
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          Create Room
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.createForm}>
          <h2>Create New Room</h2>
          <form onSubmit={handleCreateRoom}>
            <div style={styles.formGroup}>
              <label htmlFor="roomName" style={styles.label}>Room Name</label>
              <input
                id="roomName"
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="timeLimit" style={styles.label}>Time Limit (seconds)</label>
              <input
                id="timeLimit"
                name="timeLimit"
                type="number"
                min="60"
                max="600"
                value={settings.timeLimit}
                onChange={handleSettingChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="scoreLimit" style={styles.label}>Score Limit</label>
              <input
                id="scoreLimit"
                name="scoreLimit"
                type="number"
                min="5"
                max="50"
                value={settings.scoreLimit}
                onChange={handleSettingChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="mapId" style={styles.label}>Map</label>
              <select
                id="mapId"
                name="mapId"
                value={settings.mapId}
                onChange={handleSettingChange}
                style={styles.select}
              >
                <option value="map1">Arena 1</option>
                <option value="map2">Arena 2</option>
                <option value="map3">Arena 3</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="friendlyFire"
                  checked={settings.friendlyFire}
                  onChange={handleSettingChange}
                  style={styles.checkbox}
                />
                Enable Friendly Fire
              </label>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.button}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.roomList}>
        <h2>Available Rooms</h2>
        
        {isLoading && !rooms.length ? (
          <div style={styles.loading}>Loading rooms...</div>
        ) : !rooms.length ? (
          <div style={styles.noRooms}>No rooms available. Create one to get started!</div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} style={styles.roomCard}>
              <div style={styles.roomHeader}>
                <h3 style={styles.roomName}>{room.name}</h3>
                <span>{room.status}</span>
              </div>
              
              <div style={styles.roomInfo}>
                <span>Host: {room.host.username}</span>
                <span>Players: {room.players.length}/{room.maxPlayers}</span>
                <span>Map: {room.settings.mapId === 'map1' ? 'Arena 1' : room.settings.mapId === 'map2' ? 'Arena 2' : 'Arena 3'}</span>
              </div>
              
              <button
                style={styles.joinButton}
                onClick={() => handleJoinRoom(room.id)}
                disabled={isLoading || room.status !== 'waiting' || room.players.length >= room.maxPlayers}
              >
                {room.status !== 'waiting' 
                  ? 'Game in Progress' 
                  : room.players.length >= room.maxPlayers 
                    ? 'Room Full' 
                    : 'Join Game'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Lobby;