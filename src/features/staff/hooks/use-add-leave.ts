"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffLeaveResponse } from "@/features/staff/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useAddLeave(staffId: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: { date: string; reason?: string }) => {
      const res = await apiClient.post<ApiResponse<StaffLeaveResponse>>(
        `/staff/${staffId}/leaves`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", staffId] });
      qc.invalidateQueries({ queryKey: ["staff", staffId, "leaves"] });
      toast.success(t("staff.leaveAdded"));
    },
  });
}
