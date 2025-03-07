import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchRooms, createRoom, joinRoom } from '../../store/slices/lobbySlice';
import { GameRoom, GameSettings, User } from '../../types';
import './Lobby.css';

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
    console.log('Lobby: Fetching rooms...');
    dispatch(fetchRooms());
  }, [dispatch]);

  // Navigate to game room if joined
  useEffect(() => {
    console.log('Lobby: Current room changed:', currentRoom);
    if (currentRoom) {
      console.log(`Lobby: Navigating to game room ${currentRoom.id}`);
      navigate(`/game/${currentRoom.id}`);
    }
  }, [currentRoom, navigate]);

  // Show error message when error changes
  useEffect(() => {
    if (error) {
      console.error('Lobby: Error:', error);
      alert(`Error: ${error}`);
    }
  }, [error]);

  // Log user info
  useEffect(() => {
    console.log('Lobby: User info:', user);
  }, [user]);

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

  // Detailed Shiba Inu SVG
  const shibaInuSvg = `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Main body colors -->
      <defs>
        <radialGradient id="bodyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:#F7B063" />
          <stop offset="100%" style="stop-color:#E29B4F" />
        </radialGradient>
        <radialGradient id="bellyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:#FFF5E6" />
          <stop offset="100%" style="stop-color:#F7E3C5" />
        </radialGradient>
      </defs>
      
      <!-- Body -->
      <ellipse cx="100" cy="125" rx="55" ry="45" fill="url(#bodyGradient)" />
      
      <!-- Belly -->
      <ellipse cx="100" cy="135" rx="35" ry="25" fill="url(#bellyGradient)" />
      
      <!-- Head -->
      <circle cx="100" cy="75" r="40" fill="url(#bodyGradient)" />
      
      <!-- Ears -->
      <path d="M70,55 L55,15 L85,40 Z" fill="url(#bodyGradient)" stroke="#E29B4F" stroke-width="1" />
      <path d="M130,55 L145,15 L115,40 Z" fill="url(#bodyGradient)" stroke="#E29B4F" stroke-width="1" />
      
      <!-- Inner ears -->
      <path d="M73,52 L65,25 L83,42 Z" fill="#F7E3C5" />
      <path d="M127,52 L135,25 L117,42 Z" fill="#F7E3C5" />
      
      <!-- Face mask -->
      <path d="M70,75 Q100,110 130,75 Q130,45 100,45 Q70,45 70,75 Z" fill="#F7E3C5" />
      
      <!-- Eyes -->
      <ellipse cx="85" cy="70" rx="5" ry="7" fill="#000000" />
      <ellipse cx="115" cy="70" rx="5" ry="7" fill="#000000" />
      
      <!-- Eye highlights -->
      <circle cx="83" cy="68" r="2" fill="#FFFFFF" />
      <circle cx="113" cy="68" r="2" fill="#FFFFFF" />
      
      <!-- Eyebrows -->
      <path d="M75,60 Q85,55 95,60" stroke="#8B4513" stroke-width="1.5" fill="none" />
      <path d="M105,60 Q115,55 125,60" stroke="#8B4513" stroke-width="1.5" fill="none" />
      
      <!-- Nose -->
      <path d="M95,80 Q100,85 105,80 Q100,90 95,80 Z" fill="#000000" />
      
      <!-- Mouth -->
      <path d="M90,90 Q100,100 110,90" stroke="#8B4513" stroke-width="1.5" fill="none" />
      
      <!-- Cheeks -->
      <circle cx="75" cy="85" r="8" fill="#F7B063" opacity="0.5" />
      <circle cx="125" cy="85" r="8" fill="#F7B063" opacity="0.5" />
      
      <!-- Tail -->
      <path d="M155,125 Q180,100 170,80" stroke="url(#bodyGradient)" stroke-width="15" stroke-linecap="round" fill="none" />
      <path d="M155,125 Q180,100 170,80" stroke="#E29B4F" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.5" />
      
      <!-- Legs -->
      <rect x="80" y="155" width="12" height="30" rx="6" fill="url(#bodyGradient)" />
      <rect x="108" y="155" width="12" height="30" rx="6" fill="url(#bodyGradient)" />
      <rect x="70" y="150" width="12" height="25" rx="6" fill="url(#bodyGradient)" />
      <rect x="118" y="150" width="12" height="25" rx="6" fill="url(#bodyGradient)" />
      
      <!-- Paws -->
      <ellipse cx="86" cy="185" rx="8" ry="4" fill="#E29B4F" />
      <ellipse cx="114" cy="185" rx="8" ry="4" fill="#E29B4F" />
      <ellipse cx="76" cy="175" rx="8" ry="4" fill="#E29B4F" />
      <ellipse cx="124" cy="175" rx="8" ry="4" fill="#E29B4F" />
    </svg>
  `;
  
  // Convert SVG to base64
  const shibaInuBase64 = `data:image/svg+xml;base64,${btoa(shibaInuSvg)}`;

  return (
    <div className="lobby-container">
      <div className="grass-background"></div>
      
      {/* Bouncing Shiba Inu */}
      <div className="shiba-container">
        <img src={shibaInuBase64} alt="Shiba Inu" className="shiba-image" />
      </div>
      
      <div className="content-container">
        <div className="header">
          <h1 className="title">Game Lobby</h1>
          <button 
            className="button"
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
          >
            Create Room
          </button>
        </div>

        {showCreateForm && (
          <div className="create-form">
            <h2>Create New Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label htmlFor="roomName" className="label">Room Name</label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="timeLimit" className="label">Time Limit (seconds)</label>
                <input
                  id="timeLimit"
                  name="timeLimit"
                  type="number"
                  min="60"
                  max="600"
                  value={settings.timeLimit}
                  onChange={handleSettingChange}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="scoreLimit" className="label">Score Limit</label>
                <input
                  id="scoreLimit"
                  name="scoreLimit"
                  type="number"
                  min="5"
                  max="50"
                  value={settings.scoreLimit}
                  onChange={handleSettingChange}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mapId" className="label">Map</label>
                <select
                  id="mapId"
                  name="mapId"
                  value={settings.mapId}
                  onChange={handleSettingChange}
                  className="select"
                >
                  <option value="map1">Arena 1</option>
                  <option value="map2">Arena 2</option>
                  <option value="map3">Arena 3</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="friendlyFire"
                    checked={settings.friendlyFire}
                    onChange={handleSettingChange}
                    className="checkbox"
                  />
                  Enable Friendly Fire
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="room-list">
          <h2>Available Rooms</h2>
          
          {isLoading && !rooms.length ? (
            <div className="loading">Loading rooms...</div>
          ) : !rooms.length ? (
            <div className="no-rooms">No rooms available. Create one to get started!</div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <h3 className="room-name">{room.name}</h3>
                  <span>{room.status}</span>
                </div>
                
                <div className="room-info">
                  <span>Host: {room.host.username}</span>
                  <span>Players: {room.players.length}/{room.maxPlayers}</span>
                  <span>Map: {room.settings.mapId === 'map1' ? 'Arena 1' : room.settings.mapId === 'map2' ? 'Arena 2' : 'Arena 3'}</span>
                </div>
                
                <button
                  className="join-button"
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
    </div>
  );
};

export default Lobby;
