/**
 * Purpose: Utility functions for Nikharta Roop application
 * Responsibility: Pure, framework-independent helper functions
 * Important Notes: No React imports, no side effects, deterministic output
 */

// ==================== Currency Formatting ====================

// Cache Intl formatters — avoid rebuilding on every call
const currencyFormatter = new Intl.NumberFormat("hi-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const hindiDateFormatter = new Intl.DateTimeFormat("hi-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Format a number as Indian Rupee currency string
 * Example: formatCurrency(2500) → "₹2,500"
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

// ==================== Date Formatting ====================

/**
 * Format a date string in Hindi format
 * Example: formatHindiDate("2024-12-15") → "रविवार, 15 दिसंबर 2024"
 */
export function formatHindiDate(dateStr: string): string {
  const date = new Date(dateStr);
  return hindiDateFormatter.format(date);
}

/**
 * Format time in Hindi 12-hour format
 * Example: formatHindiTime("14:30") → "दोपहर 2:30 बजे"
 */
export function formatHindiTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "दोपहर" : "सुबह";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${period} ${displayHours}:${minutes.toString().padStart(2, "0")} बजे`;
}

// ==================== Mobile Validation ====================

/**
 * Validate Indian mobile number (10 digits, starts with 6-9)
 */
export function isValidIndianMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

// ==================== OTP Generation ====================

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==================== Booking ID Generation ====================

/**
 * Generate a human-readable booking ID
 * Example: "BK-2024-00123"
 */
export function generateBookingId(sequence: number): string {
  const year = new Date().getFullYear();
  return `BK-${year}-${sequence.toString().padStart(5, "0")}`;
}

// ==================== Slot Calculation ====================

/**
 * Generate all possible 30-minute slots for a given time range
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + intervalMinutes <= endMinutes) {
    const slotStart = formatMinutesToTime(currentMinutes);
    const slotEnd = formatMinutesToTime(currentMinutes + intervalMinutes);
    slots.push({ start: slotStart, end: slotEnd });
    currentMinutes += intervalMinutes;
  }

  return slots;
}

/**
 * Convert minutes since midnight to "HH:MM" format
 */
function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// ==================== Duration Formatting ====================

/**
 * Format duration in minutes to Hindi string
 * Example: formatDuration(60) → "1 घंटा", formatDuration(45) → "45 मिनट"
 */
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    const hourStr = hours === 1 ? "1 घंटा" : `${hours} घंटे`;
    if (remaining > 0) {
      return `${hourStr} ${remaining} मिनट`;
    }
    return hourStr;
  }
  return `${minutes} मिनट`;
}

// ==================== Discount Calculation ====================

/**
 * Calculate discount amount based on type
 */
export function calculateDiscount(
  price: number,
  discountType: "PERCENTAGE" | "FLAT_AMOUNT",
  discountValue: number,
  maxDiscount: number | null = null
): number {
  let discount: number;

  if (discountType === "PERCENTAGE") {
    discount = (price * discountValue) / 100;
  } else {
    discount = discountValue;
  }

  if (maxDiscount !== null && discount > maxDiscount) {
    discount = maxDiscount;
  }

  return Math.min(discount, price);
}

// ==================== Rating Display ====================

/**
 * Generate star display string from rating number
 */
export function ratingToStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "✩" : "") + "☆".repeat(empty);
}
