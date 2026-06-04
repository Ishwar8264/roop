"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BranchHolidayResponse } from "@/features/branch/types";

export function useHolidays(
  branchId: string,
  query?: { year?: number; month?: number }
) {
  return useQuery({
    queryKey: ["holidays", branchId, query],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (query?.year) params.year = String(query.year);
      if (query?.month) params.month = String(query.month);
      const res = await apiClient.get<ApiResponse<BranchHolidayResponse[]>>(
        `/branches/${branchId}/holidays`,
        params
      );
      return res.data;
    },
    enabled: !!branchId,
  });
}
