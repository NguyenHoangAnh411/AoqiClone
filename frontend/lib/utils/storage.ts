// Storage utility functions

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userToken');
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userToken', token);
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userToken');
};

export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : (defaultValue || null);
    } catch {
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },
  
  has: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(key) !== null;
  },
};

// User-specific storage helpers
export const userStorage = {
  getUser: () => storage.get('user'),
  setUser: (user: any) => storage.set('user', user),
  removeUser: () => storage.remove('user'),
  
  getSettings: () => storage.get('userSettings', {}),
  setSettings: (settings: any) => storage.set('userSettings', settings),
  
  getLastFormation: () => storage.get('lastFormationId'),
  setLastFormation: (formationId: string) => storage.set('lastFormationId', formationId),
}; 