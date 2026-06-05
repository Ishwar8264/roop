/**
 * Purpose: Branch summary card
 * Responsibility: Render branch details and admin branch actions
 * Important Notes:
 *   - Client component for admin action state
 *   - Auth is sent through HttpOnly same-origin cookies
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Phone, MoreVertical, Navigation } from "lucide-react";
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
import { BranchMap } from "./branch-map";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import { toast } from "sonner";
import type { BranchResponse } from "@/features/branch/types";

interface BranchCardProps {
  branch: BranchResponse;
  onEdit?: (branch: BranchResponse) => void;
  /** "admin" = full controls (toggle, deactivate). "app" = read-only card for users */
  variant?: "admin" | "app";
  /** Called after any mutation to refresh the branch list */
  onMutated?: () => void;
}

export function BranchCard({ branch, onEdit, variant = "app", onMutated }: BranchCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const isAdmin = variant === "admin" && user?.role === "ADMIN";
  const displayName = locale === "hi" ? branch.nameHi : branch.nameEn;
  const isLoading = isToggling || isDeactivating;

  // ---- Plain fetch mutations ----

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    try {
      const res = await fetch(`/api/branches/${branch.id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      toast.success(data.data?.isActive ? t("branches.activated") : t("branches.deactivated"));
      onMutated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeactivate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeactivating) return;
    if (!confirm(t("branches.deactivateConfirm"))) return;
    setIsDeactivating(true);
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      toast.success(t("branches.deactivated"));
      onMutated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Card
      className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group overflow-hidden"
      onClick={() => router.push(`/branches/${branch.id}`)}
    >
      {/* Map Section */}
      <BranchMap
        latitude={branch.latitude}
        longitude={branch.longitude}
        address={branch.address}
        className="h-28 w-full"
      />

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Name + Status */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{displayName}</h3>
              <BranchStatusBadge isActive={branch.isActive} />
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{branch.city} — {branch.address}</span>
            </div>

            {/* Timing + Phone */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {branch.openTime}–{branch.closeTime}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {branch.phone}
              </span>
            </div>

            {/* Google Maps Link */}
            {branch.googleMapsUrl && (
              <a
                href={branch.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Navigation className="h-3 w-3" />
                {t("branches.getDirections") ?? "Get Directions"}
              </a>
            )}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(branch);
                  }}
                >
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isToggling}
                  onClick={handleToggle}
                >
                  {t("branches.toggleActive")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  disabled={isDeactivating}
                  onClick={handleDeactivate}
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
