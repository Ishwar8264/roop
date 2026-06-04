"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffServiceItemResponse } from "@/features/staff/types";

export function useStaffServices(staffId: string) {
  return useQuery({
    queryKey: ["staff", staffId, "services"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StaffServiceItemResponse[]>>(
        `/staff/${staffId}/services`
      );
      return res.data;
    },
    enabled: !!staffId,
  });
}
