import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<LoginResponse>;
  register: (payload: { username: string; email: string; password: string; full_name?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smarthome_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smarthome_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('smarthome_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch current user profile:', error);
      // If token expired, clear
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await authApi.login(credentials);
    const accessToken = res.access_token;
    localStorage.setItem('smarthome_token', accessToken);
    setToken(accessToken);
    
    // Fetch user profile immediately
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('smarthome_user', JSON.stringify(userData));
    } catch {
      // Fallback
    }
    return res;
  };

  const register = async (payload: { username: string; email: string; password: string; full_name?: string }) => {
    return await authApi.register(payload);
  };

  const logout = () => {
    localStorage.removeItem('smarthome_token');
    localStorage.removeItem('smarthome_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
