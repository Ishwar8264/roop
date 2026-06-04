"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { StaffResponse } from "@/features/staff/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useUpdateStaff() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) => {
      const res = await apiClient.patch<ApiResponse<StaffResponse>>(
        `/staff/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["staff", variables.id] });
      toast.success(t("staff.updated"));
    },
  });
}
