/**
 * Purpose: Props-driven Branch form component for create & edit
 * Responsibility: Render branch form with Zod + react-hook-form validation
 * Important Notes:
 *   - mode="create" → POST /api/branches → redirect to list
 *   - mode="edit"   → PATCH /api/branches/:id → redirect back
 *   - defaultValues pre-fill for edit mode
 *   - defaultLocation pre-fills map pin for edit mode
 *   - LocationPicker for Google Maps integration
 *   - TimePicker for open/close time selection
 *   - Unsaved changes guard prevents accidental navigation
 *   - Reused by both app routes and admin routes
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TimePicker } from "@/components/ui/time-picker";
import { LocationPicker } from "@/components/shared/location-picker";
import type { LocationData } from "@/components/shared/location-picker";
import { useCreateBranch } from "@/features/branch/hooks/use-create-branch";
import { useUpdateBranch } from "@/features/branch/hooks/use-update-branch";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useTranslation } from "@/i18n/use-translation";

// ==================== Zod Schema (frontend-specific) ====================

const branchFormSchema = z
  .object({
    nameHi: z
      .string()
      .min(1, "Hindi name is required")
      .max(200, "Hindi name must be under 200 characters"),
    nameEn: z
      .string()
      .min(1, "English name is required")
      .max(200, "English name must be under 200 characters"),
    city: z
      .string()
      .min(1, "City is required")
      .max(100, "City must be under 100 characters"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(500, "Address must be under 500 characters"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Phone must be 10 digits starting with 6-9"),
    googleMapsUrl: z
      .string()
      .url("Must be a valid URL")
      .or(z.literal(""))
      .optional(),
    openTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    closeTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  })
  .refine((data) => data.openTime < data.closeTime, {
    message: "Close time must be after open time",
    path: ["closeTime"],
  });

type BranchFormValues = z.infer<typeof branchFormSchema>;

// ==================== Props ====================

export interface BranchFormProps {
  mode: "create" | "edit";
  branchId?: string;
  defaultValues?: Partial<BranchFormValues>;
  /** Pre-loaded location data for edit mode (parsed from googleMapsUrl) */
  defaultLocation?: LocationData | null;
  /** Where to go after successful submit. Defaults: /branches or /admin/branches */
  returnUrl?: string;
}

// ==================== Component ====================

export function BranchForm({
  mode,
  branchId,
  defaultValues,
  defaultLocation,
  returnUrl,
}: BranchFormProps) {
  const { t } = useTranslation();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const isEditing = mode === "edit";

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      nameHi: defaultValues?.nameHi ?? "",
      nameEn: defaultValues?.nameEn ?? "",
      city: defaultValues?.city ?? "",
      address: defaultValues?.address ?? "",
      phone: defaultValues?.phone ?? "",
      googleMapsUrl: defaultValues?.googleMapsUrl ?? "",
      openTime: defaultValues?.openTime ?? "09:00",
      closeTime: defaultValues?.closeTime ?? "20:00",
    },
  });

  const isLoading = createBranch.isPending || updateBranch.isPending;

  const successUrl = returnUrl ?? (isEditing ? `/branches/${branchId}` : "/branches");

  // Unsaved changes guard — use navigateAway for all navigation
  const { UnsavedChangesDialog, navigateAway } = useUnsavedChanges(form.formState.isDirty);

  // Handle location selection from map
  const handleLocationChange = (location: LocationData | null) => {
    if (location) {
      form.setValue("googleMapsUrl", location.googleMapsUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      // Auto-fill city and address from map selection
      if (location.city && !form.getValues("city")) {
        form.setValue("city", location.city, { shouldDirty: true });
      }
      if (location.address && !form.getValues("address")) {
        form.setValue("address", location.address, { shouldDirty: true });
      }
    } else {
      form.setValue("googleMapsUrl", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const onSubmit = (values: BranchFormValues) => {
    const payload = {
      ...values,
      googleMapsUrl: values.googleMapsUrl?.trim() || null,
    };

    if (isEditing && branchId) {
      updateBranch.mutate(
        { id: branchId, ...payload },
        { onSuccess: () => navigateAway(successUrl) }
      );
    } else {
      createBranch.mutate(payload, {
        onSuccess: () => navigateAway(successUrl),
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateAway(successUrl)}
          className="h-9 w-9 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? t("branches.editBranch") : t("branches.addBranch")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update branch details below" : "Fill in the details to create a new branch"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* ─── Section: Basic Info ─── */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>
            <Separator />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nameHi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.branchNameHi")}</FormLabel>
                  <FormControl>
                    <Input placeholder="शाखा का नाम हिंदी में" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.branchNameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Branch name in English" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ─── Section: Contact ─── */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </h3>
            </div>
            <Separator />
          </div>

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("branches.phone")}</FormLabel>
                <FormControl>
                  <Input placeholder="10-digit mobile number" {...field} />
                </FormControl>
                <FormDescription>Must start with 6-9</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ─── Section: Location ─── */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Location
              </h3>
            </div>
            <Separator />
          </div>

          <FormField
            control={form.control}
            name="googleMapsUrl"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("branches.pickLocation") || "Pick Location on Map"}</FormLabel>
                <FormControl>
                  <LocationPicker
                    value={defaultLocation}
                    onChange={handleLocationChange}
                    error={fieldState.error?.message}
                  />
                </FormControl>
                <input type="hidden" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.city")}</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.address")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ─── Section: Timing ─── */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Timing
              </h3>
            </div>
            <Separator />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="openTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.openTime")}</FormLabel>
                  <FormControl>
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Opening time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="closeTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.closeTime")}</FormLabel>
                  <FormControl>
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Closing time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Actions */}
          <Separator />
          <div className="flex items-center justify-end gap-3">
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
              className="min-w-[100px]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Form>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog />
    </div>
  );
}
