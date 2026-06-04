/**
 * Purpose: Profile page client component
 * Responsibility: Fetch user profile data, render profile sections, handle logout
 * Important Notes:
 *   - "use client" component
 *   - Uses useProfile hook to fetch user data
 *   - Renders: Page header with back button, ProfileHeader, PersonalInfoCard, SecurityCard
 *   - Logout button at bottom (with confirmation AlertDialog)
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, ChevronLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProfileHeader } from "@/features/user/components/profile-header";
import { PersonalInfoCard } from "@/features/user/components/personal-info-card";
import { SecurityCard } from "@/features/user/components/security-card";
import { ChangePhoneDialog } from "@/features/user/components/change-phone-dialog";
import { ProfileSkeleton } from "@/features/user/components/profile-skeleton";
import { useProfile } from "@/features/user/hooks/use-profile";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/services/api-client";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse } from "@/types";

export function ProfileClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: profileData, isLoading } = useProfile();
  const { logout } = useAuthStore();

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post<ApiResponse<unknown>>("/auth/logout");
    } catch {
      // Ignore logout API errors — proceed with local logout
    }
    logout();
    toast.success(t("profile.logout"));
    router.push("/login");
  }, [logout, router, t]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => router.push("/dashboard")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-rose-500" />
          <h1 className="text-xl font-bold">{t("profile.title")}</h1>
        </div>
      </div>

      {/* Profile Header */}
      <ProfileHeader profile={profileData?.user} />

      {/* Personal Info Card */}
      <PersonalInfoCard
        profile={profileData?.user}
        onVerifyEmail={() => {
          // Open verify email dialog via SecurityCard
        }}
        onChangePhone={() => setPhoneDialogOpen(true)}
      />

      {/* Security Card */}
      <SecurityCard profile={profileData?.user} />

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/20"
        onClick={() => setLogoutDialogOpen(true)}
      >
        <LogOut className="h-4 w-4" />
        {t("profile.logout")}
      </Button>

      {/* Change Phone Dialog */}
      <ChangePhoneDialog
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.logout")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.logoutConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <LogOut className="h-4 w-4 mr-1" />
              )}
              {t("profile.logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
