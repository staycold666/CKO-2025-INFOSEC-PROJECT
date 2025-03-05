import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GameRoom, GameSettings, User } from '../../types';

interface LobbyState {
  rooms: GameRoom[];
  currentRoom: GameRoom | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: LobbyState = {
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchRooms = createAsyncThunk(
  'lobby/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      // This will be replaced with actual API call
      const response = await new Promise<GameRoom[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: '1',
              name: 'Room 1',
              host: {
                id: '1',
                username: 'Player1',
                email: 'player1@example.com',
              },
              players: [
                {
                  id: '1',
                  username: 'Player1',
                  email: 'player1@example.com',
                },
              ],
              maxPlayers: 8,
              status: 'waiting',
              settings: {
                timeLimit: 300,
                scoreLimit: 20,
                mapId: 'map1',
                friendlyFire: false,
              },
            },
            {
              id: '2',
              name: 'Room 2',
              host: {
                id: '2',
                username: 'Player2',
                email: 'player2@example.com',
              },
              players: [
                {
                  id: '2',
                  username: 'Player2',
                  email: 'player2@example.com',
                },
              ],
              maxPlayers: 4,
              status: 'waiting',
              settings: {
                timeLimit: 180,
                scoreLimit: 15,
                mapId: 'map2',
                friendlyFire: true,
              },
            },
          ]);
        }, 1000);
      });
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch rooms');
    }
  }
);

export const createRoom = createAsyncThunk(
  'lobby/createRoom',
  async (
    { name, settings, user }: { name: string; settings: GameSettings; user: User },
    { rejectWithValue }
  ) => {
    try {
      // This will be replaced with actual API call
      const response = await new Promise<GameRoom>((resolve) => {
        setTimeout(() => {
          resolve({
            id: Math.random().toString(36).substring(2, 9),
            name,
            host: user,
            players: [user],
            maxPlayers: 8,
            status: 'waiting',
            settings,
          });
        }, 1000);
      });
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create room');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'lobby/joinRoom',
  async (
    { roomId, user }: { roomId: string; user: User },
    { rejectWithValue, getState }
  ) => {
    try {
      // This will be replaced with actual API call
      const state = getState() as { lobby: LobbyState };
      const room = state.lobby.rooms.find(r => r.id === roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      const updatedRoom: GameRoom = {
        ...room,
        players: [...room.players, user],
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return updatedRoom;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to join room');
    }
  }
);

export const leaveRoom = createAsyncThunk(
  'lobby/leaveRoom',
  async (
    { roomId, userId }: { roomId: string; userId: string },
    { rejectWithValue, getState }
  ) => {
    try {
      // This will be replaced with actual API call
      const state = getState() as { lobby: LobbyState };
      const room = state.lobby.rooms.find(r => r.id === roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      const updatedRoom: GameRoom = {
        ...room,
        players: room.players.filter(p => p.id !== userId),
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { roomId, updatedRoom };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to leave room');
    }
  }
);

// Slice
const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateRoomSettings: (state, action: PayloadAction<{ roomId: string; settings: GameSettings }>) => {
      if (state.currentRoom && state.currentRoom.id === action.payload.roomId) {
        state.currentRoom.settings = action.payload.settings;
      }
      
      state.rooms = state.rooms.map(room => 
        room.id === action.payload.roomId 
          ? { ...room, settings: action.payload.settings } 
          : room
      );
    },
    updateRoomStatus: (state, action: PayloadAction<{ roomId: string; status: 'waiting' | 'playing' | 'finished' }>) => {
      if (state.currentRoom && state.currentRoom.id === action.payload.roomId) {
        state.currentRoom.status = action.payload.status;
      }
      
      state.rooms = state.rooms.map(room => 
        room.id === action.payload.roomId 
          ? { ...room, status: action.payload.status } 
          : room
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action: PayloadAction<GameRoom[]>) => {
        state.isLoading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create room
      .addCase(createRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action: PayloadAction<GameRoom>) => {
        state.isLoading = false;
        state.rooms.push(action.payload);
        state.currentRoom = action.payload;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Join room
      .addCase(joinRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action: PayloadAction<GameRoom>) => {
        state.isLoading = false;
        state.currentRoom = action.payload;
        state.rooms = state.rooms.map(room => 
          room.id === action.payload.id ? action.payload : room
        );
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Leave room
      .addCase(leaveRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(leaveRoom.fulfilled, (state, action: PayloadAction<{ roomId: string; updatedRoom: GameRoom }>) => {
        state.isLoading = false;
        state.currentRoom = null;
        state.rooms = state.rooms.map(room => 
          room.id === action.payload.roomId ? action.payload.updatedRoom : room
        );
      })
      .addCase(leaveRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateRoomSettings, updateRoomStatus } = lobbySlice.actions;
export default lobbySlice.reducer;