/**
 * Purpose: Top section of profile page
 * Responsibility: Show avatar, name, email, phone with verified badge, loyalty points, quick actions
 * Important Notes:
 *   - Uses GlassmorphismCard for premium look with subtle gradient background
 *   - Shows verification badges for email and phone (checks actual emailVerified)
 *   - Quick action buttons: My Bookings, View Offers, Settings
 *   - Verified badge styling is smaller and more subtle
 */

"use client";

import { useRouter } from "next/navigation";
import { Calendar, Gift, Settings, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <GlassmorphismCard className="relative overflow-hidden">
      {/* Subtle gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-pink-50/40 to-transparent dark:from-rose-950/20 dark:via-pink-950/10 dark:to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center text-center gap-4">
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
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm text-muted-foreground truncate">
                {displayUser.email}
              </span>
              {displayUser.emailVerified ? (
                <Badge
                  variant="outline"
                  className="text-[9px] gap-0.5 px-1 py-px border-green-200 text-green-600 dark:border-green-800 dark:text-green-400"
                >
                  <CheckCircle2 className="h-2 w-2" />
                  {t("profile.verified")}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[9px] gap-0.5 px-1 py-px border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                >
                  <AlertCircle className="h-2 w-2" />
                  {t("profile.notVerified")}
                </Badge>
              )}
            </div>
          )}

          {displayUser?.mobile && (
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm text-muted-foreground">
                {displayUser.mobile}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] gap-0.5 px-1 py-px border-green-200 text-green-600 dark:border-green-800 dark:text-green-400"
              >
                <CheckCircle2 className="h-2 w-2" />
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

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 w-full pt-2">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-2 h-auto py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all duration-200"
            onClick={() => router.push("/bookings")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Calendar className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium leading-none">{t("profile.myBookings")}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-2 h-auto py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all duration-200"
            onClick={() => router.push("/offers")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Gift className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium leading-none">{t("profile.viewOffers")}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-2 h-auto py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all duration-200"
            onClick={() => router.push("/profile/settings")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Settings className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium leading-none">{t("profile.settings")}</span>
          </Button>
        </div>
      </div>
    </GlassmorphismCard>
  );
}
