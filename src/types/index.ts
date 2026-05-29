/**
 * Purpose: Barrel export for all TypeScript types
 * Responsibility: Single import point — `import { User, Booking } from "@/types"`
 * Important Notes:
 *   - Import from "@/types" — never from sub-paths directly
 *   - When adding new domain types, add export here
 */

// ===== Enum types =====
export * from "./enums";

// ===== Common / API types =====
export * from "./common";

// ===== Domain types =====
export * from "./branch";
export * from "./auth";
export * from "./service";
export * from "./staff";
export * from "./booking";
export * from "./payment";
export * from "./product";
