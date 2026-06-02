/**
 * Purpose: Shared utility functions — safe for both server and client
 * Responsibility: Common helpers used across the entire application
 */

// ==================== PHONE ====================

/** Normalize Indian phone number — strip +91, spaces, dashes */
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-\+]/g, "");
  if (normalized.startsWith("91") && normalized.length === 12) {
    normalized = normalized.slice(2);
  }
  return normalized;
}

/** Check if phone is valid Indian mobile (10 digits, starts with 6-9) */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizePhone(phone));
}

// ==================== EMAIL ====================

/** Basic email validation — Zod does the heavy lifting, this is for quick checks */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==================== MASKING ====================

/** Mask phone for display: 9876543210 → 98****3210 */
export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) return "***";
  return `${normalized.slice(0, 2)}****${normalized.slice(6)}`;
}

/** Mask email for display: user@example.com → u***@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}***@${domain}`;
}

// ==================== MISC ====================

/** Sleep for debugging/testing — DO NOT use in production code */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
