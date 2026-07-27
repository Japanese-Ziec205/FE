'use client';

import { create } from 'zustand';
import { api, setAccessToken, setUnauthorizedHandler } from './api-client';
import type { AuthResult, PublicUser, RegisterResult, VerifyOtpResult } from './types';

interface AuthState {
  user: PublicUser | null;
  /** `true` cho tới khi bootstrap() chạy xong — tránh nháy giao diện khi tải lại trang. */
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;

  bootstrap: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  register: (input: {
    identifier: string;
    password: string;
    displayName: string;
  }) => Promise<RegisterResult>;
  verifyOtp: (identifier: string, code: string, purpose: string) => Promise<VerifyOtpResult>;
  logout: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  onboardingCompleted: false,

  /**
   * Chạy một lần khi ứng dụng khởi động. Access token chỉ nằm trong RAM nên
   * sau khi tải lại trang là mất — phải hỏi lại server bằng cookie httpOnly.
   */
  bootstrap: async () => {
    setUnauthorizedHandler(() => {
      set({ user: null, isAuthenticated: false });
    });

    try {
      const ok = await api.refresh();
      if (!ok) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const data = await api.get<{ user: PublicUser; onboardingCompleted: boolean }>('/auth/me');
      set({
        user: data.user,
        isAuthenticated: true,
        onboardingCompleted: data.onboardingCompleted,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (identifier, password) => {
    const data = await api.post<AuthResult>(
      '/auth/login',
      { identifier, password },
      { skipAuthRetry: true },
    );
    setAccessToken(data.accessToken);
    set({
      user: data.user,
      isAuthenticated: true,
      onboardingCompleted: data.onboardingCompleted ?? false,
      isLoading: false,
    });
    return data;
  },

  register: async (input) =>
    api.post<RegisterResult>('/auth/register', { ...input, acceptTerms: true }, { skipAuthRetry: true }),

  verifyOtp: async (identifier, code, purpose) => {
    const data = await api.post<VerifyOtpResult>(
      '/auth/otp/verify',
      { identifier, code, purpose },
      { skipAuthRetry: true },
    );
    if (data.accessToken && data.user) {
      setAccessToken(data.accessToken);
      set({
        user: data.user,
        isAuthenticated: true,
        onboardingCompleted: data.onboardingCompleted ?? false,
        isLoading: false,
      });
    }
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Đăng xuất phía client vẫn phải thành công dù server không phản hồi
    }
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, onboardingCompleted: false });
  },

  setUser: (user) => set({ user, isAuthenticated: user !== null }),

  refreshUser: async () => {
    if (!get().isAuthenticated) return;
    try {
      const data = await api.get<{ user: PublicUser; onboardingCompleted: boolean }>('/auth/me');
      set({ user: data.user, onboardingCompleted: data.onboardingCompleted });
    } catch {
      // Bỏ qua: api-client đã xử lý trường hợp phiên hết hạn
    }
  },
}));
