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

import { useState, useCallback, useEffect } from "react";
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

export function SettingsClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: profileData, isLoading, refetch: refetchProfile } = useProfile();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const displayUser = profileData?.user || user;

  const [name, setName] = useState(displayUser?.name || "");
  const [email, setEmail] = useState(displayUser?.email || "");
  const [phone, setPhone] = useState(displayUser?.mobile || "");
  const [isEditing, setIsEditing] = useState(false);

  // Sync form state when profile data loads or changes
  useEffect(() => {
    if (!isEditing) {
      setName(displayUser?.name || "");
      setEmail(displayUser?.email || "");
      setPhone(displayUser?.mobile || "");
    }
  }, [displayUser, isEditing]);

  const handleSave = useCallback(() => {
    const payload: Record<string, string> = {};
    if (name !== (displayUser?.name || "")) payload.name = name;
    if (email !== (displayUser?.email || "")) payload.email = email;
    if (phone !== (displayUser?.mobile || "")) payload.phone = phone;

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    updateProfile.mutate(payload, () => {
      setIsEditing(false);
      void refetchProfile();
    });
  }, [name, email, phone, displayUser, updateProfile, refetchProfile]);

  const handleCancel = useCallback(() => {
    setName(displayUser?.name || "");
    setEmail(displayUser?.email || "");
    setPhone(displayUser?.mobile || "");
    setIsEditing(false);
  }, [displayUser]);

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
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={() => setIsEditing(true)}
                  >
                    {t("common.edit")}
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <FloatingLabelInput
                    label={t("profile.fullName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<User className="h-4 w-4" />}
                  />
                  <FloatingLabelInput
                    label={t("profile.emailAddress")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Shield className="h-4 w-4" />}
                  />
                  <FloatingLabelInput
                    label={t("profile.phone")}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
