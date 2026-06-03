/**
 * Purpose: Re-export of Prisma Client singleton from the canonical location
 * Responsibility: Backward compatibility — many routes still import from "@/lib/prisma"
 * Important Notes:
 *   - The actual singleton is in "@/lib/database/prisma"
 *   - This file re-exports it so existing imports continue to work
 *   - New code should import from "@/lib/database/prisma" directly
 */

export { prisma } from "./database/prisma";
