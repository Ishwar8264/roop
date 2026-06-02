/**
 * Purpose: Generic password input with eye toggle — extends FloatingLabelInput
 * Responsibility: Render password field with show/hide toggle button
 * Important Notes:
 *   - Reusable anywhere password input is needed
 *   - Wraps FloatingLabelInput + adds Eye/EyeOff toggle
 */

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FloatingLabelInput } from "./floating-label-input";

interface PasswordInputProps {
  label: string;
  error?: string;
  registerProps?: Record<string, unknown>;
  disabled?: boolean;
}

export function PasswordInput({ label, error, registerProps, disabled }: PasswordInputProps) {
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
