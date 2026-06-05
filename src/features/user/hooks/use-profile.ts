/**
 * Purpose: Fetch current user profile
 * Responsibility: Fetch user profile data from /api/auth/me
 * Important Notes:
 *   - Uses plain fetch (no TanStack Query)
 *   - Returns typed UserProfile data
 *   - Auto-fetches on mount
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, UserProfile } from "@/types";

export function useProfile() {
  const [data, setData] = useState<{ user: UserProfile } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetched = useRef(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });
      const json: ApiResponse<{ user: UserProfile }> = await res.json();
      if (!res.ok) throw new Error(json.message || "Error fetching profile");
      setData(json.data ?? null);
      if (json.data?.user) {
        useAuthStore.getState().setUser(json.data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount (only once)
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      void refetch();
    }
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
