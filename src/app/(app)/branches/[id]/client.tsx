"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/features/branch/hooks/use-branch";
import { BranchStatusBadge } from "@/features/branch/components/branch-status-badge";
import { HolidayManager } from "@/features/branch/components/holiday-manager";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";

export function BranchDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const id = params.id as string;

  const { data: branch, isLoading } = useBranch(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">{t("branches.noBranches")}</p>
      </div>
    );
  }

  const displayName = locale === "hi" ? branch.nameHi : branch.nameEn;
  const displayAddress = branch.address;

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
            onClick={() => router.push(`/branches/${id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            {t("common.edit")}
          </Button>
        )}
      </div>

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
                    {branch.city} — {displayAddress}
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
                  <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={branch.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holiday Manager */}
      <HolidayManager branchId={branch.id} />
    </div>
  );
}
