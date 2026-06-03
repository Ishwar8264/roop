/**
 * Purpose: Top section of profile page
 * Responsibility: Show avatar, name, email, phone with verified badge, loyalty points, quick actions
 * Important Notes:
 *   - Uses GlassmorphismCard for premium look
 *   - Shows verification badges for email and phone
 *   - Quick action buttons: My Bookings, View Offers, Settings
 */

"use client";

import { useRouter } from "next/navigation";
import { Calendar, Gift, Settings, Star, CheckCircle2 } from "lucide-react";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "./avatar-upload";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import type { UserProfile } from "@/types";

interface ProfileHeaderProps {
  profile?: UserProfile | null;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const displayUser = profile || user;

  return (
    <GlassmorphismCard>
      <div className="flex flex-col items-center text-center gap-4">
        {/* Avatar */}
        <AvatarUpload />

        {/* Name */}
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {displayUser?.name || t("userMenu.user")}
          </h2>
        </div>

        {/* Contact info with verification badges */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {displayUser?.email && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground truncate">
                {displayUser.email}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] gap-0.5 px-1.5 py-0 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                {t("profile.verified")}
              </Badge>
            </div>
          )}

          {(displayUser?.phone || displayUser?.mobile) && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                {displayUser?.phone || displayUser?.mobile}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] gap-0.5 px-1.5 py-0 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                {t("profile.verified")}
              </Badge>
            </div>
          )}
        </div>

        {/* Loyalty Points Badge */}
        {(displayUser?.loyaltyPoints ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {displayUser?.loyaltyPoints} {t("profile.loyaltyPoints")}
            </span>
          </div>
        )}

        <Separator className="bg-border/50" />

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1.5 h-auto py-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600"
            onClick={() => router.push("/bookings")}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t("profile.myBookings")}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1.5 h-auto py-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600"
            onClick={() => router.push("/offers")}
          >
            <Gift className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t("profile.viewOffers")}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1.5 h-auto py-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600"
            onClick={() => router.push("/profile/settings")}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t("profile.settings")}</span>
          </Button>
        </div>
      </div>
    </GlassmorphismCard>
  );
}
