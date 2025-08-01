// Types cho Auth & User với UserStats

// UserStats types
export interface UserStats {
  _id: string;
  user: string;
  golds: number;
  diamonds: number;
  standardFate: number;
  specialFate: number;
  MasterlessStarglitter: number;
  MasterlessStardust: number;
  score: number;
  rank: number;
  hasChosenStarterPet: boolean;
  tutorialCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  isActive: boolean;
  isVerified: boolean;
  isBanned: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  stats?: UserStats;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

// User Statistics types
export interface UserStatistics {
  basic: {
    score: number;
    rank: number;
    golds: number;
    diamonds: number;
    standardFate: number;
    specialFate: number;
    MasterlessStarglitter: number;
    MasterlessStardust: number;
  };
  progress: {
    hasChosenStarterPet: boolean;
    tutorialCompleted: boolean;
    isVerified: boolean;
  };
  account: {
    createdAt: string;
    lastLogin: string;
    isActive: boolean;
    isBanned: boolean;
  };
}

// Currency types
export interface CurrencyRequest {
  type: 'golds' | 'diamonds' | 'standardFate' | 'specialFate' | 'MasterlessStarglitter' | 'MasterlessStardust';
  amount: number;
}

export interface UpdateUserStatsRequest {
  score?: number;
  rank?: number;
  hasChosenStarterPet?: boolean;
  tutorialCompleted?: boolean;
}

// Leaderboard types
export interface LeaderboardUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  score: number;
  rank: number;
  golds: number;
  diamonds: number;
  createdAt: string;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Search types
export interface SearchUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
}

export interface SearchResponse {
  users: SearchUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
} 