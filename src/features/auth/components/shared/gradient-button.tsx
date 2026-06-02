/**
 * @file Gradient submit button — shared across auth forms
 *
 * PURPOSE:
 *   A premium-styled gradient button used as the primary CTA (Call To Action)
 *   in auth forms. Shows a loading spinner when `loading` is true.
 *
 * WHY SHARED?
 *   Both login and register forms use the exact same gradient button.
 *   Duplicating it means styling drift over time. One component = one source of truth.
 *
 * DESIGN:
 *   - Rose-to-pink gradient (matches the salon brand theme)
 *   - Subtle rose glow shadow that intensifies on hover
 *   - Smooth 300ms transition on hover/press
 *   - Loading state: replaces children with a spinning Loader2 icon
 *   - Disabled state: 50% opacity
 */

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GradientButtonProps {
  /** Whether the form is submitting (shows spinner) */
  loading: boolean;
  /** Whether the button should be disabled (e.g., form invalid) */
  disabled: boolean;
  /** Button content (label + optional icon) */
  children: React.ReactNode;
}

export function GradientButton({ loading, disabled, children }: GradientButtonProps) {
  return (
    <Button
      type="submit"
      className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50"
      disabled={loading || disabled}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </Button>
  );
}
