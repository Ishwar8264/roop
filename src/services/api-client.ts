/**
 * Purpose: API client for Nikharta Roop backend communication
 * Responsibility: Handle all HTTP requests, responses, error normalization, and auth token management
 * Important Notes:
 *   - Never call APIs directly from UI components — use this service layer
 *   - Access token read from Zustand store (RAM) — NOT from storage
 *   - Auto-refresh on 401 with retry — user never sees token expiry
 *   - Refresh token sent via HttpOnly cookie (browser auto-includes)
 *   - Refresh mutex prevents concurrent refresh calls
 */

import type { ApiResponse, ApiError } from "@/types";

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
 * Get the current access token from Zustand store
 * Import is deferred to avoid circular dependency at module load time
 */
function getStoreToken(): string | null {
  const { useAuthStore } = require("@/stores/auth-store");
  return useAuthStore.getState().token;
}

/**
 * Set new access token in Zustand store after refresh
 */
function setStoreToken(token: string): void {
  const { useAuthStore } = require("@/stores/auth-store");
  useAuthStore.getState().setToken(token);
}

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

      const data: ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }> =
        await response.json();

      if (data.success && data.data?.tokens?.accessToken) {
        setStoreToken(data.data.tokens.accessToken);
        return true;
      }

      return false;
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
  const token = getStoreToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "same-origin", // Ensure cookies are sent AND received (Set-Cookie processed)
  });

  // Auto-refresh on 401 — token expired
  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const newToken = getStoreToken();
      const retryHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
      };

      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
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
      const { useAuthStore } = require("@/stores/auth-store");
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

export function setAuthToken(token: string): void {
  setStoreToken(token);
}

export function removeAuthToken(): void {
  const { useAuthStore } = require("@/stores/auth-store");
  useAuthStore.getState().setToken(null as unknown as string);
}

export function getAuthToken(): string | null {
  return getStoreToken();
}
