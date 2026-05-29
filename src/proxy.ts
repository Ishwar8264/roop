/**
 * Purpose: Next.js middleware for route protection and auth checks
 * Responsibility: Intercept requests to protected routes and verify JWT tokens
 * Important Notes:
 *   - Runs on Edge Runtime — must use jose (not jsonwebtoken) for JWT verify
 *   - Public routes: /, /api/auth/*, /services, /about, /api-docs
 *   - Protected routes: /bookings/*, /profile/*, /admin/*
 *   - Admin routes: require role=ADMIN in JWT
 *   - Staff routes: require role=STAFF or ADMIN
 *   - Proxy runs BEFORE page renders and BEFORE API route handlers
 *   - Token read from Authorization header (API) or cookie (future: web pages)
 *   - Uses centralized error codes from @/lib/http and @/lib/api-response
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { HTTP_STATUS, ERROR_CODES, HTTP_MESSAGES } from "@/lib/http";

// ==================== CONFIG ====================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nikharta-roop-jwt-secret-change-in-production-min-32-chars"
);

// Routes that DON'T require authentication
const PUBLIC_ROUTES = [
  "/",                    // Welcome page
  "/services",            // Service listing (public)
  "/about",               // About page (public)
  "/contact",             // Contact page (public)
  "/blog",                // Blog listing (public)
  "/offers",              // Public offers page
  "/api-docs",            // Swagger UI documentation
];

// API routes that DON'T require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/auth/refresh",
  "/api/auth/register-email",
  "/api/auth/login-email",
  "/api/auth/google",
  "/api/api-spec",        // OpenAPI spec JSON
];

// Routes that require specific roles
const ADMIN_ROUTES = ["/admin"];
const STAFF_ROUTES = ["/staff"];

// ==================== HELPER ====================

/**
 * Check if a path matches any pattern in the list
 * Supports exact match and prefix match (e.g., "/admin" matches "/admin/dashboard")
 */
function matchesAny(pathname: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) => pathname === pattern || pathname.startsWith(pattern + "/")
  );
}

/**
 * Extract and verify JWT token from request
 * Checks Authorization header first, then cookies (for web page navigation)
 */
async function getTokenPayload(request: NextRequest) {
  // Try Authorization header first (API calls)
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

  // Try cookie (web page navigation)
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
    pathname.includes(".") // Static files (images, CSS, JS)
  ) {
    return NextResponse.next();
  }

  // 2. Allow public pages without auth
  if (matchesAny(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // 3. Allow public API routes without auth
  if (matchesAny(pathname, PUBLIC_API_ROUTES)) {
    return NextResponse.next();
  }

  // 4. For protected routes — verify token
  const payload = await getTokenPayload(request);

  if (!payload) {
    // API routes → return 401 JSON (using centralized error codes)
    if (pathname.startsWith("/api/")) {
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

    // Web pages → redirect to login (future)
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Role-based access control for admin routes
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (payload.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
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
      // Non-admin trying to access admin pages → redirect home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 6. Role-based access control for staff routes
  if (matchesAny(pathname, STAFF_ROUTES)) {
    if (payload.role !== "STAFF" && payload.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
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
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 7. Token valid and role authorized — proceed
  // Add user info to request headers for downstream use
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
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     *
     * This ensures middleware runs on:
     * - All page routes (/bookings, /admin, etc.)
     * - All API routes (/api/*)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
