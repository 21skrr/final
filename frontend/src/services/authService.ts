import api from './api';
import { User } from '../types/user';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Check if user is logged in
  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  },

  // Get current user from localStorage
  getUser: (): User | null => {
    const user = localStorage.getItem('pmiUser');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;