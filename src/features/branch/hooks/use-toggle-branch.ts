"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BranchResponse } from "@/features/branch/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useToggleBranch() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<ApiResponse<BranchResponse>>(
        `/branches/${id}/toggle-active`
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["branch", data.id] });
      toast.success(
        data.isActive ? t("branches.activated") : t("branches.deactivated")
      );
    },
  });
}
