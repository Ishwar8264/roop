"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffListResponse } from "@/features/staff/types";

export function useStaffs(query?: {
  branchId?: string;
  specialization?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["staff", query],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (query?.branchId) params.branchId = query.branchId;
      if (query?.specialization) params.specialization = query.specialization;
      if (query?.isAvailable !== undefined)
        params.isAvailable = String(query.isAvailable);
      if (query?.page) params.page = String(query.page);
      if (query?.limit) params.limit = String(query.limit);
      const res = await apiClient.get<ApiResponse<StaffListResponse>>(
        "/staff",
        params
      );
      return res.data;
    },
  });
}
