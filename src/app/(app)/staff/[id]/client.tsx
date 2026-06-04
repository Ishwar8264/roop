"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Star,
  Clock,
  MapPin,
  Phone,
  Pencil,
  Briefcase,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useStaff } from "@/features/staff/hooks/use-staff";
import { StaffAvailabilityBadge } from "@/features/staff/components/staff-availability-badge";
import { StaffFormDialog } from "@/features/staff/components/staff-form-dialog";
import { LeaveManager } from "@/features/staff/components/leave-manager";
import { ServiceList } from "@/features/staff/components/service-list";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import type { StaffResponse } from "@/features/staff/types";

export function StaffDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const id = params.id as string;

  const { data: staff, isLoading } = useStaff(id);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">{t("staff.noStaff")}</p>
      </div>
    );
  }

  const displayName = staff.userName || "Staff";
  const branchName =
    locale === "hi" ? staff.branch.nameHi : staff.branch.nameEn;
  const displayBio = locale === "hi" ? staff.bioHi : staff.bioEn;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const workDayLabels: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/staff")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {displayName}
          </h2>
        </div>
        <StaffAvailabilityBadge isAvailable={staff.isAvailable} />
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

      {/* Profile Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage
                src={staff.userAvatarUrl || staff.photoUrl || ""}
                alt={displayName}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg">{displayName}</h3>
              {displayBio && (
                <p className="text-sm text-muted-foreground mt-1">
                  {displayBio}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {staff.specialization.map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Rating */}
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">{t("staff.rating")}</p>
                <p className="font-semibold">{staff.rating.toFixed(1)}</p>
              </div>
            </div>

            {/* Experience */}
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">
                  {t("staff.experience")}
                </p>
                <p className="font-semibold">
                  {staff.experienceYears ?? 0} {t("staff.years")}
                </p>
              </div>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">{t("staff.timing")}</p>
                <p className="font-semibold">
                  {staff.workStart}–{staff.workEnd}
                </p>
              </div>
            </div>

            {/* Commission */}
            {staff.commissionRate !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Percent className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t("staff.commissionRate")}
                  </p>
                  <p className="font-semibold">{staff.commissionRate}%</p>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Branch */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">
                  {t("staff.branch")}
                </p>
                <p>
                  {branchName} — {staff.branch.city}
                </p>
              </div>
            </div>

            {/* Phone */}
            {staff.userPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t("branches.contact")}
                  </p>
                  <p>{staff.userPhone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Work Days */}
          <div className="mt-4">
            <p className="text-muted-foreground text-xs mb-1.5">
              {t("staff.workDays")}
            </p>
            <div className="flex gap-1.5">
              {Object.entries(staff.workDays).map(([day, active]) => (
                <Badge
                  key={day}
                  variant={active ? "default" : "outline"}
                  className={
                    active
                      ? "bg-primary text-primary-foreground text-xs"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {workDayLabels[day] || day}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <ServiceList staffId={staff.id} />

      {/* Leaves */}
      <LeaveManager staffId={staff.id} />

      {/* Edit Dialog */}
      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={staff as unknown as StaffResponse}
      />
    </div>
  );
}
