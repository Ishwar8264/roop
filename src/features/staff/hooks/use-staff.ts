"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffDetailResponse } from "@/features/staff/types";

export function useStaff(id: string) {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StaffDetailResponse>>(
        `/staff/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
}
