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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";
import { useCreateStaff } from "@/features/staff/hooks/use-create-staff";
import { useUpdateStaff } from "@/features/staff/hooks/use-update-staff";
import { useBranches } from "@/features/branch/hooks/use-branches";
import type { StaffResponse } from "@/features/staff/types";
import type { WorkDays } from "@/features/staff/types";

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffResponse | null;
}

interface FormState {
  userId: string;
  branchId: string;
  specialization: string[];
  experienceYears: string;
  bioHi: string;
  bioEn: string;
  workStart: string;
  workEnd: string;
  commissionRate: string;
  workDays: WorkDays;
}

const defaultWorkDays: WorkDays = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: true,
  sun: false,
};

const initialForm: FormState = {
  userId: "",
  branchId: "",
  specialization: [],
  experienceYears: "",
  bioHi: "",
  bioEn: "",
  workStart: "09:00",
  workEnd: "19:00",
  commissionRate: "",
  workDays: { ...defaultWorkDays },
};

const DAY_KEYS: { key: keyof WorkDays; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
}: StaffFormDialogProps) {
  const { t } = useTranslation();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const { data: branchesData } = useBranches({ limit: 100 });
  const isEditing = !!staff;

  const defaultForm = useMemo<FormState>(
    () =>
      staff
        ? {
            userId: staff.userId,
            branchId: staff.branchId,
            specialization: staff.specialization,
            experienceYears: staff.experienceYears?.toString() || "",
            bioHi: staff.bioHi || "",
            bioEn: staff.bioEn || "",
            workStart: staff.workStart,
            workEnd: staff.workEnd,
            commissionRate: staff.commissionRate?.toString() || "",
            workDays: staff.workDays,
          }
        : { ...initialForm, workDays: { ...defaultWorkDays } },
    [staff]
  );

  const [form, setForm] = useState<FormState>(defaultForm);
  const [specInput, setSpecInput] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(staff ? defaultForm : { ...initialForm, workDays: { ...defaultWorkDays } });
      setErrors({});
      setSpecInput("");
    }
    onOpenChange(nextOpen);
  };

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addSpec = () => {
    const trimmed = specInput.trim();
    if (trimmed && !form.specialization.includes(trimmed)) {
      updateField("specialization", [...form.specialization, trimmed]);
      setSpecInput("");
    }
  };

  const removeSpec = (spec: string) => {
    updateField(
      "specialization",
      form.specialization.filter((s) => s !== spec)
    );
  };

  const toggleDay = (key: keyof WorkDays) => {
    updateField("workDays", { ...form.workDays, [key]: !form.workDays[key] });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!isEditing && !form.userId.trim()) e.userId = t("common.pleaseEnter");
    if (!form.branchId) e.branchId = t("common.pleaseEnter");
    if (form.specialization.length === 0)
      e.specialization = t("common.pleaseEnter");
    if (form.workStart && form.workEnd && form.workStart >= form.workEnd)
      e.workEnd = t("branches.openTime") + " < " + t("branches.closeTime");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: Record<string, unknown> = {
      branchId: form.branchId,
      specialization: form.specialization,
      workStart: form.workStart,
      workEnd: form.workEnd,
      workDays: form.workDays,
    };
    if (form.experienceYears) payload.experienceYears = Number(form.experienceYears);
    if (form.bioHi.trim()) payload.bioHi = form.bioHi.trim();
    if (form.bioEn.trim()) payload.bioEn = form.bioEn.trim();
    if (form.commissionRate) payload.commissionRate = Number(form.commissionRate);

    if (isEditing && staff) {
      updateStaff.mutate(
        { id: staff.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      payload.userId = form.userId.trim();
      createStaff.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isLoading = createStaff.isPending || updateStaff.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("staff.editStaff") : t("staff.addStaff")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("staff.editStaff") : t("staff.addStaff")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* User ID (only for create) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="userId">{t("staff.userId")}</Label>
              <Input
                id="userId"
                value={form.userId}
                onChange={(e) => updateField("userId", e.target.value)}
                placeholder="User ID"
              />
              {errors.userId && (
                <p className="text-xs text-destructive">{errors.userId}</p>
              )}
            </div>
          )}

          {/* Branch */}
          <div className="space-y-1.5">
            <Label htmlFor="branchId">{t("staff.branch")}</Label>
            <select
              id="branchId"
              value={form.branchId}
              onChange={(e) => updateField("branchId", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{t("staff.selectBranch")}</option>
              {branchesData?.branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameEn} — {b.city}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="text-xs text-destructive">{errors.branchId}</p>
            )}
          </div>

          {/* Specialization Tags */}
          <div className="space-y-1.5">
            <Label>{t("staff.specialization")}</Label>
            <div className="flex gap-2">
              <Input
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                placeholder={t("staff.addSpecialization")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpec();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                +
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {form.specialization.map((spec) => (
                <Badge key={spec} variant="secondary" className="gap-1 pr-1">
                  {spec}
                  <button
                    type="button"
                    onClick={() => removeSpec(spec)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {errors.specialization && (
              <p className="text-xs text-destructive">{errors.specialization}</p>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-1.5">
            <Label htmlFor="experienceYears">{t("staff.experience")}</Label>
            <Input
              id="experienceYears"
              type="number"
              min="0"
              max="60"
              value={form.experienceYears}
              onChange={(e) =>
                updateField("experienceYears", e.target.value)
              }
              placeholder="0"
            />
          </div>

          {/* Bio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bioHi">{t("staff.bioHi")}</Label>
              <Textarea
                id="bioHi"
                value={form.bioHi}
                onChange={(e) => updateField("bioHi", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bioEn">{t("staff.bioEn")}</Label>
              <Textarea
                id="bioEn"
                value={form.bioEn}
                onChange={(e) => updateField("bioEn", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Work Days */}
          <div className="space-y-1.5">
            <Label>{t("staff.workDays")}</Label>
            <div className="flex gap-2 flex-wrap">
              {DAY_KEYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Switch
                    id={`day-${key}`}
                    checked={form.workDays[key]}
                    onCheckedChange={() => toggleDay(key)}
                  />
                  <Label htmlFor={`day-${key}`} className="text-xs">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="workStart">{t("staff.workStart")}</Label>
              <Input
                id="workStart"
                type="time"
                value={form.workStart}
                onChange={(e) => updateField("workStart", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workEnd">{t("staff.workEnd")}</Label>
              <Input
                id="workEnd"
                type="time"
                value={form.workEnd}
                onChange={(e) => updateField("workEnd", e.target.value)}
              />
              {errors.workEnd && (
                <p className="text-xs text-destructive">{errors.workEnd}</p>
              )}
            </div>
          </div>

          {/* Commission Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="commissionRate">{t("staff.commissionRate")}</Label>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.commissionRate}
              onChange={(e) =>
                updateField("commissionRate", e.target.value)
              }
              placeholder="0"
            />
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
