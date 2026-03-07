// API client for Node.js backend with MongoDB
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          data: null,
        };
      }

      return { data, error: undefined };
    } catch (error) {
      console.error('API request error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        data: null,
      };
    }
  }

  // Auth endpoints
  async register(email: string, password: string, fullName: string, role?: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  async updateProfile(updates: Record<string, any>) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async sendOtp(email: string) {
    return this.request<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Rooms endpoints
  async getRooms(params?: {
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ rooms: any[]; pagination: any }>(
      `/rooms${query ? `?${query}` : ''}`
    );
  }

  async getRoom(id: string) {
    return this.request<{ room: any }>(`/rooms/${id}`);
  }

  async getMyRooms() {
    return this.request<{ rooms: any[] }>('/rooms/my/listings');
  }

  async createRoom(roomData: any) {
    return this.request<{ room: any }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id: string, roomData: any) {
    return this.request<{ room: any }>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(id: string) {
    return this.request<{ message: string }>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Wallet endpoints
  async getWallet() {
    return this.request<{ wallet: any }>('/wallet');
  }

  async topUpWallet(amount: number, method: string) {
    return this.request<{ wallet: any }>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
  }

  async getTransactions() {
    return this.request<{ transactions: any[] }>('/wallet/transactions');
  }

  // Notifications endpoints
  async getNotifications() {
    return this.request<{ notifications: any[] }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // Chat endpoints
  async getChats() {
    return this.request<{ chats: any[] }>('/chat');
  }

  async getChatMessages(chatId: string) {
    return this.request<{ messages: any[] }>(`/chat/${chatId}/messages`);
  }

  async sendMessage(chatId: string, content: string) {
    return this.request<{ message: any }>(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Roommate profiles
  async getRoommateProfiles() {
    return this.request<{ profiles: any[] }>('/roommates');
  }

  async createRoommateProfile(profileData: any) {
    return this.request<{ profile: any }>('/roommates', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async updateRoommateProfile(id: string, profileData: any) {
    return this.request<{ profile: any }>(`/roommates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<{
      totals: {
        revenue: number;
        users: number;
        newRooms: number;
        closeRate: number;
      };
      revenueMonthly: any[];
      userGrowth: any[];
      recentActivity: string[];
      stats: {
        landlords: number;
        tenants: number;
        activeRooms: number;
        pendingRooms: number;
        rejectedRooms: number;
      };
    }>('/admin/stats');
  }

  async getAdminRooms(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ rooms: any[]; pagination: any }>(
      `/admin/rooms${query ? `?${query}` : ''}`
    );
  }

  async approveRoom(id: string) {
    return this.request<{ message: string; room: any }>(`/admin/rooms/${id}/approve`, {
      method: 'PUT',
    });
  }

  async rejectRoom(id: string, reason: string) {
    return this.request<{ message: string; room: any }>(`/admin/rooms/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async getAdminUsers(params?: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ users: any[]; pagination: any }>(
      `/admin/users${query ? `?${query}` : ''}`
    );
  }

  async banUser(id: string) {
    return this.request<{ message: string; user: any }>(`/admin/users/${id}/ban`, {
      method: 'PUT',
    });
  }

  async unbanUser(id: string) {
    return this.request<{ message: string; user: any }>(`/admin/users/${id}/unban`, {
      method: 'PUT',
    });
  }

  // Favorites endpoints
  async getFavorites() {
    return this.request<{ favorites: any[] }>('/favorites');
  }

  async checkIsFavorited(roomId: string) {
    return this.request<{ isFavorited: boolean }>(`/favorites/check/${roomId}`);
  }

  async addFavorite(roomId: string) {
    return this.request<{ message: string; favorite: any }>(`/favorites/${roomId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(roomId: string) {
    return this.request<{ message: string }>(`/favorites/${roomId}`, {
      method: 'DELETE',
    });
  }

  // AI Chat endpoints
  async sendAiMessage(message: string) {
    return this.request<{
      reply: string;
      filters?: {
        intent: 'search_room' | 'general_question';
        max_price: number | null;
        district: string | null;
        amenities: string[];
      };
      results?: any[];
      tokensRemaining: number;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getAiHistory(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return this.request<{ history: any[]; pagination: any }>(
      `/ai/history${query ? `?${query}` : ''}`
    );
  }

  async getAiTokens() {
    return this.request<{ tokens: number; maxTokens: number }>('/ai/tokens');
  }

  // Subscription endpoints
  async getSubscriptionPackages() {
    return this.request<{ packages: any[] }>('/subscription/packages');
  }

  async getCurrentSubscription() {
    return this.request<{ subscription: any }>('/subscription/current');
  }

  async subscribe(packageType: string) {
    return this.request<{ subscription: any }>('/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify({ packageType }),
    });
  }

  // Contract endpoints
  async getLandlordContracts() {
    return this.request<{ contracts: any[] }>('/contracts/landlord');
  }

  async getContractDetail(id: string) {
    return this.request<{ contract: any }>(`/contracts/${id}`);
  }

  async approveContract(id: string) {
    return this.request<{ contract: any }>(`/contracts/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectContract(id: string, reason: string) {
    return this.request<{ contract: any }>(`/contracts/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async createContractRequest(roomId: string) {
    return this.request<{ contractRequest: string }>('/contracts/request', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });
  }
}

export const apiClient = new ApiClient();
