"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import { useCreateBranch } from "@/features/branch/hooks/use-create-branch";
import { useUpdateBranch } from "@/features/branch/hooks/use-update-branch";
import type { BranchResponse } from "@/features/branch/types";

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: BranchResponse | null;
}

interface FormState {
  nameHi: string;
  nameEn: string;
  city: string;
  address: string;
  phone: string;
  googleMapsUrl: string;
  openTime: string;
  closeTime: string;
}

const initialForm: FormState = {
  nameHi: "",
  nameEn: "",
  city: "",
  address: "",
  phone: "",
  googleMapsUrl: "",
  openTime: "09:00",
  closeTime: "20:00",
};

export function BranchFormDialog({
  open,
  onOpenChange,
  branch,
}: BranchFormDialogProps) {
  const { t } = useTranslation();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const isEditing = !!branch;

  const defaultForm = useMemo<FormState>(
    () =>
      branch
        ? {
            nameHi: branch.nameHi,
            nameEn: branch.nameEn,
            city: branch.city,
            address: branch.address,
            phone: branch.phone,
            googleMapsUrl: branch.googleMapsUrl || "",
            openTime: branch.openTime,
            closeTime: branch.closeTime,
          }
        : initialForm,
    [branch]
  );

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(branch ? defaultForm : initialForm);
      setErrors({});
    }
    onOpenChange(nextOpen);
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.nameHi.trim()) e.nameHi = t("common.pleaseEnter");
    if (!form.nameEn.trim()) e.nameEn = t("common.pleaseEnter");
    if (!form.city.trim()) e.city = t("common.pleaseEnter");
    if (!form.address.trim()) e.address = t("common.pleaseEnter");
    if (!form.phone.trim()) e.phone = t("common.pleaseEnter");
    if (!form.openTime) e.openTime = t("common.pleaseEnter");
    if (!form.closeTime) e.closeTime = t("common.pleaseEnter");
    if (form.openTime && form.closeTime && form.openTime >= form.closeTime)
      e.closeTime =
        t("branches.openTime") + " < " + t("branches.closeTime");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      nameHi: form.nameHi.trim(),
      nameEn: form.nameEn.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      googleMapsUrl: form.googleMapsUrl.trim() || null,
      openTime: form.openTime,
      closeTime: form.closeTime,
    };
    if (isEditing && branch) {
      updateBranch.mutate(
        { id: branch.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createBranch.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isLoading = createBranch.isPending || updateBranch.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("branches.editBranch") : t("branches.addBranch")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("branches.editBranch") : t("branches.addBranch")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nameHi">{t("branches.branchNameHi")}</Label>
            <Input
              id="nameHi"
              value={form.nameHi}
              onChange={(e) => updateField("nameHi", e.target.value)}
              placeholder="शाखा का नाम हिंदी में"
            />
            {errors.nameHi && (
              <p className="text-xs text-destructive">{errors.nameHi}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nameEn">{t("branches.branchNameEn")}</Label>
            <Input
              id="nameEn"
              value={form.nameEn}
              onChange={(e) => updateField("nameEn", e.target.value)}
              placeholder="Branch name in English"
            />
            {errors.nameEn && (
              <p className="text-xs text-destructive">{errors.nameEn}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">{t("branches.city")}</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
            {errors.city && (
              <p className="text-xs text-destructive">{errors.city}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">{t("branches.address")}</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("branches.phone")}</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="10-digit mobile number"
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="googleMapsUrl">
              {t("branches.googleMapsUrl")}
            </Label>
            <Input
              id="googleMapsUrl"
              value={form.googleMapsUrl}
              onChange={(e) => updateField("googleMapsUrl", e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="openTime">{t("branches.openTime")}</Label>
              <Input
                id="openTime"
                type="time"
                value={form.openTime}
                onChange={(e) => updateField("openTime", e.target.value)}
              />
              {errors.openTime && (
                <p className="text-xs text-destructive">{errors.openTime}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closeTime">{t("branches.closeTime")}</Label>
              <Input
                id="closeTime"
                type="time"
                value={form.closeTime}
                onChange={(e) => updateField("closeTime", e.target.value)}
              />
              {errors.closeTime && (
                <p className="text-xs text-destructive">
                  {errors.closeTime}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
