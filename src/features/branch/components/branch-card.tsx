"use client";

import { useRouter } from "next/navigation";
import { MapPin, Clock, Phone, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BranchStatusBadge } from "./branch-status-badge";
import { useToggleBranch } from "@/features/branch/hooks/use-toggle-branch";
import { useDeactivateBranch } from "@/features/branch/hooks/use-deactivate-branch";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import type { BranchResponse } from "@/features/branch/types";

interface BranchCardProps {
  branch: BranchResponse;
  onEdit: (branch: BranchResponse) => void;
}

export function BranchCard({ branch, onEdit }: BranchCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const toggleBranch = useToggleBranch();
  const deactivateBranch = useDeactivateBranch();
  const isAdmin = user?.role === "ADMIN";
  const displayName = locale === "hi" ? branch.nameHi : branch.nameEn;

  return (
    <Card
      className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
      onClick={() => router.push(`/branches/${branch.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{displayName}</h3>
              <BranchStatusBadge isActive={branch.isActive} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {branch.city} — {branch.address}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {branch.openTime}–{branch.closeTime}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {branch.phone}
              </span>
            </div>
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(branch);
                  }}
                >
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBranch.mutate(branch.id);
                  }}
                >
                  {t("branches.toggleActive")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("branches.deactivateConfirm"))) {
                      deactivateBranch.mutate(branch.id);
                    }
                  }}
                >
                  {t("branches.deactivate")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
