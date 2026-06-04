"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useRemoveLeave(staffId: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (leaveId: string) => {
      const res = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
        `/staff/${staffId}/leaves/${leaveId}`
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", staffId] });
      qc.invalidateQueries({ queryKey: ["staff", staffId, "leaves"] });
      toast.success(t("staff.leaveRemoved"));
    },
  });
}
