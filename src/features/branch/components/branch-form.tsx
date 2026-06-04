/**
 * Purpose: Props-driven Branch form component for create & edit
 * Responsibility: Render branch form with Zod + react-hook-form validation
 * Important Notes:
 *   - mode="create" → POST /api/branches → redirect to list
 *   - mode="edit"   → PATCH /api/branches/:id → redirect back
 *   - defaultValues pre-fill for edit mode
 *   - Reused by both app routes and admin routes
 */

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCreateBranch } from "@/features/branch/hooks/use-create-branch";
import { useUpdateBranch } from "@/features/branch/hooks/use-update-branch";
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
  /** Where to go after successful submit. Defaults: /branches or /admin/branches */
  returnUrl?: string;
}

// ==================== Component ====================

export function BranchForm({
  mode,
  branchId,
  defaultValues,
  returnUrl,
}: BranchFormProps) {
  const router = useRouter();
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

  const onSubmit = (values: BranchFormValues) => {
    const payload = {
      ...values,
      googleMapsUrl: values.googleMapsUrl?.trim() || null,
    };

    if (isEditing && branchId) {
      updateBranch.mutate(
        { id: branchId, ...payload },
        { onSuccess: () => router.push(successUrl) }
      );
    } else {
      createBranch.mutate(payload, {
        onSuccess: () => router.push(successUrl),
      });
    }
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
            {isEditing ? t("branches.editBranch") : t("branches.addBranch")}
          </h2>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEditing ? t("branches.editBranch") : t("branches.addBranch")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Bilingual Names */}
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

              {/* City + Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branches.city")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone + Maps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="googleMapsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branches.googleMapsUrl")}</FormLabel>
                      <FormControl>
                        <Input placeholder="https://maps.google.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branches.openTime")}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
