/**
 * Purpose: Global authentication state management
 * Responsibility: Manage user auth state, token, and login/logout actions
 * Important Notes: This is the ONLY place for auth state — do not duplicate in components
 */

import { create } from "zustand";
import type { User, AuthState } from "@/types";
import { setAuthToken, removeAuthToken } from "@/services/api-client";

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  // Actions
  login: (user: User, token: string) => {
    setAuthToken(token);
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    removeAuthToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (userData: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
