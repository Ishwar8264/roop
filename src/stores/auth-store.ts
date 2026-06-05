/**
 * Purpose: Global authentication state management
 * Responsibility: Manage user auth state without exposing tokens to client JavaScript
 * Important Notes:
 *   - This is the ONLY place for auth state — do not duplicate in components
 *   - Access and refresh tokens are HttpOnly cookies managed by server routes
 *   - Client stores only non-sensitive user/session UI state
 *   - initialize() must be called once on app mount to restore state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthState, UserProfile } from "@/types";

// ==================== Actions Interface ====================

interface AuthActions {
  login: (user: UserProfile) => void;
  logout: () => void;
  setUser: (user: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

// ==================== Store ====================

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (user: UserProfile) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (userData: Partial<UserProfile>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
          isAuthenticated: !!state.user,
        }));
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
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
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
