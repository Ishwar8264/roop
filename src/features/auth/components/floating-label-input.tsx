/**
 * Purpose: Premium floating label input component for salon-style forms
 * Responsibility: Render input with animated floating label + icon support
 * Important Notes:
 *   - Label floats up when input has value or focus
 *   - Supports left icon, right action (e.g., password toggle)
 *   - Error state with red border + error message
 *   - Glassmorphism-compatible styling
 *   - Works with react-hook-form register() props
 */

"use client";

import { useState, forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  rightAction?: ReactNode;
  error?: string;
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
            "relative flex items-center h-14 rounded-xl border-2 bg-white/50 dark:bg-background/50 transition-all duration-300",
            isFocused
              ? "border-primary/60 shadow-[0_0_0_3px_rgba(194,24,91,0.12)] dark:shadow-[0_0_0_3px_rgba(244,143,177,0.15)]"
              : error
                ? "border-destructive/60 shadow-[0_0_0_3px_rgba(220,38,38,0.08)]"
                : "border-muted/50 hover:border-muted",
            className
          )}
        >
          {/* Left Icon */}
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

          {/* Input */}
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

          {/* Floating Label */}
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

          {/* Right Action (e.g., password toggle) */}
          {rightAction && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightAction}
            </div>
          )}
        </div>

        {/* Error Message */}
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
