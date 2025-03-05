import axios from 'axios';
import {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  GameRoom,
  GameSettings
} from '../../types';

class ApiService {
  private api: any;
  private readonly API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add a request interceptor to add the auth token to requests
    this.api.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Add a response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        // Handle token expiration
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method for GET requests
  private async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get(url, config);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'An error occurred'
      };
    }
  }

  // Helper method for POST requests
  private async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post(url, data, config);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'An error occurred'
      };
    }
  }

  // Helper method for PUT requests
  private async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put(url, data, config);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'An error occurred'
      };
    }
  }

  // Helper method for DELETE requests
  private async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete(url, config);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'An error occurred'
      };
    }
  }

  // Auth API methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.post<{ user: User; token: string }>('/auth/login', credentials);
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.post<{ user: User; token: string }>('/auth/register', credentials);
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.post<null>('/auth/logout');
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/auth/me');
  }

  // Game Room API methods
  async getRooms(): Promise<ApiResponse<GameRoom[]>> {
    return this.get<GameRoom[]>('/rooms');
  }

  async getRoom(roomId: string): Promise<ApiResponse<GameRoom>> {
    return this.get<GameRoom>(`/rooms/${roomId}`);
  }

  async createRoom(name: string, settings: GameSettings): Promise<ApiResponse<GameRoom>> {
    return this.post<GameRoom>('/rooms', { name, settings });
  }

  async updateRoomSettings(roomId: string, settings: GameSettings): Promise<ApiResponse<GameRoom>> {
    return this.put<GameRoom>(`/rooms/${roomId}/settings`, { settings });
  }

  async joinRoom(roomId: string): Promise<ApiResponse<GameRoom>> {
    return this.post<GameRoom>(`/rooms/${roomId}/join`);
  }

  async leaveRoom(roomId: string): Promise<ApiResponse<null>> {
    return this.post<null>(`/rooms/${roomId}/leave`);
  }

  async startGame(roomId: string): Promise<ApiResponse<null>> {
    return this.post<null>(`/rooms/${roomId}/start`);
  }

  // User API methods
  async updateProfile(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>(`/users/${userId}`, data);
  }

  async getUserStats(userId: string): Promise<ApiResponse<User>> {
    return this.get<User>(`/users/${userId}/stats`);
  }
}

// Create singleton instance
const apiService = new ApiService();
export default apiService;