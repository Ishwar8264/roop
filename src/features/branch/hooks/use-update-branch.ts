"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BranchResponse } from "@/features/branch/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useUpdateBranch() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) => {
      const res = await apiClient.patch<ApiResponse<BranchResponse>>(
        `/branches/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["branch", variables.id] });
      toast.success(t("branches.updated"));
    },
  });
}
