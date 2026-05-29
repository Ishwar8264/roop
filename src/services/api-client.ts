/**
 * Purpose: API client for Nikharta Roop backend communication
 * Responsibility: Handle all HTTP requests, responses, and error normalization
 * Important Notes: Never call APIs directly from UI components — use this service layer
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

// ==================== Token Helpers ====================

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nr_token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("nr_token", token);
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("nr_token");
}

// ==================== Core Request Function ====================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse response
  const data = await response.json();

  // Handle error responses
  if (!response.ok) {
    const error: ApiError = {
      error: data.error || "UNKNOWN_ERROR",
      message: data.message || "कुछ गलत हो गया।",
      statusCode: response.status,
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
