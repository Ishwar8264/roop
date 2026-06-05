/**
 * Purpose: Dialog for changing password
 * Responsibility: 3-field form with Zod validation, submit via useChangePassword hook
 * Important Notes:
 *   - Fields: current password, new password, confirm new password
 *   - Uses PasswordInput component for all fields
 *   - Zod validation: min 8, uppercase, lowercase, digit, special
 *   - Success: closes dialog + toast
 */

"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useChangePassword } from "@/features/user/hooks/use-change-password";
import { useTranslation } from "@/i18n/use-translation";

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a digit")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({});
  }, []);

  const handleSubmit = useCallback(() => {
    // Validate with Zod
    const result = changePasswordFormSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString();
        if (field) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    changePassword.mutate(
      {
        currentPassword,
        newPassword,
      },
      () => {
        resetForm();
        onOpenChange(false);
      }
    );
  }, [currentPassword, newPassword, confirmNewPassword, changePassword, resetForm, onOpenChange]);

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
            <Lock className="h-5 w-5 text-rose-500" />
            {t("profile.changePassword")}
          </DialogTitle>
          <DialogDescription>
            {t("profile.passwordMinReq")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <PasswordInput
            label={t("profile.currentPassword")}
            registerProps={{
              value: currentPassword,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setCurrentPassword(e.target.value);
                if (errors.currentPassword) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.currentPassword;
                    return next;
                  });
                }
              },
            }}
            error={errors.currentPassword}
          />

          <PasswordInput
            label={t("profile.newPassword")}
            registerProps={{
              value: newPassword,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.newPassword;
                    return next;
                  });
                }
              },
            }}
            error={errors.newPassword}
          />

          <PasswordInput
            label={t("profile.confirmNewPassword")}
            registerProps={{
              value: confirmNewPassword,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setConfirmNewPassword(e.target.value);
                if (errors.confirmNewPassword) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.confirmNewPassword;
                    return next;
                  });
                }
              },
            }}
            error={errors.confirmNewPassword}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={changePassword.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            className="bg-rose-500 hover:bg-rose-600 text-white"
            onClick={handleSubmit}
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? t("common.loading") : t("profile.changePassword")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
