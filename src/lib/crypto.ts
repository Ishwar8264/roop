/**
 * Purpose: Cryptographic utility functions for Nikharta Roop API
 * Responsibility: Centralize all crypto operations — no duplication across routes
 * Important Notes:
 *   - hashTokenSha256 was previously duplicated in verify-otp and refresh routes
 *   - Now imported from here: `import { hashTokenSha256 } from "@/lib/crypto"`
 */

/**
 * Hash a token string using SHA-256
 * Used for storing session token hashes in the database
 * Web Crypto API — works in Edge Runtime
 */
export async function hashTokenSha256(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
