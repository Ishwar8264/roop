"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BranchListResponse } from "@/features/branch/types";

export function useBranches(query?: {
  city?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["branches", query],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (query?.city) params.city = query.city;
      if (query?.includeInactive) params.includeInactive = "true";
      if (query?.page) params.page = String(query.page);
      if (query?.limit) params.limit = String(query.limit);
      const res = await apiClient.get<ApiResponse<BranchListResponse>>(
        "/branches",
        params
      );
      return res.data;
    },
  });
}
