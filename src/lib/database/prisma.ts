/**
 * Purpose: Prisma Client singleton for Nikharta Roop
 * Responsibility: Prevent multiple Prisma Client instances in development (hot reload)
 * Important Notes:
 *   - In dev, Next.js hot reloads modules — without singleton, connection pool exhaustion
 *   - In production, a single instance is created and reused
 *   - Always import: import { prisma } from "@/lib/database/prisma"
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
