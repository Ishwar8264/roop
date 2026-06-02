/**
 * @file Generic floating-label input — reusable across the entire app
 *
 * PURPOSE:
 *   A premium-style input field with an animated floating label, optional
 *   left icon, optional right action slot, and error state support.
 *
 * WHY NOT JUST <input>?
 *   - Floating labels improve UX by keeping context visible while typing
 *   - Icon + right-action slots enable patterns like:  📱 [mobile input]  or  🔒 [password 👁]
 *   - Error state styling is built-in (red border + error message)
 *   - Works seamlessly with react-hook-form via `registerProps`
 *
 * USAGE:
 *   <FloatingLabelInput
 *     label="Mobile Number"
 *     type="tel"
 *     icon={<Phone />}
 *     registerProps={form.register("mobile")}
 *     error={errors.mobile?.message}
 *   />
 *
 * REUSABILITY:
 *   This is a GENERIC component — no auth-specific logic, no hardcoded
 *   colors beyond the theme tokens. Can be used in any form: booking,
 *   profile, settings, admin, etc.
 */

"use client";

import { useState, forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Text shown as the floating label (e.g. "Mobile Number", "Email") */
  label: string;
  /** Optional icon rendered inside the left side of the input */
  icon?: ReactNode;
  /** Optional action rendered on the right (e.g., password eye toggle) */
  rightAction?: ReactNode;
  /** Validation error message — shows red border + message below input */
  error?: string;
  /** react-hook-form register() return value — spreads onto <input> */
  registerProps?: Record<string, unknown>;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, icon, rightAction, error, registerProps, className, id, ...props }, ref) => {
    /** Tracks focus state for label animation + border highlight */
    const [isFocused, setIsFocused] = useState(false);

    /** Whether the input currently has a value (for floating label position) */
    const hasValue = Boolean(props.value || props.defaultValue);

    /** Label floats up when focused OR has a value */
    const isFloating = isFocused || hasValue;

    /** Stable DOM id for label ↔ input association */
    const inputId = id || `float-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <div className="w-full">
        {/* ── Input wrapper: border, focus glow, error highlight ── */}
        <div
          className={cn(
            "relative flex items-center h-14 rounded-xl border-2 bg-white/50 dark:bg-background/50 transition-all duration-300",
            isFocused
              ? "border-primary/60 shadow-[0_0_0_3px_rgba(194,24,91,0.12)] dark:shadow-[0_0_0_3px_rgba(244,143,177,0.15)]"
              : error
                ? "border-destructive/60 shadow-[0_0_0_3px_rgba(220,38,38,0.08)]"
                : "border-muted/50 hover:border-muted",
            className
          )}
        >
          {/* Left Icon — e.g. Phone, Mail, User */}
          {icon && (
            <div
              className={cn(
                "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300",
                isFocused ? "text-primary" : "text-muted-foreground"
              )}
            >
              {icon}
            </div>
          )}

          {/* The actual <input> element */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "peer w-full h-full bg-transparent outline-none text-foreground text-sm pt-4 pb-1 transition-colors duration-200",
              icon ? "pl-11" : "pl-4",
              rightAction ? "pr-12" : "pr-4"
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=" "
            aria-invalid={!!error}
            {...registerProps}
            {...props}
          />

          {/* Floating Label — animates up/down based on isFloating */}
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-0 transition-all duration-300 pointer-events-none select-none",
              icon ? "left-11" : "left-4",
              isFloating
                ? "top-1.5 text-[11px] font-medium"
                : "top-1/2 -translate-y-1/2 text-sm",
              isFocused
                ? "text-primary"
                : error
                  ? "text-destructive"
                  : "text-muted-foreground"
            )}
          >
            {label}
          </label>

          {/* Right Action Slot — e.g. password visibility toggle */}
          {rightAction && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightAction}
            </div>
          )}
        </div>

        {/* Error Message — appears below input with fade-in animation */}
        {error && (
          <p className="text-xs text-destructive mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";
