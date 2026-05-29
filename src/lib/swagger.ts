/**
 * Purpose: OpenAPI 3.0 specification for Nikharta Roop API
 * Responsibility: Complete API documentation with all endpoints, schemas, and examples
 * Important Notes:
 *   - This is the single source of truth for API documentation
 *   - Swagger UI renders this at /api-docs
 *   - next-swagger-doc can generate this from JSDoc comments (optional)
 *   - All schemas reference centralized types from @/types
 */

import type { OpenAPI3 } from "openapi-typescript";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ==================== SHARED SCHEMAS ====================

const ErrorSchema = {
  type: "object",
  required: ["success", "error", "message", "statusCode"],
  properties: {
    success: { type: "boolean", example: false },
    error: { type: "string", example: "AUTH_MISSING_TOKEN", description: "Machine-readable error code" },
    message: { type: "string", example: "Missing authorization token. Please login.", description: "Human-readable error message" },
    statusCode: { type: "integer", example: 401 },
    retryAfterSeconds: { type: "integer", example: 30, description: "Seconds until retry (rate limit errors only)" },
    fields: {
      type: "object",
      additionalProperties: { type: "array", items: { type: "string" } },
      description: "Field-level validation errors",
    },
  },
} as const;

const MobileSchema = {
  type: "string",
  pattern: "^[6-9]\\d{9}$",
  example: "9876543210",
  description: "Indian mobile number — 10 digits starting with 6-9",
};

const OtpSchema = {
  type: "string",
  pattern: "^\\d{6}$",
  example: "123456",
  description: "6-digit OTP",
};

const UserProfileSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "clx1234567890" },
    mobile: { type: "string", example: "9876543210" },
    name: { type: "string", example: "Priya Sharma", nullable: true },
    email: { type: "string", example: "priya@example.com", nullable: true },
    role: { type: "string", enum: ["GUEST", "USER", "STAFF", "ADMIN"], example: "USER" },
    avatarUrl: { type: "string", example: "https://cdn.example.com/avatar.jpg", nullable: true },
    loyaltyPoints: { type: "integer", example: 150 },
  },
} as const;

const TokenPairSchema = {
  type: "object",
  properties: {
    accessToken: { type: "string", description: "JWT access token (15 min expiry)" },
    refreshToken: { type: "string", description: "JWT refresh token (7 day expiry)" },
  },
} as const;

const BearerAuthSchema = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT access token from /api/auth/verify-otp",
} as const;

// ==================== FULL OPENAPI SPEC ====================

