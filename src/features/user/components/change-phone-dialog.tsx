/**
 * Purpose: 2-step dialog for changing phone number
 * Responsibility: Enter new phone → send OTP → enter OTP → verify
 * Important Notes:
 *   - Step 1: Enter new phone number → sends OTP
 *   - Step 2: Enter OTP (OtpInput) → verifies
 *   - Uses useChangePhone hook
 *   - Success: closes dialog + updates store + toast
 */

"use client";

import { useState, useCallback } from "react";
import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { OtpInput } from "@/components/ui/otp-input";
import { useChangePhone } from "@/features/user/hooks/use-change-phone";
import { useTranslation } from "@/i18n/use-translation";

interface ChangePhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePhoneDialog({ open, onOpenChange }: ChangePhoneDialogProps) {
  const { t } = useTranslation();
  const { sendOtp, verifyOtp, step, setStep, isSending, isVerifying } = useChangePhone();

  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const resetForm = useCallback(() => {
    setNewPhone("");
    setOtp("");
    setPhoneError("");
    setStep(1);
  }, [setStep]);

  const handleSendOtp = useCallback(() => {
    if (!newPhone.trim()) {
      setPhoneError(t("common.pleaseEnter"));
      return;
    }

    // Basic Indian phone validation
    if (!/^[6-9]\d{9}$/.test(newPhone.replace(/\D/g, ""))) {
      setPhoneError(t("auth.enterMobile"));
      return;
    }

    setPhoneError("");
    sendOtp(newPhone.replace(/\D/g, ""));
  }, [newPhone, sendOtp, t]);

  const handleVerifyOtp = useCallback(() => {
    if (otp.length !== 6) return;

    verifyOtp(
      { newPhone: newPhone.replace(/\D/g, ""), otp },
      () => {
        resetForm();
        onOpenChange(false);
      }
    );
  }, [otp, newPhone, verifyOtp, resetForm, onOpenChange]);

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
            <Phone className="h-5 w-5 text-rose-500" />
            {t("profile.changePhone")}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? t("profile.enterNewPhone")
              : t("auth.enterOtp")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 ? (
            <div className="space-y-4">
              <FloatingLabelInput
                label={t("profile.newPhone")}
                type="tel"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
                icon={<Phone className="h-4 w-4" />}
                error={phoneError}
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                {t("auth.otpSentTo").replace("{mobile}", newPhone)}
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
          {step === 1 ? (
            <>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleSendOtp}
                disabled={isSending || !newPhone.trim()}
              >
                {isSending ? t("common.loading") : t("auth.sendOtp")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isVerifying}
              >
                {t("auth.changeNumber")}
              </Button>
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? t("common.loading") : t("auth.verifyOtp")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
