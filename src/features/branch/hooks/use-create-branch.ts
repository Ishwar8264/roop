"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BranchResponse } from "@/features/branch/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useCreateBranch() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.post<ApiResponse<BranchResponse>>(
        "/branches",
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success(t("branches.created"));
    },
  });
}
