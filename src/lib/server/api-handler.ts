/**
 * Purpose: Standardized API route handler
 * Responsibility: Wrap every API route with try/catch, validation, and consistent responses
 * Important Notes:
 *   - EVERY API route MUST use createApiHandler() — never write raw route handlers
 *   - Automatically catches AppError subclasses and returns proper JSON
 *   - Validates input with Zod schema before handler runs
 *   - Supports POST, PATCH, GET methods
 *   - Supports custom auth hooks (requireAuth, requireAuthWithSession)
 *   - Supports custom response builder (for cookies, redirects, etc.)
 *   - Returns consistent { success, data/error, message, statusCode } format
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { AppError as _AppError, isAppError, toAppError } from "./errors";
import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";

// ==================== TYPES ====================

export interface ApiContext<T = unknown> {
  parsedBody: T;
  request: NextRequest;
  /** Authenticated user payload (if authHook was provided) */
  auth?: {
    payload: { userId: string; role: string; sessionId: string };
    user?: { id: string; isActive: boolean; role: string };
  };
}

export type ApiHandler<T = unknown, R = unknown> = (
  ctx: ApiContext<T>
) => Promise<Awaited<R>>;

export interface ApiRouteConfig<T = unknown, R = unknown> {
  /** Zod schema for request body validation. null = skip validation (GET/cookie routes) */
  schema: ZodSchema<T> | null;
  /** The actual handler logic */
  handler: ApiHandler<T, R>;
  /** Success message to include in response */
  successMessage?: string;
  /** HTTP status code for success (default: 200) */
  successStatus?: number;
  /** Auth hook — run before handler. Injects ctx.auth */
  authHook?: (request: NextRequest) => Promise<{
    payload: { userId: string; role: string; sessionId: string };
    user?: { id: string; isActive: boolean; role: string };
  }>;
  /** Custom response builder — override default JSON response */
  responseBuilder?: (data: Awaited<R>, ctx: ApiContext<T>) => Promise<NextResponse> | NextResponse;
}

// ==================== HANDLER FACTORY ====================

export function createApiHandler<T = unknown, R = unknown>(
  config: ApiRouteConfig<T, R>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Run auth hook if provided
      let auth: ApiContext<T>["auth"] = undefined;
      if (config.authHook) {
        auth = await config.authHook(request);
      }

      // 2. Parse and validate request body
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
                error: ERROR_CODES.VAL_INVALID_INPUT,
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
              error: ERROR_CODES.VAL_INVALID_INPUT,
              message: "Invalid JSON in request body.",
              statusCode: HTTP_STATUS.BAD_REQUEST,
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }
      }

      // 3. Build context
      const ctx: ApiContext<T> = {
        parsedBody: parsedBody as T,
        request,
        auth,
      };

      // 4. Run the handler
      const data = await config.handler(ctx);

      // 5. Use custom response builder if provided
      if (config.responseBuilder) {
        return await config.responseBuilder(data, ctx);
      }

      // 6. Return default success response
      return NextResponse.json(
        {
          success: true,
          data,
          ...(config.successMessage && { message: config.successMessage }),
        },
        { status: config.successStatus || HTTP_STATUS.OK }
      );
    } catch (error: unknown) {
      // 7. Handle known AppError subclasses
      if (isAppError(error)) {
        const response: Record<string, unknown> = {
          success: false,
          error: error.code,
          message: error.message,
          statusCode: error.statusCode,
        };

        // Add retryAfterSeconds for rate-limited errors
        if ("retryAfterSeconds" in error && typeof (error as Record<string, unknown>).retryAfterSeconds === "number") {
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

      // 8. Handle unexpected errors
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
