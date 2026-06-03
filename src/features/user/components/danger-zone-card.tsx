/**
 * Purpose: Red-bordered danger zone card for account deactivation
 * Responsibility: Show warning, collect confirmation text, and deactivate account
 * Important Notes:
 *   - Red-bordered card with warning text
 *   - Text input for "DELETE_MY_ACCOUNT" confirmation
 *   - Optional reason textarea
 *   - Deactivate button (disabled until confirmation typed correctly)
 *   - Uses useDeactivate hook
 *   - AlertDialog confirmation before deactivating
 */

"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useDeactivate } from "@/features/user/hooks/use-deactivate";
import { useTranslation } from "@/i18n/use-translation";

export function DangerZoneCard() {
  const { t } = useTranslation();
  const deactivate = useDeactivate();

  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  const isConfirmationValid = confirmation === "DELETE_MY_ACCOUNT";

  const handleDeactivate = useCallback(() => {
    if (!isConfirmationValid) return;

    deactivate.mutate({
      confirmation: "DELETE_MY_ACCOUNT",
      reason: reason.trim() || undefined,
    }, {
      onSuccess: () => {
        setAlertOpen(false);
      },
    });
  }, [isConfirmationValid, reason, deactivate]);

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {t("profile.dangerZone")}
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {t("profile.deactivateWarning")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-destructive">
              {t("profile.deactivateConfirm")}
            </label>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE_MY_ACCOUNT"
              className="border-destructive/30 focus-visible:ring-destructive/20"
            />
          </div>

          {/* Reason Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("profile.deactivateReason")}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("profile.deactivateReasonPlaceholder")}
              maxLength={500}
              rows={3}
              className="resize-none border-destructive/20 focus-visible:ring-destructive/20"
            />
          </div>

          {/* Deactivate Button */}
          <Button
            variant="destructive"
            className="w-full gap-2"
            disabled={!isConfirmationValid || deactivate.isPending}
            onClick={() => setAlertOpen(true)}
          >
            {deactivate.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("profile.deactivateBtn")}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("profile.deactivateAccount")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.deactivateWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivate.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivate.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deactivate.isPending ? t("common.loading") : t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
