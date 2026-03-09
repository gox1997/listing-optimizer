import type { ApiResponse } from "@/types";

// Base URL for API calls - works in both browser and server environments
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Generic fetch wrapper - returns ApiResponse<T> always, never throws
async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        // Handle non-JSON responses (e.g. 204 No Content)
        if (response.status === 204) {
            return { success: true, data: null as T };
        }

        const json = await response.json();

        // If the server returned a structured ApiResponse, use it directly
        if ("success" in json) {
            return json as ApiResponse<T>;
        }

        // Otherwise wrap it in a success response
        return { success: true, data: json as T };
    } catch (error) {
        // Network error, JSON parse error, etc.
        return {
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
            },
        };
    }
}

// GET request
export function apiGet<T>(path: string): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, { method: "GET" });
}

// POST request with a JSON body
export function apiPost<T>(
    path: string,
    body?: unknown,
): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
    });
}

// PATCH request with a JSON body
export function apiPatch<T>(
    path: string,
    body?: unknown,
): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
    });
}

// DELETE request
export function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, { method: "DELETE" });
}
