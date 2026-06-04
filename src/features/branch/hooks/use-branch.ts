"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BranchDetailResponse } from "@/features/branch/types";

export function useBranch(id: string) {
  return useQuery({
    queryKey: ["branch", id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BranchDetailResponse>>(
        `/branches/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
}
