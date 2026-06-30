// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import type { ApiUser } from '@/types/api';

export type UserRole = 'admin' | 'landlord' | 'tenant';

interface User {
  _id?: string;
  id?: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  university?: string;
  workplace?: string;
  bankName?: string;
  bankAccount?: string;
  role?: UserRole;
  isVerified?: boolean;
  created_at?: string;
  aud?: string;
  knockCoin?: number;
  aiFreeChatUsed?: number;
}

interface AuthContextType {
  user: User | null;
  session: string | null; // JWT token
  role: UserRole | null;
  loading: boolean;
  walletBalance: number; // for landlords (mock)
  isAuthenticated: boolean; // New convenience flag
  signUp: (email: string, password: string, role?: UserRole, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, expectedRole?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  deductWallet: (amount: number) => boolean;
  topUpWallet: (amount: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string | null>(null); // JWT token
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock economy state
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const token = apiClient.getToken();
      if (token) {
        const { data, error } = await apiClient.getProfile();
        if (data && !error) {
          setUser(data.user);
          setSession(token);
          setRole(data.user.role as UserRole);
        } else {
          // Invalid token, clear it
          apiClient.setToken(null);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signUp = async (email: string, password: string, roleArg?: UserRole, metadata?: Record<string, unknown>) => {
    // Clear any existing token before registering with new account
    apiClient.setToken(null);

    // Call backend API to register
    try {
      const fullName = (metadata?.full_name as string) || (metadata?.fullName as string) || email.split('@')[0];
      const { data, error } = await apiClient.register(email, password, fullName, roleArg);

      if (error) {
        return { error: new Error(error) };
      }

      if (data?.token && data?.user) {
        apiClient.setToken(data.token);
        setSession(data.token);
        setUser(data.user);
        setRole(data.user.role as UserRole);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signIn = async (email: string, password: string, expectedRole?: string) => {
    // Clear any existing token before logging in with new credentials
    apiClient.setToken(null);

    // Call backend API to login (expectedRole enforces portal-based access control)
    try {
      const { data, error } = await apiClient.login(email, password, expectedRole);

      if (error) {
        // Never store a token when login fails (backend already rejected the request)
        return { error: new Error(error) };
      }

      if (data?.token && data?.user) {
        apiClient.setToken(data.token);
        setSession(data.token);
        // Fetch the full profile so all fields (phone, university, etc.) are present
        const profileRes = await apiClient.getProfile();
        const fullUser = profileRes.data?.user ?? data.user;
        setUser(fullUser);
        setRole(fullUser.role as UserRole);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    // Clear API token and state
    apiClient.setToken(null);
    setUser(null);
    setSession(null);
    setRole(null);
    setWalletBalance(0);
    // Clear quiz session to prevent leak to other accounts
    ['quiz_step', 'quiz_answers', 'quiz_selected', 'quiz_result', 'quiz_retake'].forEach(k => sessionStorage.removeItem(k));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { data, error } = await apiClient.changePassword(currentPassword, newPassword);

      if (error) {
        return { error: new Error(error) };
      }

      // Password changed successfully
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Virtual economy helpers
  const deductWallet = (amount: number) => {
    if (walletBalance >= amount) {
      setWalletBalance((b) => b - amount);
      return true;
    }
    return false;
  };

  const topUpWallet = (amount: number) => {
    setWalletBalance((b) => b + amount);
  };

  // Refresh user data from backend (after profile update)
  const refreshUser = async () => {
    try {
      const { data, error } = await apiClient.getProfile();
      if (data && !error) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      loading,
      isAuthenticated: !!user && !!role,
      walletBalance,
      signUp,
      signIn,
      signOut,
      changePassword,
      deductWallet,
      topUpWallet,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

