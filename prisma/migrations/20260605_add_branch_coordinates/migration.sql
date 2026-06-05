/**
 * Purpose: Add optional branch GPS coordinate columns
 * Responsibility: Keep the branches table aligned with the Prisma Branch model
 * Important Notes:
 *   - Idempotent for local databases that were created before this migration existed
 */

ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
