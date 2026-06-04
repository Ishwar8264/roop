"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/use-translation";

export function BranchStatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation();

  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={
        isActive
          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
          : "bg-gray-400 hover:bg-gray-500 text-white"
      }
    >
      {isActive ? t("branches.active") : t("branches.inactive")}
    </Badge>
  );
}
