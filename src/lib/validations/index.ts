/**
 * Purpose: Barrel export for all validation schemas
 * Responsibility: Single import point for all Zod schemas across the app
 * Important Notes:
 *   - Import from "@/lib/validations" — don't import from sub-paths directly
 *   - When adding new feature schemas, add export here
 */

// Common reusable primitives
export * from "./common";

// Feature-specific schemas
export * from "./auth";
