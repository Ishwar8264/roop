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
export * from "./packages";
export * from "./consultations";
export * from "./notifications";
export * from "./addresses";
export * from "./product-categories";
export * from "./products";
export * from "./inventory";
export * from "./expenses";
export * from "./commissions";
export * from "./revenue";
export * from "./portfolio";
export * from "./blog";
export * from "./branches";
export * from "./users";
export * from "./service-categories";
export * from "./services";
export * from "./staff";
export * from "./slots";
export * from "./bookings";
export * from "./offers";
export * from "./payments";
export * from "./reviews";
export * from "./loyalty";
