/**
 * Purpose: Card with name, email, phone fields with inline edit
 * Responsibility: Display and edit personal information
 * Important Notes:
 *   - Each field has edit icon that opens inline edit mode
 *   - Name: simple text input (FloatingLabelInput)
 *   - Email: text input with "Not Verified" badge → triggers verify email dialog
 *   - Phone: click triggers change-phone dialog (needs OTP)
 *   - Save/Cancel buttons in edit mode
 *   - Uses useUpdateProfile hook
 */

"use client";

import { useState, useCallback } from "react";
import { Edit2, Mail, Phone, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateProfile } from "@/features/user/hooks/use-update-profile";
import { useTranslation } from "@/i18n/use-translation";
import type { UserProfile } from "@/types";

interface PersonalInfoCardProps {
  profile?: UserProfile | null;
  onVerifyEmail?: () => void;
  onChangePhone?: () => void;
}

type EditingField = "name" | "email" | "phone" | null;

export function PersonalInfoCard({ profile, onVerifyEmail, onChangePhone }: PersonalInfoCardProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const displayUser = profile || user;

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState("");

  const startEditing = useCallback(
    (field: EditingField) => {
      if (field === "phone") {
        onChangePhone?.();
        return;
      }
      setEditingField(field);
      if (field === "name") setEditValue(displayUser?.name || "");
      if (field === "email") setEditValue(displayUser?.email || "");
    },
    [displayUser, onChangePhone]
  );

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveField = useCallback(() => {
    if (!editingField || !editValue.trim()) return;

    const payload: Record<string, string> = {};
    if (editingField === "name") payload.name = editValue.trim();
    if (editingField === "email") payload.email = editValue.trim();

    updateProfile.mutate(payload, {
      onSuccess: () => {
        setEditingField(null);
        setEditValue("");
      },
    });
  }, [editingField, editValue, updateProfile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") saveField();
      if (e.key === "Escape") cancelEditing();
    },
    [saveField, cancelEditing]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-rose-500" />
          {t("profile.personalInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name Field */}
        <div>
          {editingField === "name" ? (
            <div className="space-y-3">
              <FloatingLabelInput
                label={t("profile.fullName")}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                icon={<User className="h-4 w-4" />}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={updateProfile.isPending}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={saveField}
                  disabled={updateProfile.isPending || !editValue.trim()}
                >
                  {updateProfile.isPending ? t("profile.saving") : t("common.save")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
                  <User className="h-4 w-4 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("profile.fullName")}</p>
                  <p className="text-sm font-medium truncate">
                    {displayUser?.name || "—"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                onClick={() => startEditing("name")}
                aria-label={t("common.edit")}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Email Field */}
        <div>
          {editingField === "email" ? (
            <div className="space-y-3">
              <FloatingLabelInput
                label={t("profile.emailAddress")}
                type="email"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                icon={<Mail className="h-4 w-4" />}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={updateProfile.isPending}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={saveField}
                  disabled={updateProfile.isPending || !editValue.trim()}
                >
                  {updateProfile.isPending ? t("profile.saving") : t("common.save")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                onClick={() => {
                  if (!displayUser?.email) {
                    startEditing("email");
                  } else {
                    onVerifyEmail?.();
                  }
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
                  <Mail className="h-4 w-4 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{t("profile.emailAddress")}</p>
                    {displayUser?.email ? (
                      <Badge
                        variant="outline"
                        className="text-[9px] gap-0.5 px-1 py-0 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                      >
                        <AlertCircle className="h-2.5 w-2.5" />
                        {t("profile.notVerified")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium truncate">
                    {displayUser?.email || "—"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                onClick={() => startEditing("email")}
                aria-label={t("common.edit")}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Phone Field */}
        <div className="flex items-center justify-between group">
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
            onClick={() => startEditing("phone")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
              <Phone className="h-4 w-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{t("profile.phone")}</p>
                {displayUser?.mobile && (
                  <Badge
                    variant="outline"
                    className="text-[9px] gap-0.5 px-1 py-0 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {t("profile.verified")}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium truncate">
                {displayUser?.mobile || "—"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
            onClick={() => startEditing("phone")}
            aria-label={t("common.edit")}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
