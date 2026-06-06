/**
 * Purpose: Dialog for verifying email via OTP
 * Responsibility: Send verification OTP to email, then verify with OtpInput
 * Important Notes:
 *   - Click "Send OTP" → sends verification email
 *   - Enter OTP (OtpInput) → confirms verification
 *   - Uses apiClient directly for both steps
 *   - Success: closes dialog + toast
 */

"use client";

import { useState, useCallback } from "react";
import { Mail, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse } from "@/types";

interface VerifyEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

export function VerifyEmailDialog({ open, onOpenChange, onVerified }: VerifyEmailDialogProps) {
  const { t } = useTranslation();

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const resetForm = useCallback(() => {
    setOtpSent(false);
    setOtp("");
    setIsSendingOtp(false);
    setIsVerifying(false);
  }, []);

  const handleSendOtp = useCallback(async () => {
    setIsSendingOtp(true);
    try {
      await apiClient.post<ApiResponse<{ message: string }>>("/user/verify-email", {});
      setOtpSent(true);
      toast.success(t("profile.verificationSent"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.somethingWrong");
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  }, [t]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) return;

    setIsVerifying(true);
    try {
      await apiClient.post<ApiResponse<{ message: string }>>(
        "/user/verify-email/confirm",
        { otp }
      );
      // Update store so emailVerified reflects immediately
      const { setUser } = useAuthStore.getState();
      setUser({ emailVerified: true } as Partial<import("@/types").UserProfile>);
      toast.success(t("profile.emailVerifiedSuccess"));
      resetForm();
      onVerified?.();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.somethingWrong");
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  }, [otp, t, resetForm, onOpenChange, onVerified]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange(newOpen);
    },
    [resetForm, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-rose-500" />
            {t("profile.verifyEmail")}
          </DialogTitle>
          <DialogDescription>
            {otpSent
              ? t("profile.verificationSent")
              : t("profile.emailNotVerified")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!otpSent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-rose-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("profile.emailNotVerified")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                {t("profile.verificationSent")}
              </p>
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={isVerifying}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!otpSent ? (
            <>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSendingOtp}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {t("auth.sendOtp")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                disabled={isVerifying}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {t("auth.verifyOtp")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
