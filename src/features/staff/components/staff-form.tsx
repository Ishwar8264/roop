/**
 * Purpose: Props-driven Staff form component for create & edit
 * Responsibility: Render staff form with Zod + react-hook-form validation
 * Important Notes:
 *   - mode="create" → shows userId field, POST /api/staff → redirect
 *   - mode="edit"   → hides userId, PATCH /api/staff/:id → redirect
 *   - Branch dropdown fetched via useBranches
 *   - Specialization tag input
 *   - Work days toggle switches
 *   - Reused by both app routes and admin routes
 */

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCreateStaff } from "@/features/staff/hooks/use-create-staff";
import { useUpdateStaff } from "@/features/staff/hooks/use-update-staff";
import { useBranches } from "@/features/branch/hooks/use-branches";
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

const DAY_KEYS: { key: keyof WorkDays; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
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
  const router = useRouter();
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
        { onSuccess: () => router.push(successUrl) }
      );
    } else {
      payload.userId = values.userId.trim();
      createStaff.mutate(payload as typeof payload & { userId: string }, {
        onSuccess: () => router.push(successUrl),
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
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(successUrl)}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? t("staff.editStaff") : t("staff.addStaff")}
          </h2>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEditing ? t("staff.editStaff") : t("staff.addStaff")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.value?.map((spec: string) => (
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

              {/* Work Days */}
              <FormField
                control={form.control}
                name="workDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.workDays")}</FormLabel>
                    <div className="flex gap-3 flex-wrap">
                      {DAY_KEYS.map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center gap-1.5"
                        >
                          <Switch
                            id={`day-${key}`}
                            checked={field.value?.[key] ?? false}
                            onCheckedChange={(checked) =>
                              field.onChange({
                                ...field.value,
                                [key]: checked,
                              })
                            }
                          />
                          <label
                            htmlFor={`day-${key}`}
                            className="text-xs cursor-pointer"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
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
                        <Input type="time" {...field} />
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
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Commission Rate */}
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

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(successUrl)}
                  disabled={isLoading}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
