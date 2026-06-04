/**
 * Purpose: Time Picker component with hours/minutes/AM-PM selection
 * Responsibility: Provide a clean, professional time picker for forms
 * Important Notes:
 *   - 12-hour format with AM/PM toggle
 *   - Returns "HH:MM" 24-hour format for API
 *   - Used in BranchForm (openTime, closeTime) and StaffForm (workStart, workEnd)
 *   - Integrates with react-hook-form via FormField
 *   - Scroll-wheel design with clean visual style
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { Clock } from "lucide-react";
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

// ==================== Sub-component: Scroll Wheel Item ====================

function ScrollItem({
  items,
  selectedIndex,
  onSelect,
}: {
  items: { label: string; value: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to selected item on mount and when selectedIndex changes
  // Using layout effect via ref callback to avoid setState in effect
  const scrollToSelected = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        const itemHeight = 40;
        node.scrollTop = selectedIndex * itemHeight;
      }
    },
    [selectedIndex]
  );

  return (
    <div
      ref={(node) => {
        (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        scrollToSelected(node);
      }}
      className="h-[120px] overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="py-[40px]">
        {items.map((item, i) => (
          <button
            key={item.value}
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-center text-base font-medium snap-start transition-colors rounded-md",
              i === selectedIndex
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={() => onSelect(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
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
  // Track local edits separately so external value changes don't conflict
  const [localEdits, setLocalEdits] = useState<{
    hours: number;
    minutes: number;
    period: "AM" | "PM";
  } | null>(null);

  // Parse external value for display (when no local edits)
  const parsed = value ? to12Hour(value) : { hours: 9, minutes: 0, period: "AM" as const };

  // Use local edits when popover is open, otherwise use parsed value
  const hours = localEdits?.hours ?? parsed.hours;
  const minutes = localEdits?.minutes ?? parsed.minutes;
  const period = localEdits?.period ?? parsed.period;

  const setHours = useCallback((h: number) => {
    setLocalEdits((prev) => ({ ...prev!, hours: h, period: prev?.period ?? "AM", minutes: prev?.minutes ?? 0 }));
  }, []);

  const setMinutes = useCallback((m: number) => {
    setLocalEdits((prev) => ({ ...prev!, minutes: m, period: prev?.period ?? "AM", hours: prev?.hours ?? 9 }));
  }, []);

  const setPeriod = useCallback((p: "AM" | "PM") => {
    setLocalEdits((prev) => ({ ...prev!, period: p, hours: prev?.hours ?? 9, minutes: prev?.minutes ?? 0 }));
  }, []);

  // Generate hour items (1-12)
  const hourItems = Array.from({ length: 12 }, (_, i) => ({
    label: (i + 1).toString().padStart(2, "0"),
    value: i + 1,
  }));

  // Generate minute items (0, 5, 10, ..., 55)
  const minuteItems = Array.from({ length: 12 }, (_, i) => ({
    label: (i * 5).toString().padStart(2, "0"),
    value: i * 5,
  }));

  const selectedHourIndex = hourItems.findIndex((h) => h.value === hours);
  const selectedMinuteIndex = minuteItems.findIndex((m) => m.value === minutes);

  // Apply changes
  const apply = useCallback(() => {
    const result = to24Hour(hours, minutes, period);
    onChange(result);
    setLocalEdits(null);
    setOpen(false);
  }, [hours, minutes, period, onChange]);

  // Handle popover open change
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Initialize local edits from current value
      setLocalEdits({ hours: parsed.hours, minutes: parsed.minutes, period: parsed.period });
    } else {
      // Clear local edits when closing
      setLocalEdits(null);
    }
  }, [parsed]);

  const displayText = value
    ? formatDisplay(parsed.hours, parsed.minutes, parsed.period)
    : "";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {/* Time selectors — scroll wheel style */}
          <div className="relative flex items-center justify-center gap-1">
            {/* Hours scroll */}
            <div className="w-16 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Hour
              </p>
              <ScrollItem
                items={hourItems}
                selectedIndex={selectedHourIndex >= 0 ? selectedHourIndex : 0}
                onSelect={(i) => setHours(hourItems[i].value)}
              />
            </div>

            {/* Separator */}
            <span className="text-2xl font-bold text-muted-foreground pt-5">:</span>

            {/* Minutes scroll */}
            <div className="w-16 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Min
              </p>
              <ScrollItem
                items={minuteItems}
                selectedIndex={selectedMinuteIndex >= 0 ? selectedMinuteIndex : 0}
                onSelect={(i) => setMinutes(minuteItems[i].value)}
              />
            </div>

            {/* AM/PM Toggle */}
            <div className="ml-2 pt-5">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className={cn(
                    "flex h-10 w-12 items-center justify-center rounded-lg text-sm font-semibold transition-all border",
                    period === "AM"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                  onClick={() => setPeriod("AM")}
                >
                  AM
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex h-10 w-12 items-center justify-center rounded-lg text-sm font-semibold transition-all border",
                    period === "PM"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                  onClick={() => setPeriod("PM")}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Preview + Apply */}
          <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Selected</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatDisplay(hours, minutes, period)}
            </span>
          </div>

          <div className="mt-3 flex justify-end">
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
