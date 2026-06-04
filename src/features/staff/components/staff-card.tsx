"use client";

import { useRouter } from "next/navigation";
import { Star, Clock, MapPin, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StaffAvailabilityBadge } from "./staff-availability-badge";
import { useDeactivateStaff } from "@/features/staff/hooks/use-deactivate-staff";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import type { StaffResponse } from "@/features/staff/types";

interface StaffCardProps {
  staff: StaffResponse;
  onEdit: (staff: StaffResponse) => void;
}

export function StaffCard({ staff, onEdit }: StaffCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const deactivateStaff = useDeactivateStaff();
  const isAdmin = user?.role === "ADMIN";

  const displayName = staff.userName || "Staff";
  const branchName =
    locale === "hi" ? staff.branchNameHi : staff.branchNameEn;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
      onClick={() => router.push(`/staff/${staff.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/20">
            <AvatarImage
              src={staff.userAvatarUrl || staff.photoUrl || ""}
              alt={displayName}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{displayName}</h3>
              <StaffAvailabilityBadge isAvailable={staff.isAvailable} />
            </div>

            {/* Specializations */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              {staff.specialization.slice(0, 3).map((spec) => (
                <Badge
                  key={spec}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {spec}
                </Badge>
              ))}
              {staff.specialization.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  +{staff.specialization.length - 3}
                </Badge>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {staff.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {staff.workStart}–{staff.workEnd}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{branchName}</span>
              </span>
            </div>
          </div>

          {/* Admin Actions */}
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
                    onEdit(staff);
                  }}
                >
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("staff.deactivateConfirm"))) {
                      deactivateStaff.mutate(staff.id);
                    }
                  }}
                >
                  {t("staff.deactivate")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
