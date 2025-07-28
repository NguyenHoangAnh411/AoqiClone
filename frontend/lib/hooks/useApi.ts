import { useState, useCallback } from 'react';
import { getAuthToken } from '../utils/storage';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UseApiState {
  loading: boolean;
  error: string;
}

interface UseApiReturn extends UseApiState {
  execute: <T = any>(endpoint: string, options?: RequestInit) => Promise<T | null>;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useApi = (): UseApiReturn => {
  const [state, setState] = useState<UseApiState>({
    loading: false,
    error: '',
  });

  const execute = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }));
      
      const token = getAuthToken();
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(endpoint, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: '' }));
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: '' });
  }, []);

  return {
    ...state,
    execute,
    setError,
    clearError,
    reset,
  };
}; 