// =============================================================================
// Centralized API Types — matching backend MongoDB models
// =============================================================================

// ---------------------------------------------------------------------------
// Discriminated union for API responses
// ---------------------------------------------------------------------------
export interface ApiSuccessResponse<T> {
  data: T;
  error?: undefined;
  message?: string;
}

export interface ApiErrorResponse {
  data: null;
  error: string;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export type AppRole = 'admin' | 'landlord' | 'tenant';

export interface AiTokens {
  tokens: number;
  maxTokens: number;
}

export interface ApiUser {
  _id: string;
  id?: string; // Backend register/login returns `id` instead of `_id`
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  university?: string;
  workplace?: string;
  bankName?: string;
  bankAccount?: string;
  isVerified: boolean;
  isBanned: boolean;
  role: AppRole;
  aiTokens: AiTokens;
  knockCoin: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------
export type RoomStatus = 'pending' | 'active' | 'rejected' | 'expired';

export interface ApiUtilities {
  electricityPrice?: number;
  waterPrice?: number;
  internetPrice?: number;
  cleaningFee?: number;
  parkingFee?: number;
}

export interface ApiRoom {
  _id: string;
  title: string;
  description?: string;
  address: string;
  district: string;
  price: number;
  deposit?: number;
  area?: number;
  capacity: number;
  images: string[];
  hasAirConditioner?: boolean;
  hasBed?: boolean;
  hasWardrobe?: boolean;
  hasWaterHeater?: boolean;
  hasKitchen?: boolean;
  hasFridge?: boolean;
  hasPrivateWashing?: boolean;
  hasSharedWashing?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasSecurityCamera?: boolean;
  hasFireSafety?: boolean;
  hasPetFriendly?: boolean;
  hasDryingArea?: boolean;
  hasSharedOwner?: boolean;
  isFullyFurnished?: boolean;
  utilities: ApiUtilities;
  landlordId: string | ApiUser;
  status: RoomStatus;
  rejectionReason?: string;
  expiresAt?: string;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// RoommateProfile
// ---------------------------------------------------------------------------
export interface QuizAnswer {
  questionId: number;
  selectedOption: string;
  trait?: string;
  lifestyleTag?: string;
}

export interface PersonalityScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

export interface QuizResults {
  quizAnswers: QuizAnswer[];
  personalityScores: PersonalityScores;
  personalityType: string;
  lifestyleTags: string[];
  quizCompletedAt?: Date;
}

export interface ApiRoommateProfile {
  _id: string;
  userId: string | ApiUser;
  bio?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredDistrict: string[];
  university?: string;
  lookingFor?: string;
  isPublic: boolean;
  preferences?: QuizResults;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
export interface ApiNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chat / Message (human-to-human chat, not AI)
// ---------------------------------------------------------------------------
export interface ApiChat {
  _id: string;
  participants: string[] | ApiUser[];
  lastMessage?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ApiMessage {
  _id: string;
  chatId: string;
  senderId: string | ApiUser;
  content: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Wallet & Transaction
// ---------------------------------------------------------------------------
export type TransactionType = 'topup' | 'post_fee' | 'subscription' | 'token_purchase';

export interface ApiTransaction {
  _id?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface ApiWallet {
  _id: string;
  userId: string;
  balance: number;
  transactions: ApiTransaction[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Viewing Request
// ---------------------------------------------------------------------------
export type ViewingStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'confirmed'
  | 'completed'
  | 'failed';

export type DecisionStatus = 'confirmed' | 'rejected';

export interface ViewingDecisionPayload {
  decision: DecisionStatus;
}

export interface ApiLandlordContact {
  fullName: string;
  dateOfBirth?: string;
  zalo?: string;
  bio?: string;
}

export interface ApiTenantContact {
  fullName: string;
  phone?: string;
}

export interface ApiRoomInfo {
  roomId: string;
  title: string;
  address: string;
  district: string;
  price: number;
  deposit?: number;
  roomImage?: string | null;
}

export interface ApiViewingRequest {
  _id: string;
  roomId: string;
  tenantId: string;
  landlordId: string;
  scheduledTime: string;
  status: ViewingStatus;
  roomInfo: ApiRoomInfo;
  roomImage?: string | null;
  roomArea?: number;
  roomCapacity?: number;
  landlordContact?: ApiLandlordContact;
  tenantContact?: ApiTenantContact;
  payment?: ApiPayment | null;
  tenantDecision?: DecisionStatus | null;
  landlordDecision?: DecisionStatus | null;
  refund?: { id: string; status: RefundStatus } | null;
  refundStatus?: RefundStatus | 'none';
  refundId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface ApiPayment {
  _id: string;
  viewingId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Refund Request
// ---------------------------------------------------------------------------
export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface ApiRefundRequest {
  _id: string;
  paymentId: string;
  viewingId: string;
  status: RefundStatus;
  reason: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Admin Viewing DTO
// ---------------------------------------------------------------------------
export interface AdminViewingRoomDTO {
  id: string;
  title: string;
  price: number;
  address: string;
  imageUrl: string;
}

export interface AdminViewingUserDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface AdminViewingDTO {
  id: string;
  room: AdminViewingRoomDTO;
  landlord: AdminViewingUserDTO;
  tenant: AdminViewingUserDTO;
  scheduledTime: string;
  status: ViewingStatus;
  paymentStatus: PaymentStatus | 'none';
  landlordDecision: DecisionStatus | null;
  tenantDecision: DecisionStatus | null;
  refundStatus: RefundStatus | 'none';
  refundId: string | null;
  rejectionReason: string | null;
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------
export type SubscriptionPackage = 'three_month' | 'six_month' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface ApiSubscription {
  _id: string;
  landlordId: string;
  packageType: SubscriptionPackage;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  maintenanceFee: number;
  commissionPerContract: number;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Subscription Package (returned by GET /subscription/packages)
// ---------------------------------------------------------------------------
export interface ApiSubscriptionPackage {
  type: SubscriptionPackage;
  name: string;
  price: number;
  duration: number;
  maintenanceFee: number;
  commissionPerContract: number;
  features: string[];
}

// ---------------------------------------------------------------------------
// Favorite
// ---------------------------------------------------------------------------
export interface ApiFavorite {
  _id: string;
  userId: string;
  roomId: string | ApiRoom;
  room?: ApiRoom;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// AI Usage / History
// ---------------------------------------------------------------------------
export interface ApiAiUsage {
  _id: string;
  userId: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  intent?: string;
  llmUsed?: boolean;
  responseType?: 'DB' | 'LLM' | 'FALLBACK' | 'OUT_OF_SCOPE' | 'CLARIFICATION' | 'SYSTEM_ERROR';
  roomResults?: Record<string, unknown>[];
  roommateResults?: Record<string, unknown>[];
  /** Structured comparison payload for COMPARE_ROOMS intent history restore */
  compareResults?: Record<string, unknown>[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Admin Stats
// ---------------------------------------------------------------------------
export interface AdminStatsTotals {
  revenue: number;
  users: number;
  newRooms: number;
  closeRate: number;
}

export interface AdminStatsBreakdown {
  landlords: number;
  tenants: number;
  activeRooms: number;
  pendingRooms: number;
  rejectedRooms: number;
}

export interface RevenueMonthlyEntry {
  month: string;
  revenue: number;
}

export interface UserGrowthEntry {
  month: string;
  landlords: number;
  tenants: number;
}

export interface AdminStats {
  totals: AdminStatsTotals;
  revenueMonthly: RevenueMonthlyEntry[];
  userGrowth: UserGrowthEntry[];
  recentActivity: string[];
  stats: AdminStatsBreakdown;
}

// ---------------------------------------------------------------------------
// Room create/update input (subset of ApiRoom for write operations)
// ---------------------------------------------------------------------------
export interface RoomInput {
  title: string;
  description?: string;
  address: string;
  district: string;
  price: number;
  deposit?: number;
  area?: number;
  capacity?: number;
  images?: string[];
  hasAirConditioner?: boolean;
  hasBed?: boolean;
  hasWardrobe?: boolean;
  hasWaterHeater?: boolean;
  hasKitchen?: boolean;
  hasFridge?: boolean;
  hasPrivateWashing?: boolean;
  hasSharedWashing?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasSecurityCamera?: boolean;
  hasFireSafety?: boolean;
  hasPetFriendly?: boolean;
  hasDryingArea?: boolean;
  hasSharedOwner?: boolean;
  isFullyFurnished?: boolean;
  utilities?: ApiUtilities;
}

// ---------------------------------------------------------------------------
// Roommate profile create/update input
// ---------------------------------------------------------------------------
export interface RoommateProfileInput {
  bio?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredDistrict?: string[];
  university?: string;
  lookingFor?: string;
  isPublic?: boolean;
  preferences?: QuizResults;
}

// ---------------------------------------------------------------------------
// User profile update input
// ---------------------------------------------------------------------------
export interface UserProfileInput {
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  university?: string;
  workplace?: string;
  bankName?: string;
  bankAccount?: string;
}

// ---------------------------------------------------------------------------
// Service Booking
// ---------------------------------------------------------------------------
export type ServiceType = 'moving' | 'cleaning';
export type ServiceBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface IMovingDetails {
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: 'motorbike' | 'three_wheeler' | 'small_truck';
  floorNumber?: number;
  hasElevator?: boolean;
  itemDescription?: string;
}

export interface ICleaningDetails {
  address: string;
  roomSizePackage: 'small' | 'medium' | 'large';
  estimatedArea?: number;
  cleaningType?: 'basic' | 'deep_cleaning';
}

export interface ApiServiceBooking {
  _id: string;
  tenant: string | ApiUser;
  serviceType: ServiceType;
  serviceDate: string;
  contactName: string;
  contactPhone: string;
  estimatedPrice: number;
  status: ServiceBookingStatus;
  note?: string;
  adminNote?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'wallet';
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  movingDetails?: IMovingDetails;
  cleaningDetails?: ICleaningDetails;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceBookingInput {
  serviceType: ServiceType;
  serviceDate: string;
  contactName: string;
  contactPhone: string;
  estimatedPrice: number;
  note?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'wallet';
  movingDetails?: Omit<IMovingDetails, never>;
  cleaningDetails?: Omit<ICleaningDetails, never>;
}
