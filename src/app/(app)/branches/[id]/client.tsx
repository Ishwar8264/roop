"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Pencil,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchMap } from "@/features/branch/components/branch-map";
import { BranchStatusBadge } from "@/features/branch/components/branch-status-badge";
import { BranchFormDialog } from "@/features/branch/components/branch-form-dialog";
import { HolidayManager } from "@/features/branch/components/holiday-manager";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import type { BranchDetailResponse, BranchResponse } from "@/features/branch/types";

interface BranchDetailClientProps {
  initialBranch: BranchDetailResponse;
}

export function BranchDetailClient({ initialBranch }: BranchDetailClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [branch, setBranch] = useState<BranchDetailResponse>(initialBranch);

  const displayName = locale === "hi" ? branch.nameHi : branch.nameEn;

  const handleMutated = useCallback(async () => {
    // Refetch branch data after mutations
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBranch(json.data);
      }
    } catch {
      // Keep existing data on error
    }
  }, [branch.id]);

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/branches")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            {displayName}
          </h2>
        </div>
        <BranchStatusBadge isActive={branch.isActive} />
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            {t("common.edit")}
          </Button>
        )}
      </div>

      {/* Map Section */}
      <BranchMap
        latitude={branch.latitude}
        longitude={branch.longitude}
        address={branch.address}
        className="h-40 w-full rounded-lg"
      />

      {/* Branch Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t("branches.branchDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t("branches.location")}
                  </p>
                  <p>
                    {branch.city}{"\u2014"}{branch.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t("branches.contact")}
                  </p>
                  <p>{branch.phone}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t("branches.timing")}
                  </p>
                  <p>
                    {branch.openTime} – {branch.closeTime}
                  </p>
                </div>
              </div>
              {branch.googleMapsUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={branch.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t("branches.getDirections") ?? "Get Directions"}
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holiday Manager */}
      <HolidayManager
        branchId={branch.id}
        initialHolidays={branch.holidays}
        onMutated={handleMutated}
      />

      {/* Edit Dialog */}
      <BranchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={branch as unknown as BranchResponse}
        onMutated={handleMutated}
      />
    </div>
  );
}
