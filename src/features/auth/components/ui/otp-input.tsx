/**
 * Purpose: Premium individual OTP digit box input with salon-grade design
 * Responsibility: Render 6 animated OTP input boxes with auto-focus, glow, and keyboard nav
 * Important Notes:
 *   - Each box is a separate input with auto-advance on digit entry
 *   - Backspace navigates to previous box
 *   - Active box gets a rose glow animation
 *   - Filled boxes show primary color border
 *   - Calls onChange with combined 6-digit string
 */

"use client";

import { useRef, useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, length = 6, error, disabled }: OtpInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const digits = value.padEnd(length, "").slice(0, length).split("");

  const getInputByIndex = useCallback((index: number): HTMLInputElement | null => {
    if (!containerRef.current) return null;
    const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
    return inputs[index] ?? null;
  }, []);

  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (!/^\d*$/.test(raw)) return;

      const newDigit = raw.slice(-1);
      const newDigits = [...digits];
      newDigits[index] = newDigit;
      const combined = newDigits.join("").replace(/ /g, "");
      onChange(combined);

      // Auto-focus next box
      if (newDigit && index < length - 1) {
        getInputByIndex(index + 1)?.focus();
      }
    },
    [digits, length, onChange, getInputByIndex]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        getInputByIndex(index - 1)?.focus();
      }
      // Allow paste handling
      if (e.key === "v" && (e.metaKey || e.ctrlKey)) {
        // Let the browser handle paste naturally
        return;
      }
    },
    [digits, getInputByIndex]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted.length > 0) {
        onChange(pasted);
        // Focus the last filled box or the next empty one
        const focusIndex = Math.min(pasted.length, length - 1);
        setTimeout(() => getInputByIndex(focusIndex)?.focus(), 0);
      }
    },
    [length, onChange, getInputByIndex]
  );

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex gap-2.5 justify-center"
        onPaste={handlePaste}
      >
        {Array.from({ length }, (_, i) => {
          const hasDigit = Boolean(digits[i] && digits[i] !== " ");

          return (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={hasDigit ? digits[i] : ""}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={disabled}
              className={cn(
                "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-300 outline-none",
                "bg-white/60 dark:bg-background/60",
                // Filled state
                hasDigit
                  ? "border-primary/50 text-primary shadow-sm shadow-primary/10"
                  : "border-muted/40 text-foreground",
                // Focus/active state — premium rose glow
                "focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(194,24,91,0.15),0_0_20px_rgba(194,24,91,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(244,143,177,0.2),0_0_20px_rgba(244,143,177,0.12)]",
                "focus:scale-105 focus:bg-white dark:focus:bg-background",
                // Error state
                error && !hasDigit && "border-destructive/40",
                // Disabled
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`OTP digit ${i + 1}`}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-destructive mt-2 text-center animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
