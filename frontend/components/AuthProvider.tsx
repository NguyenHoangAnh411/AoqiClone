'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface AuthContextType {
  user: any;
  loading: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<any>;
  register: (userData: { username: string; email: string; password: string }) => Promise<any>;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  getUserRole: () => string | null | undefined;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}; 