import api from './api';
import { User } from '../types/user';

interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  department?: string;
  programType?: string;
  supervisorId?: string;
}

interface UpdateUserRequest {
  name?: string;
  role?: string;
  department?: string;
  programType?: string;
  supervisorId?: string;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  profileVisibility: 'everyone' | 'team' | 'supervisors';
  compactMode: boolean;
}

const userService = {
  // User CRUD operations
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  updateUserStatus: async (id: string, status: string): Promise<User> => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  // User settings
  getUserSettings: async (userId: string): Promise<UserSettings> => {
    const response = await api.get(`/usersettings/${userId}`);
    return response.data;
  },

  updateUserSettings: async (userId: string, settings: UserSettings): Promise<UserSettings> => {
    const response = await api.put(`/usersettings/${userId}`, settings);
    return response.data;
  },

  // Users without onboarding (for creating new journeys)
  getUsersWithoutOnboarding: async (): Promise<User[]> => {
    const response = await api.get('/users/without-onboarding');
    return response.data;
  },

  async getEmployees(): Promise<User[]> {
    const response = await api.get('/users?role=employee');
    return response.data;
  },

  async getAllDepartments(): Promise<string[]> {
    const response = await api.get('/users/departments/all');
    return response.data;
  },
};

export default userService;