// Color utility functions

export const getElementColor = (element: string): string => {
  const colors: Record<string, string> = {
    fire: '#ff4757',
    water: '#3742fa',
    earth: '#2ed573',
    air: '#70a1ff',
    light: '#ffa502',
    dark: '#2f3542',
  };
  return colors[element.toLowerCase()] || '#747d8c';
};

export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: '#9e9e9e',
    uncommon: '#4caf50',
    rare: '#2196f3',
    epic: '#9c27b0',
    legendary: '#ff9800',
    mythical: '#f44336',
  };
  return colors[rarity.toLowerCase()] || '#9e9e9e';
};

export const getRarityBorderColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: '#757575',
    uncommon: '#388e3c',
    rare: '#1976d2',
    epic: '#7b1fa2',
    legendary: '#f57c00',
    mythical: '#d32f2f',
  };
  return colors[rarity.toLowerCase()] || '#757575';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '#4caf50',
    inactive: '#9e9e9e',
    pending: '#ff9800',
    error: '#f44336',
    success: '#4caf50',
    warning: '#ff9800',
  };
  return colors[status.toLowerCase()] || '#9e9e9e';
}; 