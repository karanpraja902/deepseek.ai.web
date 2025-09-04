'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@/lib/auth-client';
import { AuthUser } from '@/lib/auth-actions';

interface AuthContextType {
  user: AuthUser | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

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
      console.log('AuthContext: Refreshing user...');
      console.log('AuthContext: Current cookies:', document.cookie);
      
      const response = await AuthClient.getCurrentUser();
      console.log('AuthContext: API response:', response);
      
      if (response.success && response.data?.user) {
        console.log('AuthContext: Setting user:', response.data.user);
        setUser(response.data.user);
      } else {
        console.log('AuthContext: No user data in response, clearing user');
        setUser(null);
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('AuthContext: Failed to refresh user:', error);
      
      // Enhanced error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('AuthContext: Network error during user refresh');
        throw new Error('Network error - please check your connection');
      }
      
      // Check for specific HTTP status codes
      if (error instanceof Error && error.message.includes('401')) {
        console.error('AuthContext: Authentication failed - invalid or expired token');
        throw new Error('Authentication expired - please sign in again');
      }
      
      if (error instanceof Error && error.message.includes('403')) {
        console.error('AuthContext: Authorization failed - insufficient permissions');
        throw new Error('Access denied - insufficient permissions');
      }
      
      setUser(null);
      throw error; // Re-throw to allow calling components to handle
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthClient.login(email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await AuthClient.register(name, email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthClient.logout();
      // Clear user state
      setUser(null);
      // Clear any other stored user data if needed
      sessionStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user even if request fails
      setUser(null);
      sessionStorage.clear();
    }
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
  
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
