"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffLeaveResponse } from "@/features/staff/types";

export function useLeaves(
  staffId: string,
  query?: { year?: number; month?: number }
) {
  return useQuery({
    queryKey: ["staff", staffId, "leaves", query],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (query?.year) params.year = String(query.year);
      if (query?.month) params.month = String(query.month);
      const res = await apiClient.get<ApiResponse<StaffLeaveResponse[]>>(
        `/staff/${staffId}/leaves`,
        params
      );
      return res.data;
    },
    enabled: !!staffId,
  });
}
