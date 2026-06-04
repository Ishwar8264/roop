/**
 * Purpose: Time Picker component with hours/minutes/AM-PM selection
 * Responsibility: Provide a shadcn-style time picker for forms
 * Important Notes:
 *   - 12-hour format with AM/PM toggle
 *   - Returns "HH:MM" 24-hour format for API
 *   - Used in BranchForm (openTime, closeTime) and StaffForm (workStart, workEnd)
 *   - Integrates with react-hook-form via FormField
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
function to12Hour(time24: string): { hours: number; minutes: number; period: "AM" | "PM" } {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
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
function formatDisplay(hours: number, minutes: number, period: "AM" | "PM"): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
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
  const parsed = value ? to12Hour(value) : { hours: 9, minutes: 0, period: "AM" as const };
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
  const apply = () => {
    const result = to24Hour(hours, minutes, period);
    onChange(result);
    setOpen(false);
  };

  const displayText = value ? formatDisplay(parsed.hours, parsed.minutes, parsed.period) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayText || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center gap-2">
          {/* Hours */}
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setHours((h) => (h >= 12 ? 1 : h + 1))}
            >
              ↑
            </Button>
            <Input
              type="number"
              min={1}
              max={12}
              value={hours}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 1 && v <= 12) setHours(v);
              }}
              className="w-14 text-center h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setHours((h) => (h <= 1 ? 12 : h - 1))}
            >
              ↓
            </Button>
          </div>

          <span className="text-lg font-bold">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setMinutes((m) => (m >= 55 ? 0 : m + 5))}
            >
              ↑
            </Button>
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 0 && v <= 59) setMinutes(v);
              }}
              className="w-14 text-center h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setMinutes((m) => (m <= 0 ? 55 : m - 5))}
            >
              ↓
            </Button>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant={period === "AM" ? "default" : "outline"}
              size="sm"
              className={cn("h-7 text-xs", period === "AM" && "bg-primary text-primary-foreground")}
              onClick={() => setPeriod("AM")}
            >
              AM
            </Button>
            <Button
              type="button"
              variant={period === "PM" ? "default" : "outline"}
              size="sm"
              className={cn("h-7 text-xs", period === "PM" && "bg-primary text-primary-foreground")}
              onClick={() => setPeriod("PM")}
            >
              PM
            </Button>
          </div>
        </div>

        {/* Apply */}
        <div className="mt-3 flex justify-end">
          <Button type="button" size="sm" className="bg-primary text-primary-foreground" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
