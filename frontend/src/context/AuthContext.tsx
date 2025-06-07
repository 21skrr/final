import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: false,
  error: null,
});

// Remove the mock users as we'll use real API data

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('pmiUser');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the real API service instead of mock data
      const response = await authService.login({ email, password });
      
      // Save token and user to localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('pmiUser', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Invalid email or password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('pmiUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);