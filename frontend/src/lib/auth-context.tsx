'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserStats, UserStatistics, CurrencyRequest, UpdateUserStatsRequest } from './types';
import { apiClient } from './api';
import { authUtils } from './auth-utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // UserStats methods
  getUserStats: () => Promise<UserStats | null>;
  addCurrency: (data: CurrencyRequest) => Promise<UserStats | null>;
  deductCurrency: (data: CurrencyRequest) => Promise<UserStats | null>;
  updateUserStats: (data: UpdateUserStatsRequest) => Promise<UserStats | null>;
  getUserStatistics: () => Promise<UserStatistics | null>;
  
  // Refresh user data
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authUtils.isAuthenticated()) {
        const response = await apiClient.getProfile();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          // Token is invalid, remove it
          authUtils.removeToken();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authUtils.removeToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login({ username, password });
      
      if (response.success) {
        authUtils.setToken(response.data.token);
        setUser(response.data.user);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      const response = await apiClient.register({ username, email, password, displayName });
      
      if (response.success) {
        authUtils.setToken(response.data.token);
        setUser(response.data.user);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      authUtils.removeToken();
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      const response = await apiClient.updateProfile(data);
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      const response = await apiClient.changePassword({ currentPassword, newPassword });
      
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // UserStats methods
  const getUserStats = async (): Promise<UserStats | null> => {
    try {
      const response = await apiClient.getUserStats();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get user stats failed:', error);
      return null;
    }
  };

  const addCurrency = async (data: CurrencyRequest): Promise<UserStats | null> => {
    try {
      const response = await apiClient.addCurrency(data);
      if (response.success && response.data) {
        // Refresh user data to get updated stats
        await refreshUser();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Add currency failed:', error);
      throw error;
    }
  };

  const deductCurrency = async (data: CurrencyRequest): Promise<UserStats | null> => {
    try {
      const response = await apiClient.deductCurrency(data);
      if (response.success && response.data) {
        // Refresh user data to get updated stats
        await refreshUser();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Deduct currency failed:', error);
      throw error;
    }
  };

  const updateUserStats = async (data: UpdateUserStatsRequest): Promise<UserStats | null> => {
    try {
      const response = await apiClient.updateUserStats(data);
      if (response.success && response.data) {
        // Refresh user data to get updated stats
        await refreshUser();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Update user stats failed:', error);
      throw error;
    }
  };

  const getUserStatistics = async (): Promise<UserStatistics | null> => {
    try {
      const response = await apiClient.getUserStatistics();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get user statistics failed:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    getUserStats,
    addCurrency,
    deductCurrency,
    updateUserStats,
    getUserStatistics,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 