/**
 * Purpose: Registration form with Email + Password
 * Responsibility: Handle new user registration
 * Important Notes:
 *   - react-hook-form + Zod for real-time validation
 *   - Toast notifications on success/error (sonner)
 *   - Field-level validation with error messages
 *   - Backend error messages shown via toast
 *   - i18n for all UI strings
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiClient, ApiClientError } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, RegisterEmailResponse, UserProfile } from "@/types";

// ==================== Zod Schema ====================

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  mobile: z
    .string()
    .optional()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), "Must be 10 digits starting with 6-9"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "At most 72 characters")
    .regex(/[A-Z]/, "At least 1 uppercase letter")
    .regex(/[a-z]/, "At least 1 lowercase letter")
    .regex(/\d/, "At least 1 digit")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "At least 1 special character"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

// ==================== Types ====================

interface RegisterSuccessData {
  user: UserProfile;
  token: string;
}

interface RegisterFormProps {
  onSuccess?: (data: RegisterSuccessData) => void;
  onSwitchToLogin?: () => void;
}

// ==================== Component ====================

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const passwordValue = form.watch("password");

  // Password strength indicators
  const passwordChecks = [
    { label: "8+ characters", met: (passwordValue?.length ?? 0) >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(passwordValue || "") },
    { label: "Lowercase", met: /[a-z]/.test(passwordValue || "") },
    { label: "Digit", met: /\d/.test(passwordValue || "") },
    { label: "Special char", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue || "") },
  ];

  async function handleRegister(data: RegisterForm) {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<RegisterEmailResponse>>(
        "/auth/register-email",
        {
          email: data.email,
          password: data.password,
          name: data.name || undefined,
          mobile: data.mobile || undefined,
        }
      );

      if (res.success && res.data) {
        toast.success(t("common.success"), {
          description: "Account created! Welcome to Nikharta Roop.",
        });
        onSuccess?.({
          user: res.data.user,
          token: res.data.tokens.accessToken,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error("Registration Failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">
          {t("auth.registerTitle")}
        </CardTitle>
        <CardDescription>
          {t("auth.registerSubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name *</label>
            <Input
              type="text"
              placeholder="Your name"
              {...form.register("name")}
              className={`h-11 ${form.formState.errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.email")} *</label>
            <Input
              type="email"
              placeholder="example@email.com"
              {...form.register("email")}
              className={`h-11 ${form.formState.errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Mobile (optional) */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.mobileNumber")} (optional)</label>
            <Input
              type="tel"
              placeholder={t("auth.enterMobile")}
              {...form.register("mobile")}
              className={`h-11 ${form.formState.errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {form.formState.errors.mobile && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.mobile.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.password")} *</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                {...form.register("password")}
                className={`h-11 pr-10 ${form.formState.errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
            )}
            {/* Password strength indicators */}
            {passwordValue && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {passwordChecks.map((check) => (
                  <span
                    key={check.label}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      check.met
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {check.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirm Password *</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                {...form.register("confirmPassword")}
                className={`h-11 pr-10 ${form.formState.errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {t("auth.register")}
          </Button>

          {/* Switch to Login */}
          <div className="text-center pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={onSwitchToLogin}
              >
                {t("auth.login")}
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
