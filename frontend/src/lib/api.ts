import { 
  User, 
  UserStats,
  UserStatistics,
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  ApiResponse,
  CurrencyRequest,
  UpdateUserStatsRequest,
  LeaderboardResponse,
  SearchResponse
} from './types';
import { apiHelpers } from './api-utils';

// API Client cho Auth & User với UserStats
class ApiClient {
  // ==================== AUTHENTICATION APIs ====================
  
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiHelpers.post<AuthResponse>('/auth/register', data);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiHelpers.post<AuthResponse>('/auth/login', data);
  }

  async logout(): Promise<ApiResponse> {
    return apiHelpers.post<ApiResponse>('/auth/logout');
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return apiHelpers.post<ApiResponse>('/auth/change-password', data);
  }

  // ==================== USER PROFILE APIs ====================
  
  async getProfile(): Promise<ApiResponse<User>> {
    return apiHelpers.get<ApiResponse<User>>('/users/profile');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiHelpers.put<ApiResponse<User>>('/users/profile', data);
  }

  async updateAvatar(data: { avatar: string }): Promise<ApiResponse<User>> {
    return apiHelpers.put<ApiResponse<User>>('/users/avatar', data);
  }

  async deleteAccount(data: { password: string }): Promise<ApiResponse> {
    return apiHelpers.post<ApiResponse>('/users/account', data);
  }

  // ==================== USER STATS APIs ====================
  
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return apiHelpers.get<ApiResponse<UserStats>>('/users/stats');
  }

  async addCurrency(data: CurrencyRequest): Promise<ApiResponse<UserStats>> {
    return apiHelpers.post<ApiResponse<UserStats>>('/users/stats/currency/add', data);
  }

  async deductCurrency(data: CurrencyRequest): Promise<ApiResponse<UserStats>> {
    return apiHelpers.post<ApiResponse<UserStats>>('/users/stats/currency/deduct', data);
  }

  async updateUserStats(data: UpdateUserStatsRequest): Promise<ApiResponse<UserStats>> {
    return apiHelpers.put<ApiResponse<UserStats>>('/users/stats', data);
  }

  async getUserStatistics(): Promise<ApiResponse<UserStatistics>> {
    return apiHelpers.get<ApiResponse<UserStatistics>>('/users/statistics');
  }

  // ==================== PUBLIC USER APIs ====================
  
  async searchUsers(query: string, page: number = 1, limit: number = 10): Promise<ApiResponse<SearchResponse>> {
    return apiHelpers.get<ApiResponse<SearchResponse>>(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  async getLeaderboard(type: 'score' | 'golds' | 'diamonds' = 'score', page: number = 1, limit: number = 20): Promise<ApiResponse<LeaderboardResponse>> {
    return apiHelpers.get<ApiResponse<LeaderboardResponse>>(`/users/leaderboard?type=${type}&page=${page}&limit=${limit}`);
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    return apiHelpers.get<ApiResponse<User>>(`/users/${userId}`);
  }

  // ==================== ADMIN APIs ====================
  
  async getAllUsers(page: number = 1, limit: number = 20, search?: string, role?: string, status?: string): Promise<ApiResponse<SearchResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    
    return apiHelpers.get<ApiResponse<SearchResponse>>(`/users/admin/list?${params.toString()}`);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return apiHelpers.put<ApiResponse<User>>(`/users/admin/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return apiHelpers.delete<ApiResponse>(`/users/admin/${userId}`);
  }

  async banUser(userId: string, data: { reason?: string; duration?: number }): Promise<ApiResponse<User>> {
    return apiHelpers.post<ApiResponse<User>>(`/users/admin/ban/${userId}`, data);
  }

  async unbanUser(userId: string): Promise<ApiResponse<User>> {
    return apiHelpers.post<ApiResponse<User>>(`/users/admin/unban/${userId}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
