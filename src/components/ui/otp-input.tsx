/**
 * @file Premium OTP digit-box input — reusable across the entire app
 *
 * PURPOSE: Renders N individual input boxes (default 6) for OTP entry.
 * Auto-advance on digit, backspace navigation, paste support.
 * Solid dark mode bg with proper contrast.
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
      onChange(newDigits.join("").replace(/ /g, ""));
      if (newDigit && index < length - 1) getInputByIndex(index + 1)?.focus();
    },
    [digits, length, onChange, getInputByIndex]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        getInputByIndex(index - 1)?.focus();
      }
    },
    [digits, getInputByIndex]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted.length > 0) {
        onChange(pasted);
        setTimeout(() => getInputByIndex(Math.min(pasted.length, length - 1))?.focus(), 0);
      }
    },
    [length, onChange, getInputByIndex]
  );

  return (
    <div className="w-full">
      <div ref={containerRef} className="flex gap-3 justify-center" onPaste={handlePaste}>
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
                "w-12 h-14 text-center text-lg font-bold rounded-xl border-2 transition-all duration-200 outline-none",
                "bg-white dark:bg-zinc-900",
                hasDigit
                  ? "border-rose-400 dark:border-rose-500 text-rose-600 dark:text-rose-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
                "focus:border-rose-400 dark:focus:border-rose-500",
                "focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(244,63,94,0.25)]",
                "focus:scale-105",
                error && !hasDigit && "border-red-400 dark:border-red-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`OTP digit ${i + 1}`}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
