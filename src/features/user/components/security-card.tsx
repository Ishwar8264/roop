/**
 * Purpose: Card with security options
 * Responsibility: Show change password, verify email, and login devices options
 * Important Notes:
 *   - "Change Password" → opens ChangePasswordDialog
 *   - "Verify Email" → opens VerifyEmailDialog
 *   - "Login Devices" → placeholder (shows "Coming Soon")
 */

"use client";

import { useState } from "react";
import { Lock, Mail, Shield, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "./change-password-dialog";
import { VerifyEmailDialog } from "./verify-email-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import type { UserProfile } from "@/types";

interface SecurityCardProps {
  profile?: UserProfile | null;
  onProfileChange?: () => void;
}

export function SecurityCard({ profile, onProfileChange }: SecurityCardProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const displayUser = profile || user;

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-rose-500" />
            {t("profile.security")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Change Password */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto p-3 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={() => setPasswordDialogOpen(true)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
              <Lock className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{t("profile.changePassword")}</p>
              <p className="text-xs text-muted-foreground">
                {t("profile.passwordMinReq")}
              </p>
            </div>
          </Button>

          <Separator />

          {/* Verify Email */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto p-3 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={() => setEmailDialogOpen(true)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
              <Mail className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium">{t("profile.verifyEmail")}</p>
              <p className="text-xs text-muted-foreground">
                {displayUser?.emailVerified
                  ? t("profile.emailVerified")
                  : displayUser?.email
                    ? t("profile.emailNotVerified")
                    : t("profile.emailAddress")}
              </p>
            </div>
            {displayUser?.email && !displayUser.emailVerified && (
              <Badge
                variant="outline"
                className="text-[9px] gap-0.5 px-1.5 py-0 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400"
              >
                {t("profile.notVerified")}
              </Badge>
            )}
            {displayUser?.email && displayUser.emailVerified && (
              <Badge
                variant="outline"
                className="text-[9px] gap-0.5 px-1.5 py-0 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
              >
                {t("profile.verified")}
              </Badge>
            )}
          </Button>

          <Separator />

          {/* Login Devices — Coming Soon */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto p-3 opacity-60 cursor-not-allowed"
            disabled
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium">{t("profile.loginDevices")}</p>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </div>
            <Badge variant="secondary" className="text-[9px]">
              Soon
            </Badge>
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      <VerifyEmailDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} onVerified={onProfileChange} />
    </>
  );
}
