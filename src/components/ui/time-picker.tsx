/**
 * Purpose: Time Picker component with hours/minutes/AM-PM selection
 * Responsibility: Provide a shadcn-style time picker for forms
 * Important Notes:
 *   - 12-hour format with AM/PM toggle
 *   - Returns "HH:MM" 24-hour format for API
 *   - Used in BranchForm (openTime, closeTime) and StaffForm (workStart, workEnd)
 *   - Integrates with react-hook-form via FormField
 *   - Clean design with scroll-style number selectors
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ==================== Types ====================

interface TimePickerProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// ==================== Helpers ====================

/** Convert "HH:MM" (24h) → { hours: number (1-12), minutes: number, period: "AM" | "PM" } */
function to12Hour(time24: string): {
  hours: number;
  minutes: number;
  period: "AM" | "PM";
} {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? ("PM" as const) : ("AM" as const);
  const hours = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hours, minutes: m, period };
}

/** Convert { hours: 1-12, minutes, period } → "HH:MM" (24h) */
function to24Hour(hours: number, minutes: number, period: "AM" | "PM"): string {
  let h = hours;
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/** Format display string */
function formatDisplay(
  hours: number,
  minutes: number,
  period: "AM" | "PM"
): string {
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
}

// ==================== Sub-component: Scroll Column ====================

function TimeColumn({
  value,
  onUp,
  onDown,
  min,
  max,
  padStart = 2,
}: {
  value: number;
  onUp: () => void;
  onDown: () => void;
  min: number;
  max: number;
  padStart?: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full opacity-60 hover:opacity-100"
        onClick={onUp}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <div className="flex h-11 w-12 items-center justify-center rounded-lg bg-muted text-lg font-semibold tabular-nums">
        {value.toString().padStart(padStart, "0")}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full opacity-60 hover:opacity-100"
        onClick={onDown}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ==================== Component ====================

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse incoming value
  const parsed = value
    ? to12Hour(value)
    : { hours: 9, minutes: 0, period: "AM" as const };
  const [hours, setHours] = useState(parsed.hours);
  const [minutes, setMinutes] = useState(parsed.minutes);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  // Sync with external value
  useEffect(() => {
    if (value) {
      const p = to12Hour(value);
      setHours(p.hours);
      setMinutes(p.minutes);
      setPeriod(p.period);
    }
  }, [value]);

  // Apply changes
  const apply = useCallback(() => {
    const result = to24Hour(hours, minutes, period);
    onChange(result);
    setOpen(false);
  }, [hours, minutes, period, onChange]);

  const displayText = value
    ? formatDisplay(parsed.hours, parsed.minutes, parsed.period)
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          {displayText || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          {/* Time selectors */}
          <div className="flex items-center gap-1">
            {/* Hours */}
            <TimeColumn
              value={hours}
              onUp={() => setHours((h) => (h >= 12 ? 1 : h + 1))}
              onDown={() => setHours((h) => (h <= 1 ? 12 : h - 1))}
              min={1}
              max={12}
            />

            {/* Separator */}
            <span className="text-2xl font-bold text-muted-foreground px-1">:</span>

            {/* Minutes */}
            <TimeColumn
              value={minutes}
              onUp={() => setMinutes((m) => (m >= 55 ? 0 : m + 5))}
              onDown={() => setMinutes((m) => (m <= 0 ? 55 : m - 5))}
              min={0}
              max={59}
            />

            {/* AM/PM */}
            <div className="ml-2 flex flex-col gap-1">
              <Button
                type="button"
                variant={period === "AM" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 w-12 text-xs font-semibold",
                  period === "AM" && "bg-primary text-primary-foreground shadow-sm"
                )}
                onClick={() => setPeriod("AM")}
              >
                AM
              </Button>
              <Button
                type="button"
                variant={period === "PM" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 w-12 text-xs font-semibold",
                  period === "PM" && "bg-primary text-primary-foreground shadow-sm"
                )}
                onClick={() => setPeriod("PM")}
              >
                PM
              </Button>
            </div>
          </div>

          {/* Preview + Apply */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Selected:</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatDisplay(hours, minutes, period)}
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              className="min-w-[80px]"
              onClick={apply}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
