/**
 * Purpose: Global authentication state management
 * Responsibility: Manage user auth state, token, login/logout/refresh actions with sessionStorage persistence
 * Important Notes:
 *   - This is the ONLY place for auth state — do not duplicate in components
 *   - Access token stored in Zustand (RAM) + persisted to sessionStorage
 *   - Refresh token handled via HttpOnly cookie (never accessible to JS)
 *   - sessionStorage clears on tab close for security
 *   - initialize() must be called once on app mount to restore state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthState, UserProfile } from "@/types";

// ==================== Actions Interface ====================

interface AuthActions {
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  setUser: (user: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setToken: (token: string) => void;
  initialize: () => void;
}

// ==================== Store ====================

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (user: UserProfile, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (userData: Partial<UserProfile>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setToken: (token: string) => {
        set({ token });
      },

      initialize: () => {
        // Zustand persist already restored state from sessionStorage
        // This hook exists for any additional init logic
      },
    }),
    {
      name: "nr-auth", // Key in sessionStorage
      storage: createJSONStorage(() => {
        // Only use sessionStorage on client side
        if (typeof window !== "undefined") {
          return sessionStorage;
        }
        // SSR fallback — return no-op storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        // Only persist these fields — not isLoading
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
