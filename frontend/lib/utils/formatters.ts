// Formatter utility functions

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export const formatCombatPower = (power: number): string => {
  if (power >= 1000000) {
    return `${(power / 1000000).toFixed(1)}M`;
  } else if (power >= 1000) {
    return `${(power / 1000).toFixed(1)}K`;
  }
  return power.toString();
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}; 