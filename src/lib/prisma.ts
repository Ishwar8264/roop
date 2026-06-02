/**
 * Purpose: Prisma Client singleton for Nikharta Roop
 * Responsibility: Prevent multiple Prisma Client instances in development (hot reload)
 * Important Notes:
 *   - In development, Next.js hot reloads modules — without singleton,
 *     every hot reload creates a new PrismaClient → connection pool exhaustion
 *   - In production, a single instance is created and reused
 *   - Always import from here: import { prisma } from "@/lib/prisma"
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
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
