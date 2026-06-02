/**
 * Purpose: Next.js proxy for route protection and auth checks
 * Responsibility: Protect API routes by verifying JWT tokens
 * Important Notes:
 *   - Runs on Edge Runtime — must use jose (not jsonwebtoken) for JWT verify
 *   - ONLY protects API routes — page routes are handled client-side by AuthProvider
 *   - Token read from Authorization header (primary) or access_token cookie (fallback)
 *   - Uses centralized error codes from @/lib/http and @/lib/api-response
 *   - Page route auth is handled by AuthProvider + route groups — no server redirects
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { HTTP_STATUS, ERROR_CODES, HTTP_MESSAGES } from "@/lib/http";

// ==================== CONFIG ====================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nikharta-roop-jwt-secret-change-in-production-min-32-chars"
);

// API routes that DON'T require authentication (exact match + prefix)
const PUBLIC_API_ROUTES = [
  // Auth
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/auth/refresh",
  "/api/auth/register-email",
  "/api/auth/login-email",
  "/api/auth/google",
  "/api/api-spec",            // OpenAPI spec JSON
  // Public GET endpoints — listing & detail views
  "/api/branches",            // Branch listing & detail (public)
  "/api/services",            // Service listing & detail (public)
  "/api/service-categories",  // Service category listing (public)
  "/api/packages",            // Package listing & detail (public)
  "/api/staff",               // Staff listing & detail (public)
  "/api/reviews",             // Reviews listing & detail (public)
  "/api/offers",              // Offers listing & detail (public)
  "/api/offers/validate",     // Validate promo code (public)
  "/api/product-categories",  // Product category listing (public)
  "/api/products",            // Product listing & detail (public)
  "/api/portfolio",           // Portfolio listing (public)
  "/api/blog",                // Blog categories & posts (public)
  "/api/slots",               // Slot availability (public)
];

// Routes that require specific roles (API only)
const ADMIN_API_ROUTES = ["/api/admin"];
const STAFF_API_ROUTES = ["/api/staff"];

// ==================== HELPER ====================

function matchesAny(pathname: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) => pathname === pattern || pathname.startsWith(pattern + "/")
  );
}

async function getTokenPayload(request: NextRequest) {
  // Try Authorization header first (API calls from client)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: "nikharta-roop",
        audience: "nikharta-roop-api",
      });
      return {
        userId: payload.userId as string,
        role: payload.role as string,
        sessionId: payload.sessionId as string,
      };
    } catch {
      return null;
    }
  }

  // Try cookie (fallback for page navigation or when header not set)
  const tokenFromCookie = request.cookies.get("access_token")?.value;
  if (tokenFromCookie) {
    try {
      const { payload } = await jwtVerify(tokenFromCookie, JWT_SECRET, {
        issuer: "nikharta-roop",
        audience: "nikharta-roop-api",
      });
      return {
        userId: payload.userId as string,
        role: payload.role as string,
        sessionId: payload.sessionId as string,
      };
    } catch {
      return null;
    }
  }

  return null;
}

// ==================== PROXY ====================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static files and internal Next.js routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Non-API routes (pages, etc.) — always allow through
  //    Auth for pages is handled client-side by AuthProvider + route groups
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 3. Allow public API routes without auth
  if (matchesAny(pathname, PUBLIC_API_ROUTES)) {
    // Auth routes allow all methods (POST for login/register)
    if (pathname.startsWith("/api/auth/") || pathname === "/api/api-spec") {
      return NextResponse.next();
    }
    // Data endpoints: only GET is public, POST/PATCH/DELETE require auth
    if (request.method === "GET") {
      return NextResponse.next();
    }
  }

  // 4. For protected API routes — verify token
  const payload = await getTokenPayload(request);

  if (!payload) {
    return NextResponse.json(
      {
        success: false,
        error: ERROR_CODES.AUTH_MISSING_TOKEN,
        message: HTTP_MESSAGES.AUTH_MISSING_TOKEN.messageEn,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  // 5. Role-based access for admin API routes
  if (matchesAny(pathname, ADMIN_API_ROUTES)) {
    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.PERM_ADMIN_REQUIRED,
          message: HTTP_MESSAGES.PERM_ADMIN_REQUIRED.messageEn,
          statusCode: HTTP_STATUS.FORBIDDEN,
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }
  }

  // 6. Role-based access for staff API routes
  if (matchesAny(pathname, STAFF_API_ROUTES)) {
    if (payload.role !== "STAFF" && payload.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.PERM_STAFF_REQUIRED,
          message: HTTP_MESSAGES.PERM_STAFF_REQUIRED.messageEn,
          statusCode: HTTP_STATUS.FORBIDDEN,
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }
  }

  // 7. Token valid and role authorized — proceed
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-session-id", payload.sessionId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// ==================== MATCHER CONFIG ====================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
