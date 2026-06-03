/**
 * @file Premium password input with eye toggle — reusable across the entire app
 *
 * PURPOSE: Wraps FloatingLabelInput and adds show/hide password toggle.
 * Reusable in login, register, change-password, reset-password, etc.
 */

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

interface PasswordInputProps {
  /** Label text */
  label: string;
  /** Validation error message */
  error?: string;
  /** react-hook-form register() return value */
  registerProps?: Record<string, unknown>;
  /** Whether the input is disabled */
  disabled?: boolean;
}

export function PasswordInput({ label, error, registerProps, disabled }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FloatingLabelInput
      label={label}
      type={visible ? "text" : "password"}
      icon={<Eye className="h-[18px] w-[18px]" />}
      error={error}
      registerProps={registerProps}
      disabled={disabled}
      rightAction={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
