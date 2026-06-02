/**
 * @file Generic password input with show/hide toggle — reusable across the entire app
 *
 * PURPOSE:
 *   Wraps `FloatingLabelInput` and adds an eye/eye-off toggle button
 *   so the user can reveal or hide their password.
 *
 * WHY A SEPARATE COMPONENT?
 *   - Password fields with visibility toggle are needed in: login, register,
 *     change-password, reset-password, admin settings, etc.
 *   - Duplicating the eye-toggle logic everywhere is error-prone and messy.
 *   - This component encapsulates the toggle state + icon switch ONCE.
 *
 * USAGE:
 *   <PasswordInput
 *     label="Password"
 *     registerProps={form.register("password")}
 *     error={errors.password?.message}
 *   />
 *
 * REUSABILITY:
 *   Fully generic — no auth-specific logic. The `label` prop makes it work
 *   for "Password", "Confirm Password", "New Password", "Admin Key", etc.
 */

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

interface PasswordInputProps {
  /** Label text (e.g. "Password", "Confirm Password", "New Password") */
  label: string;
  /** Validation error message from react-hook-form */
  error?: string;
  /** react-hook-form register() return value */
  registerProps?: Record<string, unknown>;
  /** Whether the input is disabled */
  disabled?: boolean;
}

export function PasswordInput({ label, error, registerProps, disabled }: PasswordInputProps) {
  /** Whether the password text is currently visible to the user */
  const [visible, setVisible] = useState(false);

  return (
    <FloatingLabelInput
      label={label}
      type={visible ? "text" : "password"}
      icon={<Eye className="h-4.5 w-4.5" />}
      error={error}
      registerProps={registerProps}
      disabled={disabled}
      rightAction={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
