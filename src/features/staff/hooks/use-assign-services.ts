"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { BulkAssignServicesResult } from "@/features/staff/types";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

export function useAssignServices(staffId: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (serviceIds: string[]) => {
      const res = await apiClient.post<ApiResponse<BulkAssignServicesResult>>(
        `/staff/${staffId}/services`,
        { serviceIds }
      );
      return res.data;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["staff", staffId] });
      qc.invalidateQueries({ queryKey: ["staff", staffId, "services"] });
      toast.success(
        t("staff.servicesAssigned", {
          assigned: result.assigned,
          skipped: result.skipped,
        })
      );
    },
  });
}
