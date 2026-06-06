/**
 * Purpose: Settings page client component
 * Responsibility: Tab-based settings layout with personal info, security, danger zone
 * Important Notes:
 *   - "use client" component
 *   - Tabs: Personal Info | Security | Danger Zone
 *   - Tab 1: Name, email, phone edit form
 *   - Tab 2: Change password, verify email, login devices
 *   - Tab 3: Deactivate account
 *   - Back button linking to /profile
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, User, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Separator } from "@/components/ui/separator";
import { SecurityCard } from "@/features/user/components/security-card";
import { DangerZoneCard } from "@/features/user/components/danger-zone-card";
import { ProfileSkeleton } from "@/features/user/components/profile-skeleton";
import { useProfile } from "@/features/user/hooks/use-profile";
import { useUpdateProfile } from "@/features/user/hooks/use-update-profile";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";

type SettingsDraft = {
  name: string;
  email: string;
  phone: string;
};

export function SettingsClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: profileData, isLoading, refetch: refetchProfile } = useProfile();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const displayUser = profileData?.user || user;

  const [draft, setDraft] = useState<SettingsDraft | null>(null);

  const startEditing = useCallback(() => {
    setDraft({
      name: displayUser?.name || "",
      email: displayUser?.email || "",
      phone: displayUser?.mobile || "",
    });
  }, [displayUser]);

  const handleSave = useCallback(() => {
    if (!draft) return;

    const payload: Record<string, string> = {};
    if (draft.name !== (displayUser?.name || "")) payload.name = draft.name;
    if (draft.email !== (displayUser?.email || "")) payload.email = draft.email;
    if (draft.phone !== (displayUser?.mobile || "")) payload.phone = draft.phone;

    if (Object.keys(payload).length === 0) {
      setDraft(null);
      return;
    }

    updateProfile.mutate(payload, () => {
      setDraft(null);
      void refetchProfile();
    });
  }, [draft, displayUser, updateProfile, refetchProfile]);

  const handleCancel = useCallback(() => {
    setDraft(null);
  }, []);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Back Button + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => router.push("/profile")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{t("profile.settings")}</h1>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="personal" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("profile.personalInfo")}</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("profile.security")}</span>
            <span className="sm:hidden">Security</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1.5 text-xs sm:text-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("profile.dangerZone")}</span>
            <span className="sm:hidden">Danger</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal Info */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-rose-500" />
                  {t("profile.personalInfo")}
                </CardTitle>
                {!draft ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={startEditing}
                  >
                    {t("common.edit")}
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft ? (
                <div className="space-y-4">
                  <FloatingLabelInput
                    label={t("profile.fullName")}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev
                      )
                    }
                    icon={<User className="h-4 w-4" />}
                  />
                  <FloatingLabelInput
                    label={t("profile.emailAddress")}
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, email: e.target.value } : prev
                      )
                    }
                    icon={<Shield className="h-4 w-4" />}
                  />
                  <FloatingLabelInput
                    label={t("profile.phone")}
                    type="tel"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev
                      )
                    }
                    icon={<AlertTriangle className="h-4 w-4" />}
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={updateProfile.isPending}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-rose-500 hover:bg-rose-600 text-white"
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? t("profile.saving") : t("profile.saveChanges")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
                      <User className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("profile.fullName")}</p>
                      <p className="text-sm font-medium">{displayUser?.name || "—"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
                      <Shield className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("profile.emailAddress")}</p>
                      <p className="text-sm font-medium">{displayUser?.email || "—"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("profile.phone")}</p>
                      <p className="text-sm font-medium">{displayUser?.mobile || "—"}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security */}
        <TabsContent value="security">
          <SecurityCard profile={profileData?.user} onProfileChange={refetchProfile} />
        </TabsContent>

        {/* Tab 3: Danger Zone */}
        <TabsContent value="danger">
          <DangerZoneCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
