/**
 * Purpose: Props-driven Staff form component for create & edit
 * Responsibility: Render staff form with Zod + react-hook-form validation
 * Important Notes:
 *   - mode="create" → shows userId field, POST /api/staff → redirect
 *   - mode="edit"   → hides userId, PATCH /api/staff/:id → redirect
 *   - Branch dropdown fetched via useBranches
 *   - Specialization tag input
 *   - Work days toggle switches
 *   - Unsaved changes guard with navigateAway
 *   - Reused by both app routes and admin routes
 *   - Uses Card for sectioned layout, Link for back navigation
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  X,
  User,
  Briefcase,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { useCreateStaff } from "@/features/staff/hooks/use-create-staff";
import { useUpdateStaff } from "@/features/staff/hooks/use-update-staff";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useTranslation } from "@/i18n/use-translation";
import type { WorkDays } from "@/features/staff/types";

// ==================== Zod Schema (frontend) ====================

/** Single schema — userId always present but only validated in create mode */
const staffFormSchema = z
  .object({
    userId: z.string(),
    branchId: z.string().min(1, "Branch is required"),
    specialization: z
      .array(z.string().min(1))
      .min(1, "At least one specialization required"),
    experienceYears: z.string(),
    bioHi: z.string(),
    bioEn: z.string(),
    workStart: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    workEnd: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    commissionRate: z.string(),
    workDays: z.object({
      mon: z.boolean(),
      tue: z.boolean(),
      wed: z.boolean(),
      thu: z.boolean(),
      fri: z.boolean(),
      sat: z.boolean(),
      sun: z.boolean(),
    }),
  })
  .refine((data) => data.workStart < data.workEnd, {
    message: "Work end time must be after start time",
    path: ["workEnd"],
  });

type StaffFormValues = z.infer<typeof staffFormSchema>;

// ==================== Day Keys ====================

const DAY_KEYS: { key: keyof WorkDays; label: string; short: string }[] = [
  { key: "mon", label: "Monday", short: "M" },
  { key: "tue", label: "Tuesday", short: "T" },
  { key: "wed", label: "Wednesday", short: "W" },
  { key: "thu", label: "Thursday", short: "T" },
  { key: "fri", label: "Friday", short: "F" },
  { key: "sat", label: "Saturday", short: "S" },
  { key: "sun", label: "Sunday", short: "S" },
];

const defaultWorkDays: WorkDays = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: true,
  sun: false,
};

// ==================== Props ====================

export interface StaffFormProps {
  mode: "create" | "edit";
  staffId?: string;
  defaultValues?: {
    userId?: string;
    branchId?: string;
    specialization?: string[];
    experienceYears?: number | null;
    bioHi?: string | null;
    bioEn?: string | null;
    workStart?: string;
    workEnd?: string;
    commissionRate?: number | null;
    workDays?: WorkDays;
  };
  /** Where to go after successful submit */
  returnUrl?: string;
}

// ==================== Component ====================

