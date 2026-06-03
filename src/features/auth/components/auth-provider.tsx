/**
 * Purpose: Auth initialization provider, React Query wrapper, and client-side auth state sync
 * Responsibility: Initialize auth state on mount, sync Zustand with /api/auth/me, provide QueryClient
 * Important Notes:
 *   - Must be "use client" — uses useEffect, useState
 *   - Wrap this around {children} in root layout — ONE time only
 *   - On mount: restores Zustand state (persist already did sessionStorage restore)
 *   - If token exists but is stale: tries /api/auth/me to validate, then refresh if 401
 *   - Shows loading screen until auth state is determined
 *   - IMPORTANT: Loading screen has timeout (3s) to avoid blocking if API is down
 *   - Route protection is handled by src/middleware.ts (server-side)
 *   - This component ONLY syncs auth state — no client-side redirects
 */

"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
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

  // Initialize auth state on mount — sync Zustand with backend
  const initAuth = useCallback(async (signal: AbortSignal) => {
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
          useAuthStore.getState().setUser(res.data.user);
        }
      } catch {
        // Token invalid or expired — auto-refresh attempted by api-client
        // If we're here, refresh also failed
        if (!signal.aborted) {
          useAuthStore.getState().logout();
        }
      }
    }

    if (!signal.aborted) {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    initAuth(controller.signal);

    // Safety timeout — don't block UI forever if API is slow
    const timeout = setTimeout(() => {
      if (!controller.signal.aborted) setIsReady(true);
    }, 3000);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [initAuth]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
