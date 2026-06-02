/**
 * Purpose: Auth initialization provider and React Query wrapper
 * Responsibility: Initialize auth state on mount, provide QueryClient to tree
 * Important Notes:
 *   - Must be "use client" — uses useEffect, useState
 *   - Wrap this around {children} in root layout — ONE time only
 *   - On mount: restores Zustand state (persist already did sessionStorage restore)
 *   - If token exists but is stale: tries /api/auth/me to validate, then refresh if 401
 *   - Shows loading screen until auth state is determined
 *   - IMPORTANT: Loading screen has timeout (3s) to avoid blocking if API is down
 */

"use client";

import { useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { UserProfile } from "@/types";

// ==================== Query Client ====================

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

// ==================== Auth Provider ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // 1. Let Zustand persist restore from sessionStorage
      useAuthStore.getState().initialize();

      // 2. If there's a stored token, verify it's still valid
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        try {
          const res = await apiClient.get<ApiResponse<{ user: UserProfile }>>(
            "/auth/me"
          );
          if (res.success && res.data?.user) {
            if (!cancelled) {
              useAuthStore.getState().setUser(res.data.user);
            }
          }
        } catch {
          // Token invalid or expired — auto-refresh attempted by api-client
          // If we're here, refresh also failed
          if (!cancelled) {
            useAuthStore.getState().logout();
          }
        }
      }

      if (!cancelled) {
        setIsReady(true);
      }
    }

    initAuth();

    // Safety timeout — don't block UI forever if API is slow
    const timeout = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
