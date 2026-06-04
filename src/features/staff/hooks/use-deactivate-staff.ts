"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffResponse } from "@/features/staff/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useDeactivateStaff() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<ApiResponse<StaffResponse>>(
        `/staff/${id}`
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success(t("staff.deactivated"));
    },
  });
}
