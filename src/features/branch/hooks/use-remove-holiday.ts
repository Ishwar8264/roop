"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useRemoveHoliday(branchId: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (holidayId: string) => {
      const res = await apiClient.delete<
        ApiResponse<{ deleted: boolean }>
      >(`/branches/${branchId}/holidays/${holidayId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays", branchId] });
      qc.invalidateQueries({ queryKey: ["branch", branchId] });
      toast.success(t("branches.holidayRemoved"));
    },
  });
}
