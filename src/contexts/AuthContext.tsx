'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthApiService, AuthUser } from '../services/api/auth';

interface AuthContextType {
  user: AuthUser | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  initiateGoogleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id || null;
  const isAuthenticated = !!user;

  const refreshUser = async () => {
    try {
      const response = await AuthApiService.getCurrentUser();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthApiService.login(email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await AuthApiService.register(name, email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthApiService.logout();
      // Clear user state
      setUser(null);
      // Clear any stored data
      localStorage.removeItem('auth_token');
      // Clear any other stored user data if needed
      sessionStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user even if request fails
      setUser(null);
      localStorage.removeItem('auth_token');
      sessionStorage.clear();
    }
  };

  const initiateGoogleLogin = () => {
    AuthApiService.initiateGoogleLogin();
  };

  // Check for existing user session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        await refreshUser();
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    userId,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    initiateGoogleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
