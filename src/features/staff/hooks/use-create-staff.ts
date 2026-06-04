"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffResponse } from "@/features/staff/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useCreateStaff() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.post<ApiResponse<StaffResponse>>(
        "/staff",
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success(t("staff.created"));
    },
  });
}
