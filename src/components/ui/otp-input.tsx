/**
 * @file Generic OTP digit-box input — reusable across the entire app
 *
 * PURPOSE:
 *   Renders N individual input boxes (default 6) for one-time password entry.
 *   Each box accepts a single digit, auto-advances focus on entry, and
 *   supports backspace navigation and paste-from-clipboard.
 *
 * WHY INDIVIDUAL BOXES INSTEAD OF A SINGLE INPUT?
 *   - Better UX: users can see exactly which digit goes where
 *   - Premium feel: each box gets a glow animation when active
 *   - Mobile-friendly: `inputMode="numeric"` brings up the number pad
 *   - Paste support: users can paste a full OTP and it auto-fills all boxes
 *
 * USAGE:
 *   <OtpInput
 *     value={otpValue}
 *     onChange={(fullOtp) => form.setValue("otp", fullOtp)}
 *     error={errors.otp?.message}
 *     disabled={isSubmitting}
 *   />
 *
 * REUSABILITY:
 *   Fully generic — no auth-specific logic. Can be used for:
 *   login OTP, registration OTP, 2FA, email verification, etc.
 */

"use client";

import { useRef, useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  /** Current OTP value (controlled — parent manages state) */
  value: string;
  /** Called with the full combined digit string whenever any box changes */
  onChange: (value: string) => void;
  /** Number of digit boxes (default: 6) */
  length?: number;
  /** Validation error message */
  error?: string;
  /** Whether all boxes are disabled (e.g., during submission) */
  disabled?: boolean;
}

export function OtpInput({ value, onChange, length = 6, error, disabled }: OtpInputProps) {
  /** Ref to the container div — used to query individual <input> elements */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Split the value into individual digits, padding with empty slots */
  const digits = value.padEnd(length, "").slice(0, length).split("");

  /**
   * Get the <input> DOM element at a specific index.
   * Used for programmatic focus management (auto-advance, backspace nav).
   */
  const getInputByIndex = useCallback((index: number): HTMLInputElement | null => {
    if (!containerRef.current) return null;
    const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
    return inputs[index] ?? null;
  }, []);

  /**
   * Handle digit entry in a single box.
   *
   * HOW:
   *   1. Reject non-numeric input
   *   2. Take only the LAST typed character (handles replacing a selected digit)
   *   3. Rebuild the full digit string and call onChange
   *   4. Auto-focus the next box if a digit was entered
   */
  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (!/^\d*$/.test(raw)) return; // reject non-digits

      const newDigit = raw.slice(-1); // take last char only
      const newDigits = [...digits];
      newDigits[index] = newDigit;
      const combined = newDigits.join("").replace(/ /g, "");
      onChange(combined);

      if (newDigit && index < length - 1) {
        getInputByIndex(index + 1)?.focus();
      }
    },
    [digits, length, onChange, getInputByIndex]
  );

  /**
   * Handle keyboard navigation between boxes.
   * - Backspace on an empty box → focus the previous box
   * - Ctrl/Cmd+V → let browser handle paste naturally
   */
  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        getInputByIndex(index - 1)?.focus();
      }
      if (e.key === "v" && (e.metaKey || e.ctrlKey)) {
        return; // let paste event handle it
      }
    },
    [digits, getInputByIndex]
  );

  /**
   * Handle pasting a full OTP from clipboard.
   *
   * HOW:
   *   1. Extract digits-only from clipboard text
   *   2. Take up to `length` digits
   *   3. Call onChange with the full string
   *   4. Focus the last filled box (or next empty one)
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted.length > 0) {
        onChange(pasted);
        const focusIndex = Math.min(pasted.length, length - 1);
        setTimeout(() => getInputByIndex(focusIndex)?.focus(), 0);
      }
    },
    [length, onChange, getInputByIndex]
  );

  return (
    <div className="w-full">
      <div ref={containerRef} className="flex gap-2.5 justify-center" onPaste={handlePaste}>
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
                hasDigit
                  ? "border-primary/50 text-primary shadow-sm shadow-primary/10"
                  : "border-muted/40 text-foreground",
                "focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(194,24,91,0.15),0_0_20px_rgba(194,24,91,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(244,143,177,0.2),0_0_20px_rgba(244,143,177,0.12)]",
                "focus:scale-105 focus:bg-white dark:focus:bg-background",
                error && !hasDigit && "border-destructive/40",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`OTP digit ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Error message below the boxes */}
      {error && (
        <p className="text-xs text-destructive mt-2 text-center animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
