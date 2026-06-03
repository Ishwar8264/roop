/**
 * @file Premium floating-label input — reusable across the entire app
 *
 * PURPOSE: Render input with animated floating label, optional left icon,
 * optional right action slot, and error state. Works with react-hook-form.
 *
 * DESIGN PRINCIPLES:
 *   - Label floats up smoothly on focus or when input has value
 *   - Generous height (56px) and padding for easy touch targets
 *   - Dark mode: SOLID dark bg + visible borders + proper contrast
 *   - Focus: rose glow ring + border highlight
 *   - Error: red border + red glow + error message below
 *   - placeholder-transparent so floating label works correctly
 */

"use client";

import { useState, forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Text shown as the floating label */
  label: string;
  /** Optional icon rendered on the left */
  icon?: ReactNode;
  /** Optional action on the right (e.g., password toggle) */
  rightAction?: ReactNode;
  /** Validation error message */
  error?: string;
  /** react-hook-form register() return value */
  registerProps?: Record<string, unknown>;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, icon, rightAction, error, registerProps, className, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(props.value || props.defaultValue);
    const isFloating = isFocused || hasValue;
    const inputId = id || `float-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <div className="w-full">
        <div
          className={cn(
            "relative flex items-center h-14 rounded-xl border-2 transition-all duration-200",
            /* SOLID backgrounds for proper contrast */
            "bg-white dark:bg-zinc-900",
            /* Focus: rose border + glow */
            isFocused && !error && [
              "border-rose-400 dark:border-rose-500",
              "shadow-[0_0_0_3px_rgba(244,63,94,0.15)]",
              "dark:shadow-[0_0_0_3px_rgba(244,63,94,0.25)]",
            ],
            /* Error: red border + glow */
            !isFocused && error && [
              "border-red-400 dark:border-red-500",
              "shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
            ],
            /* Default: visible borders */
            !isFocused && !error && [
              "border-zinc-200 dark:border-zinc-700",
              "hover:border-zinc-300 dark:hover:border-zinc-600",
            ],
            className
          )}
        >
          {/* Left Icon */}
          {icon && (
            <div
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                isFocused ? "text-rose-500 dark:text-rose-400" : "text-zinc-400 dark:text-zinc-500"
              )}
            >
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "peer w-full h-full bg-transparent outline-none text-sm transition-colors duration-200",
              "text-zinc-900 dark:text-zinc-100",
              "pt-5 pb-1",
              icon ? "pl-11" : "pl-4",
              rightAction ? "pr-12" : "pr-4",
              "placeholder-transparent"
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={label}
            aria-invalid={!!error}
            {...registerProps}
            {...props}
          />

          {/* Floating Label */}
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-0 transition-all duration-200 pointer-events-none select-none origin-left",
              icon ? "left-11" : "left-4",
              isFloating
                ? "top-2 text-[11px] font-medium"
                : "top-1/2 -translate-y-1/2 text-sm",
              isFocused
                ? "text-rose-500 dark:text-rose-400"
                : error
                  ? "text-red-500 dark:text-red-400"
                  : "text-zinc-400 dark:text-zinc-500"
            )}
          >
            {label}
          </label>

          {/* Right Action */}
          {rightAction && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightAction}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 ml-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";
