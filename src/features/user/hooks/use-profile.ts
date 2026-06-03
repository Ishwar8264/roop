/**
 * Purpose: React Query hook to fetch current user profile
 * Responsibility: Fetch and cache user profile data from /api/auth/me
 * Important Notes:
 *   - Caches for 5 minutes (staleTime)
 *   - Returns typed UserProfile data
 *   - Uses apiClient for authenticated requests
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse, UserProfile } from "@/types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ user: UserProfile }>>("/auth/me");
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
