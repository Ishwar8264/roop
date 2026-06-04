"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BranchHolidayResponse } from "@/features/branch/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useAddHoliday(branchId: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: {
      date: string;
      reasonHi: string;
      reasonEn?: string;
    }) => {
      const res = await apiClient.post<ApiResponse<BranchHolidayResponse>>(
        `/branches/${branchId}/holidays`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays", branchId] });
      qc.invalidateQueries({ queryKey: ["branch", branchId] });
      toast.success(t("branches.holidayAdded"));
    },
  });
}
