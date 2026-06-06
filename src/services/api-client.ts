/**
 * Purpose: API client for Nikharta Roop backend communication
 * Responsibility: Handle HTTP requests, responses, error normalization, and cookie refresh
 * Important Notes:
 *   - Never call APIs directly from UI components — use this service layer
 *   - Tokens are never readable by client JavaScript
 *   - Access + refresh tokens are sent through HttpOnly same-origin cookies
 *   - Auto-refresh on 401 with retry keeps normal API calls smooth
 *   - Refresh mutex prevents concurrent refresh calls
 */

import type { ApiResponse, ApiError } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

// ==================== Base Config ====================

const API_BASE_URL = "/api";

// ==================== Error Classes ====================

export class ApiClientError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.statusCode = error.statusCode;
    this.errorCode = error.error;
  }
}

// ==================== Refresh Mutex ====================

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the HttpOnly refresh cookie
 * Returns true if refresh succeeded, false otherwise
 * Uses mutex to prevent concurrent refresh calls
 */
async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Send empty JSON body — the refresh token is read from the HttpOnly cookie (nr_refresh_token)
      // on the server side. Body is {} so request.json() doesn't throw on the server.
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "same-origin", // Ensure HttpOnly cookie is included
      });

      if (!response.ok) return false;

      const data: ApiResponse<Record<string, never>> = await response.json();
      return !!data.success;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ==================== Core Request Function ====================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "same-origin", // Ensure cookies are sent AND received (Set-Cookie processed)
  });

  // Auto-refresh on 401 — access cookie expired or missing but refresh cookie may still be valid
  if (response.status === 401 && endpoint !== "/auth/refresh") {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const retryHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };

      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
        credentials: "same-origin",
      });

      const retryData = await retryResponse.json();

      if (!retryResponse.ok) {
        throw new ApiClientError({
          success: false,
          error: retryData.error || "UNKNOWN_ERROR",
          message: retryData.message || "कुछ गलत हो गया।",
          statusCode: retryResponse.status,
        });
      }

      return retryData as T;
    } else {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiClientError({
        success: false,
        error: "AUTH_SESSION_EXPIRED",
        message: "Session expired. Please login again.",
        statusCode: 401,
      });
    }
  }

  // Parse response
  const data = await response.json();

  // Handle error responses
  if (!response.ok) {
    const error: ApiError = {
      success: false,
      error: data.error || "UNKNOWN_ERROR",
      message: data.message || "कुछ गलत हो गया।",
      statusCode: response.status,
      retryAfterSeconds: data.retryAfterSeconds,
      fields: data.fields,
    };
    throw new ApiClientError(error);
  }

  return data as T;
}

// ==================== HTTP Method Helpers ====================

export const apiClient = {
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params)}`
      : endpoint;
    return request<T>(url, { method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" });
  },
} as const;

// ==================== Legacy Token Helpers ====================

function _setAuthToken(token: string): void {
  void token;
}

function _removeAuthToken(): void {
  // Tokens are HttpOnly cookies; clearing happens through /api/auth/logout.
}

function _getAuthToken(): string | null {
  return null;
}