export function StaffForm({
  mode,
  staffId,
  defaultValues,
  returnUrl,
}: StaffFormProps) {
  const { t } = useTranslation();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const { data: branchesData } = useBranches({ limit: 100 });
  const [specInput, setSpecInput] = useState("");

  const isEditing = mode === "edit";

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      userId: defaultValues?.userId ?? "",
      branchId: defaultValues?.branchId ?? "",
      specialization: defaultValues?.specialization ?? [],
      experienceYears: defaultValues?.experienceYears?.toString() ?? "",
      bioHi: defaultValues?.bioHi ?? "",
      bioEn: defaultValues?.bioEn ?? "",
      workStart: defaultValues?.workStart ?? "09:00",
      workEnd: defaultValues?.workEnd ?? "19:00",
      commissionRate: defaultValues?.commissionRate?.toString() ?? "",
      workDays: defaultValues?.workDays ?? { ...defaultWorkDays },
    },
  });

  const isLoading = createStaff.isPending || updateStaff.isPending;

  const successUrl = returnUrl ?? (isEditing ? `/staff/${staffId}` : "/staff");

  // Unsaved changes guard — use navigateAway for all navigation
  const { UnsavedChangesDialog, navigateAway } = useUnsavedChanges(
    form.formState.isDirty
  );

  const onSubmit = (values: StaffFormValues) => {
    // In create mode, userId is required
    if (!isEditing && !values.userId.trim()) {
      form.setError("userId", { message: "User ID is required" });
      return;
    }

    const payload: Record<string, unknown> = {
      branchId: values.branchId,
      specialization: values.specialization,
      workStart: values.workStart,
      workEnd: values.workEnd,
      workDays: values.workDays,
    };

    const exp = Number(values.experienceYears);
    if (!isNaN(exp) && exp >= 0) payload.experienceYears = exp;
    if (values.bioHi?.trim()) payload.bioHi = values.bioHi.trim();
    if (values.bioEn?.trim()) payload.bioEn = values.bioEn.trim();
    const comm = Number(values.commissionRate);
    if (!isNaN(comm) && comm >= 0) payload.commissionRate = comm;

    if (isEditing && staffId) {
      updateStaff.mutate(
        { id: staffId, ...payload },
        { onSuccess: () => navigateAway(successUrl) }
      );
    } else {
      payload.userId = values.userId.trim();
      createStaff.mutate(payload as typeof payload & { userId: string }, {
        onSuccess: () => navigateAway(successUrl),
      });
    }
  };

  // Specialization helpers
  const addSpec = () => {
    const trimmed = specInput.trim();
    if (trimmed) {
      const current = form.getValues("specialization") ?? [];
      if (!current.includes(trimmed)) {
        form.setValue("specialization", [...current, trimmed], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      setSpecInput("");
    }
  };

  const removeSpec = (spec: string) => {
    const current = form.getValues("specialization") ?? [];
    form.setValue(
      "specialization",
      current.filter((s) => s !== spec),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-9 w-9 shrink-0"
        >
          <Link href={successUrl}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? t("staff.editStaff") : t("staff.addStaff")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update staff details below"
              : "Fill in the details to add a new staff member"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ─── Card: Basic Info ─── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Basic Information</CardTitle>
              </div>
              <CardDescription>
                Staff member identity and branch assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User ID (create only) */}
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("staff.userId")}</FormLabel>
                      <FormControl>
                        <Input placeholder="User ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Branch */}
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.branch")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("staff.selectBranch")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branchesData?.branches?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nameEn} — {b.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ─── Card: Professional ─── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Professional</CardTitle>
              </div>
              <CardDescription>
                Skills, experience, and bio information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Specialization Tags */}
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.specialization")}</FormLabel>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSpec}
                      >
                        +
                      </Button>
                    </div>
                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {field.value.map((spec: string) => (
                          <Badge
                            key={spec}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
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
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Experience */}
              <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.experience")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bioHi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("staff.bioHi")}</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bioEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("staff.bioEn")}</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ─── Card: Schedule ─── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Schedule</CardTitle>
              </div>
              <CardDescription>
                Working days and hours for the staff member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Work Days */}
              <FormField
                control={form.control}
                name="workDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.workDays")}</FormLabel>
                    <div className="flex gap-2 flex-wrap">
                      {DAY_KEYS.map(({ key, label, short }) => {
                        const isActive = field.value?.[key] ?? false;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              field.onChange({
                                ...field.value,
                                [key]: !isActive,
                              })
                            }
                            className={`
                              flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium
                              transition-colors border
                              ${
                                isActive
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
                              }
                            `}
                            title={label}
                          >
                            {short}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("staff.workStart")}</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Start time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("staff.workEnd")}</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="End time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ─── Card: Compensation ─── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Compensation</CardTitle>
              </div>
              <CardDescription>
                Commission rate for the staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.commissionRate")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Percentage (0-100)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateAway(successUrl)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t("common.save") : t("common.create") || "Create"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog />
    </div>
  );
}
