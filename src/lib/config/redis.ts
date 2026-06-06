/**
 * Purpose: Redis client singleton for Nikharta Roop
 * Responsibility: Single Redis connection reused across the app
 * Important Notes:
 *   - Uses ioredis — production-grade Redis client with clustering support
 *   - Connection is lazy — connects on first command
 *   - Auto-reconnects on connection loss
 *   - In development, singleton pattern prevents multiple connections from hot reload
 */

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// ==================== SINGLETON ====================

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    // Connection settings
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000); // Max 5s between retries
      return delay;
    },

    // Lazy connection — don't block startup
    lazyConnect: true,

    // Keep alive
    keepAlive: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// ==================== HELPER ====================

/**
 * Check if Redis is connected and responsive
 * Use for health checks
 */
async function _isRedisHealthy(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}
