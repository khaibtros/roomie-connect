// API client for Node.js backend with MongoDB
import type {
  ApiResponse,
  ApiUser,
  ApiRoom,
  ApiWallet,
  ApiTransaction,
  ApiNotification,
  ApiChat,
  ApiMessage,
  ApiRoommateProfile,
  ApiViewingRequest,
  ApiPayment,
  ApiRefundRequest,
  ViewingDecisionPayload,
  AdminViewingDTO,
  ApiSubscription,
  ApiSubscriptionPackage,
  ApiFavorite,
  ApiAiUsage,
  AdminStats,
  Pagination,
  RoomInput,
  RoommateProfileInput,
  UserProfileInput,
} from '@/types/api';

export type { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  private async request<T>(
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
    return this.request<{ token: string; user: ApiUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request<{ user: ApiUser }>('/auth/profile');
  }

  async updateProfile(updates: UserProfileInput) {
    return this.request<{ user: ApiUser }>('/auth/profile', {
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
    return this.request<{ rooms: ApiRoom[]; pagination: Pagination }>(
      `/rooms${query ? `?${query}` : ''}`
    );
  }

  async getRoom(id: string) {
    return this.request<{ room: ApiRoom }>(`/rooms/${id}`);
  }

  async getMyRooms() {
    return this.request<{ rooms: ApiRoom[] }>('/rooms/my/listings');
  }

  async createRoom(roomData: RoomInput) {
    return this.request<{ room: ApiRoom }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id: string, roomData: Partial<RoomInput>) {
    return this.request<{ room: ApiRoom }>(`/rooms/${id}`, {
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
    return this.request<{ wallet: ApiWallet }>('/wallet');
  }

  async topUpWallet(amount: number, method: string) {
    return this.request<{ wallet: ApiWallet }>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
  }

  async getTransactions() {
    return this.request<{ transactions: ApiTransaction[] }>('/wallet/transactions');
  }

  // Notifications endpoints
  async getNotifications() {
    return this.request<{ notifications: ApiNotification[] }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // Chat endpoints
  async getChats() {
    return this.request<{ chats: ApiChat[] }>('/chat');
  }

  async getChatMessages(chatId: string) {
    return this.request<{ messages: ApiMessage[] }>(`/chat/${chatId}/messages`);
  }

  async sendMessage(chatId: string, content: string) {
    return this.request<{ message: ApiMessage }>(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Roommate profiles
  async getRoommateProfiles() {
    return this.request<{ profiles: ApiRoommateProfile[] }>('/roommates');
  }

  async createRoommateProfile(profileData: RoommateProfileInput) {
    return this.request<{ profile: ApiRoommateProfile }>('/roommates', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async updateRoommateProfile(id: string, profileData: Partial<RoommateProfileInput>) {
    return this.request<{ profile: ApiRoommateProfile }>(`/roommates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<AdminStats>('/admin/stats');
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
    return this.request<{ rooms: ApiRoom[]; pagination: Pagination }>(
      `/admin/rooms${query ? `?${query}` : ''}`
    );
  }

  async approveRoom(id: string) {
    return this.request<{ message: string; room: ApiRoom }>(`/admin/rooms/${id}/approve`, {
      method: 'PUT',
    });
  }

  async rejectRoom(id: string, reason: string) {
    return this.request<{ message: string; room: ApiRoom }>(`/admin/rooms/${id}/reject`, {
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
    return this.request<{ users: ApiUser[]; pagination: Pagination }>(
      `/admin/users${query ? `?${query}` : ''}`
    );
  }

  async banUser(id: string) {
    return this.request<{ message: string; user: ApiUser }>(`/admin/users/${id}/ban`, {
      method: 'PUT',
    });
  }

  async unbanUser(id: string) {
    return this.request<{ message: string; user: ApiUser }>(`/admin/users/${id}/unban`, {
      method: 'PUT',
    });
  }

  // Favorites endpoints
  async getFavorites() {
    return this.request<{ favorites: ApiFavorite[] }>('/favorites');
  }

  async checkIsFavorited(roomId: string) {
    return this.request<{ isFavorited: boolean }>(`/favorites/check/${roomId}`);
  }

  async addFavorite(roomId: string) {
    return this.request<{ message: string; favorite: ApiFavorite }>(`/favorites/${roomId}`, {
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
      success: boolean;
      data: string;                              // LLM reply text
      error?: string;
      rooms?: Record<string, unknown>[];         // populated on room-search queries
      roommates?: Record<string, unknown>[];     // populated on roommate-search queries
      tokensRemaining?: number;                  // updated balance after deduction
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
    return this.request<{ history: ApiAiUsage[]; pagination: Pagination }>(
      `/ai/history${query ? `?${query}` : ''}`
    );
  }

  async getAiTokens() {
    return this.request<{ tokens: number; maxTokens: number }>('/ai/tokens');
  }

  async clearAiHistory() {
    return this.request<{ success: boolean; deleted: number }>('/ai/history', {
      method: 'DELETE',
    });
  }

  // Subscription endpoints
  async getSubscriptionPackages() {
    return this.request<{ packages: ApiSubscriptionPackage[] }>('/subscription/packages');
  }

  async getCurrentSubscription() {
    return this.request<{ subscription: ApiSubscription }>('/subscription/current');
  }

  async subscribe(packageType: string) {
    return this.request<{ subscription: ApiSubscription; checkoutUrl?: string }>('/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify({ packageType }),
    });
  }

  // Viewing endpoints (Tenant)
  async createViewingRequest(roomId: string, scheduledTime: string) {
    return this.request<{ viewingRequest: ApiViewingRequest }>('/viewings/request', {
      method: 'POST',
      body: JSON.stringify({ roomId, scheduledTime }),
    });
  }

  async getMyViewings() {
    return this.request<{ viewings: ApiViewingRequest[] }>('/viewings/tenant');
  }

  async cancelViewing(id: string) {
    return this.request<{ message: string }>(`/viewings/${id}`, {
      method: 'DELETE',
    });
  }

  async submitTenantDecision(id: string, payload: ViewingDecisionPayload) {
    return this.request<{
      viewing: ApiViewingRequest;
      refund: ApiRefundRequest | null;
    }>(`/viewings/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Viewing endpoints (Landlord)
  async getLandlordViewings() {
    return this.request<{ viewings: ApiViewingRequest[] }>('/landlord/viewings');
  }

  async approveViewing(id: string) {
    return this.request<{ viewing: ApiViewingRequest }>(`/landlord/viewings/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectViewing(id: string, reason: string) {
    return this.request<{ viewing: ApiViewingRequest }>(`/landlord/viewings/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async payViewing(id: string) {
    return this.request<{
      viewing: ApiViewingRequest;
      payment: ApiPayment;
    }>(`/landlord/viewings/${id}/pay`, {
      method: 'POST',
    });
  }

  async submitLandlordDecision(id: string, payload: ViewingDecisionPayload) {
    return this.request<{
      viewing: ApiViewingRequest;
      refund: ApiRefundRequest | null;
    }>(`/landlord/viewings/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Knock Coin endpoints
  async getCoinPackages() {
    return this.request<{ packages: any[] }>('/coin/packages');
  }

  async purchaseCoins(packageType: string) {
    return this.request<{ transaction: any; checkoutUrl: string }>('/coin/purchase', {
      method: 'POST',
      body: JSON.stringify({ packageType }),
    });
  }

  // Admin Viewing endpoints
  async getAdminViewings() {
    return this.request<{ viewings: AdminViewingDTO[] }>('/admin/viewings');
  }

  async getAdminViewing(id: string) {
    return this.request<{ viewing: AdminViewingDTO }>(`/admin/viewings/${id}`);
  }

  async approveRefund(id: string) {
    return this.request<{ message: string }>(`/admin/refunds/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectRefund(id: string) {
    return this.request<{ message: string }>(`/admin/refunds/${id}/reject`, {
      method: 'PATCH',
    });
  }

  /**
   * Upload a pre-processed avatar Blob via FormData.
   * The backend saves the file, returns { avatarUrl } pointing to the
   * stored file (never a base64 string).
   *
   * @param formData - Must contain a single field "avatar" with a Blob/File.
   */
  async uploadAvatar(formData: FormData): Promise<{ data: { avatarUrl: string }; error?: string }> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Do NOT set Content-Type; the browser sets it with the correct boundary.
    try {
      const response = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { data: { avatarUrl: '' }, error: data.error || `HTTP ${response.status}` };
      }
      return { data };
    } catch (err) {
      return {
        data: { avatarUrl: '' },
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }
}

export const apiClient = new ApiClient();
