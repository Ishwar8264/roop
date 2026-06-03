/**
 * Purpose: Standardized API route handler for Nikharta Roop
 * Responsibility: Wrap every API route with try/catch, validation, and consistent responses
 * Important Notes:
 *   - EVERY API route MUST use createApiHandler() — never write raw route handlers
 *   - Automatically catches AppError subclasses and returns proper JSON
 *   - Validates input with Zod schema before handler runs
 *   - Logs unexpected errors (non-operational) for debugging
 *   - Returns consistent { success, data/error, message, statusCode } format
 *   - Replaces the need for try/catch in every route handler
 *
 * Usage:
 *   export const POST = createApiHandler({
 *     schema: sendOtpSchema,
 *     handler: async ({ parsedBody, request }) => {
 *       // Your business logic here — no try/catch needed
 *       // Throw AppError subclasses for expected errors
 *       // Return any data for success response
 *     },
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { AppError, isAppError, toAppError } from "./errors";
import { HTTP_STATUS } from "./http";

// ==================== TYPES ====================

/** Context passed to every API handler */
export interface ApiContext<T = unknown> {
  /** Validated and parsed request body (from Zod schema) */
  parsedBody: T;
  /** Original Next.js request object */
  request: NextRequest;
}

/** API handler function signature */
export type ApiHandler<T = unknown, R = unknown> = (
  ctx: ApiContext<T>
) => Promise<R>;

/** Custom response builder — allows routes to modify the NextResponse (e.g., set cookies) */
export type ApiResponseBuilder<R = unknown> = (data: R) => NextResponse;

/** Configuration for creating an API route handler */
export interface ApiRouteConfig<T = unknown, R = unknown> {
  /** Zod schema for request body validation — set to null if no body needed */
  schema: ZodSchema<T> | null;
  /** Business logic handler — runs after validation */
  handler: ApiHandler<T, R>;
  /** Success message (optional — auto-set if not provided) */
  successMessage?: string;
  /** Success HTTP status code (default: 200) */
  successStatus?: number;
  /** Custom response builder — override default JSON response (e.g., to set cookies) */
  responseBuilder?: ApiResponseBuilder<R>;
}

// ==================== API HANDLER FACTORY ====================

/**
 * Create a standardized API route handler
 *
 * @example
 * // With body validation:
 * export const POST = createApiHandler({
 *   schema: sendOtpSchema,
 *   handler: async ({ parsedBody }) => {
 *     const { mobile } = parsedBody;
 *     // business logic...
 *     return { mobile, expiresIn: 300 };
 *   },
 *   successMessage: "OTP sent successfully",
 * });
 *
 * @example
 * // Without body (e.g., GET with auth header):
 * export const GET = createApiHandler({
 *   schema: null,
 *   handler: async ({ request }) => {
 *     // extract from headers, query params, etc.
 *     return { user: "..." };
 *   },
 * });
 */
export function createApiHandler<T = unknown, R = unknown>(
  config: ApiRouteConfig<T, R>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Parse and validate request body (if schema provided)
      let parsedBody: T | null = null;

      if (config.schema) {
        try {
          const body = await request.json();
          const result = config.schema.safeParse(body);

          if (!result.success) {
            const firstIssue = result.error.issues[0];
            const fieldPath = firstIssue.path.join(".");
            const message = fieldPath
              ? `${fieldPath}: ${firstIssue.message}`
              : firstIssue.message;

            return NextResponse.json(
              {
                success: false,
                error: "VAL_INVALID_INPUT",
                message,
                statusCode: HTTP_STATUS.BAD_REQUEST,
              },
              { status: HTTP_STATUS.BAD_REQUEST }
            );
          }

          parsedBody = result.data;
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: "VAL_INVALID_INPUT",
              message: "Invalid JSON in request body.",
              statusCode: HTTP_STATUS.BAD_REQUEST,
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }
      }

      // 2. Run the handler
      const data = await config.handler({
        parsedBody: parsedBody as T,
        request,
      });

      // 3. Return success response
      if (config.responseBuilder) {
        return config.responseBuilder(data);
      }

      return NextResponse.json(
        {
          success: true,
          data,
          ...(config.successMessage && { message: config.successMessage }),
        },
        { status: config.successStatus || HTTP_STATUS.OK }
      );
    } catch (error: unknown) {
      // 4. Handle known AppError subclasses
      if (isAppError(error)) {
        const response: Record<string, unknown> = {
          success: false,
          error: error.code,
          message: error.message,
          statusCode: error.statusCode,
        };

        // Add retryAfterSeconds for rate-limited errors
        if (
          "retryAfterSeconds" in error &&
          typeof (error as Record<string, unknown>).retryAfterSeconds === "number"
        ) {
          response.retryAfterSeconds = (error as Record<string, unknown>).retryAfterSeconds;
        }

        // Add field errors for validation errors
        if ("fields" in error && (error as Record<string, unknown>).fields) {
          response.fields = (error as Record<string, unknown>).fields;
        }

        // Log non-operational errors (unexpected failures)
        if (!error.isOperational) {
          console.error(`[NON_OPERATIONAL_ERROR] ${error.code}:`, error);
        }

        const headers: Record<string, string> = {};
        if (response.retryAfterSeconds) {
          headers["Retry-After"] = String(response.retryAfterSeconds);
        }

        return NextResponse.json(response, {
          status: error.statusCode,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });
      }

      // 5. Handle unexpected errors
      const appError = toAppError(error);
      console.error("[UNHANDLED_ERROR]", error);

      return NextResponse.json(
        {
          success: false,
          error: appError.code,
          message: appError.message,
          statusCode: appError.statusCode,
        },
        { status: appError.statusCode }
      );
    }
  };
}
