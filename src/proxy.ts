/**
 * Purpose: Next.js proxy for route protection and auth checks
 * Responsibility: Protect API routes by verifying JWT tokens, protect page routes via server-side redirects
 * Important Notes:
 *   - Runs on Edge Runtime — must use jose (not jsonwebtoken) for JWT verify
 *   - Protects API routes via Authorization header / access_token cookie
 *   - Protects page routes via refresh token cookie OR access token cookie (dual check)
 *   - Uses centralized error codes from @/lib/http and @/lib/api-response
 *   - Page route auth redirects replace client-side useEffect redirects (no more hydration flash)
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { HTTP_STATUS, ERROR_CODES, HTTP_MESSAGES } from "@/lib/http";
import { SESSION_CONFIG } from "@/lib/config/auth";

// ==================== CONFIG ====================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nikharta-roop-jwt-secret-change-in-production-min-32-chars"
);

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "nikharta-roop-jwt-refresh-secret-change-in-production-min-32-chars"
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
  "/api/auth/magic-link",
  "/api/auth/verify-magic-link",
  "/api/auth/exchange-code",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
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

// Pages that DON'T require authentication
const PUBLIC_PAGES = ["/", "/login", "/register", "/services", "/auth/callback"];

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

  // Try access_token cookie (fallback for page navigation or when header not set)
  const tokenFromCookie = request.cookies.get(SESSION_CONFIG.ACCESS_TOKEN_COOKIE)?.value;
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

/**
 * Check if user is authenticated by verifying cookies
 * Used for page route protection (server-side redirects)
 *
 * Checks TWO cookies as fallback:
 * 1. nr_refresh_token — long-lived (30 days), primary auth signal
 * 2. nr_access_token — short-lived (15 min), backup when refresh cookie isn't stored
 *
 * Some browsers don't reliably store cookies set via fetch() Set-Cookie headers.
 * The access token cookie serves as a backup for page route authentication.
 */
async function isPageAuthenticated(request: NextRequest): Promise<boolean> {
  // 1. Check refresh token cookie (primary — long-lived)
  const refreshToken = request.cookies.get(SESSION_CONFIG.REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    try {
      await jwtVerify(refreshToken, JWT_REFRESH_SECRET, {
        issuer: "nikharta-roop",
        audience: "nikharta-roop-refresh",
      });
      return true;
    } catch {
      // Token invalid — continue to fallback
    }
  }

  // 2. Check access token cookie (fallback — short-lived)
  const accessToken = request.cookies.get(SESSION_CONFIG.ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    try {
      await jwtVerify(accessToken, JWT_SECRET, {
        issuer: "nikharta-roop",
        audience: "nikharta-roop-api",
      });
      return true;
    } catch {
      // Token invalid — not authenticated
    }
  }

  // Debug: log which cookies are present when auth fails (dev only)
  if (process.env.NODE_ENV === "development") {
    const allCookies = request.cookies.getAll().map(c => c.name);
    console.warn(`[PROXY] Page auth FAILED for ${request.nextUrl.pathname}. Cookies present: [${allCookies.join(", ")}]`);
  }

  return false;
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

  // 2. API route protection
  if (pathname.startsWith("/api/")) {
    // 2a. Allow public API routes without auth
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

    // 2b. For protected API routes — verify token
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

    // 2c. Role-based access for admin API routes
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

    // 2d. Role-based access for staff API routes
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

    // 2e. Token valid and role authorized — proceed
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

  // 3. Page route protection (server-side redirects — no client-side flash)
  const authenticated = await isPageAuthenticated(request);
  const isPublicPage = matchesAny(pathname, PUBLIC_PAGES);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // If authenticated and trying to access login/register → redirect to dashboard
  if (authenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If NOT authenticated and trying to access a protected page → redirect to login
  if (!authenticated && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// ==================== MATCHER CONFIG ====================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo\\.png).*)",
  ],
};