export const apiSpec: OpenAPI3 = {
  openapi: "3.0.3",
  info: {
    title: "Nikharta Roop (निखरता रूप) API",
    version: "1.0.0",
    description:
      "Beauty Parlour Booking Platform API — Hindi-first, production-grade REST API. " +
      "Authentication via OTP + JWT. All responses follow consistent { success, data/error, message } format.",
    contact: {
      name: "Nikharta Roop Support",
      email: "support@nikhartaroop.com",
    },
    license: {
      name: "Proprietary",
    },
  },
  servers: [
    {
      url: API_BASE_URL,
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "OTP-based authentication — login, register, token management",
    },
  ],
  paths: {
    // ==================== AUTH ENDPOINTS ====================

    "/api/auth/send-otp": {
      post: {
        tags: ["Auth"],
        summary: "Send OTP to mobile number",
        description:
          "Generate and send a 6-digit OTP to the given mobile number via SMS. " +
          "Rate limited: 1 request per 30 seconds, 5 per hour per mobile. " +
          "Previous unused OTPs are automatically invalidated.",
        operationId: "auth-send-otp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mobile"],
                properties: {
                  mobile: MobileSchema,
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP sent successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["success", "data"],
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        mobile: { type: "string", example: "9876543210" },
                        expiresIn: { type: "integer", example: 300, description: "OTP validity in seconds" },
                        messageId: { type: "string", nullable: true, description: "SMS provider message ID" },
                      },
                    },
                    message: { type: "string", example: "OTP sent successfully." },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid mobile number",
            content: { "application/json": { schema: ErrorSchema } },
          },
          "429": {
            description: "Rate limited — too many OTP requests",
            content: { "application/json": { schema: ErrorSchema } },
            headers: {
              "Retry-After": {
                schema: { type: "integer" },
                description: "Seconds until next allowed request",
              },
            },
          },
          "500": {
            description: "SMS gateway failure",
            content: { "application/json": { schema: ErrorSchema } },
          },
        },
      },
    },

    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP and login/register",
        description:
          "Verify the OTP sent to mobile. If mobile is new, auto-registers as USER. " +
          "Returns JWT access + refresh tokens. Max 3 verification attempts per OTP. " +
          "Session rotation: new AuthSession created on each login.",
        operationId: "auth-verify-otp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mobile", "otp"],
                properties: {
                  mobile: MobileSchema,
                  otp: OtpSchema,
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login/registration successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["success", "data"],
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: UserProfileSchema,
                        tokens: TokenPairSchema,
                        isNewUser: { type: "boolean", example: false, description: "true if auto-registered" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid input or OTP format",
            content: { "application/json": { schema: ErrorSchema } },
          },
          "401": {
            description: "Invalid/expired OTP or max attempts exceeded",
            content: { "application/json": { schema: ErrorSchema } },
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout and invalidate session",
        description:
          "Invalidate the current JWT session by deleting the AuthSession record. " +
          "Requires Bearer token in Authorization header.",
        operationId: "auth-logout",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["success", "data"],
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        sessionId: { type: "string", example: "clx1234567890" },
                      },
                    },
                    message: { type: "string", example: "Logged out successfully." },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: ErrorSchema } },
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user profile",
        description:
          "Returns the profile of the currently authenticated user. " +
          "Verifies JWT token, checks session validity, and confirms user is active.",
        operationId: "auth-me",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["success", "data"],
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "clx1234567890" },
                            mobile: { type: "string", example: "9876543210" },
                            name: { type: "string", example: "Priya Sharma", nullable: true },
                            email: { type: "string", example: "priya@example.com", nullable: true },
                            role: { type: "string", enum: ["GUEST", "USER", "STAFF", "ADMIN"], example: "USER" },
                            branchId: { type: "string", nullable: true },
                            avatarUrl: { type: "string", nullable: true },
                            loyaltyPoints: { type: "integer", example: 150 },
                            isActive: { type: "boolean", example: true },
                            lastLoginAt: { type: "string", format: "date-time", nullable: true },
                            createdAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Missing/invalid token or session expired",
            content: { "application/json": { schema: ErrorSchema } },
          },
          "404": {
            description: "User not found",
            content: { "application/json": { schema: ErrorSchema } },
          },
        },
      },
    },

    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh JWT tokens",
        description:
          "Exchange a valid refresh token for new access + refresh tokens. " +
          "Session rotation: old session is deleted and a new one is created. " +
          "If user is suspended, all sessions are invalidated.",
        operationId: "auth-refresh",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: {
                    type: "string",
                    description: "JWT refresh token from previous login/refresh",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens refreshed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["success", "data"],
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        tokens: TokenPairSchema,
                      },
                    },
                    message: { type: "string", example: "Token refreshed successfully." },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid input — missing refreshToken",
            content: { "application/json": { schema: ErrorSchema } },
          },
          "401": {
            description: "Invalid/expired refresh token or suspended account",
            content: { "application/json": { schema: ErrorSchema } },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: BearerAuthSchema,
    },
    schemas: {
      Error: ErrorSchema,
      UserProfile: UserProfileSchema,
      TokenPair: TokenPairSchema,
    },
  },
};

// ==================== HELPER ====================

/** Get the spec as JSON — used by the Swagger UI route */
export function getApiSpecJson(): string {
  return JSON.stringify(apiSpec, null, 2);
}
