/**
 * Purpose: Device detection and User-Agent parsing
 * Responsibility: Extract device info from request headers for session tracking
 * Important Notes:
 *   - Parses User-Agent string to extract browser, OS, device type
 *   - Used when creating sessions — shows in "Active Devices" UI
 *   - Also extracts IP and geo info from headers
 */

import { NextRequest } from "next/server";
import type { DeviceInfo } from "@/shared/types/auth";

// ==================== USER-AGENT PARSING ====================

/**
 * Parse User-Agent string into structured device info
 * Simple regex-based parsing — no external dependency needed
 * For production, consider using `ua-parser-js` for more accuracy
 */
export function parseUserAgent(ua: string): DeviceInfo {
  let browser: string | null = null;
  let os: string | null = null;
  let deviceType: DeviceInfo["deviceType"] = "unknown";
  let deviceName: string | null = null;

  // ---- OS Detection ----
  if (/Windows NT/i.test(ua)) {
    os = "Windows";
  } else if (/Mac OS X/i.test(ua)) {
    os = "macOS";
  } else if (/Android/i.test(ua)) {
    os = "Android";
    const match = ua.match(/Android\s([\d.]+)/);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
    deviceName = /iPad/i.test(ua) ? "iPad" : "iPhone";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
  }

  // ---- Browser Detection (order matters — check specific first) ----
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = match ? `Edge ${match[1].split(".")[0]}` : "Edge";
  } else if (/OPR|Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Firefox/i.test(ua)) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = match ? `Firefox ${match[1].split(".")[0]}` : "Firefox";
  } else if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = match ? `Chrome ${match[1].split(".")[0]}` : "Chrome";
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = match ? `Safari ${match[1].split(".")[0]}` : "Safari";
  }

  // ---- Device Type ----
  if (/Mobile|iPhone|Android.*Mobile/i.test(ua)) {
    deviceType = "mobile";
  } else if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) {
    deviceType = "tablet";
  } else if (/Windows|Mac|Linux|CrOS/i.test(ua)) {
    deviceType = "desktop";
  }

  // ---- Device Name (best effort) ----
  if (!deviceName) {
    if (deviceType === "desktop") {
      deviceName = `${os || "Unknown"} ${browser || "Browser"}`;
    } else if (deviceType === "mobile") {
      deviceName = `${os || "Mobile"} ${browser || "Browser"}`;
    } else if (deviceType === "tablet") {
      deviceName = `${os || "Tablet"} ${browser || "Browser"}`;
    }
  }

  return {
    deviceName,
    deviceType,
    browser,
    os,
    userAgent: ua,
  };
}

// ==================== IP EXTRACTION ====================

/**
 * Extract client IP from request headers
 * Checks x-forwarded-for (proxy/load balancer) then x-real-ip
 */
export function extractClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated — first is the client
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? null;
}

// ==================== GEO (STUB) ====================

/**
 * Get country/city from IP — currently stubbed
 * In production, use MaxMind GeoIP2 or Cloudflare headers
 */
export function extractGeoFromIp(ip: string | null): {
  country: string | null;
  city: string | null;
} {
  // TODO: Integrate MaxMind GeoIP2 or similar
  // For now, check Cloudflare headers if available
  if (!ip) return { country: null, city: null };

  return {
    country: null,
    city: null,
  };
}
