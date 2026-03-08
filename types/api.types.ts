// Every API error has one of these codes
// The client uses this to decide how to handle the error
// (show upgrade modal, redirect to login, show toast, etc.)
export type ErrorCode =
    | "UNAUTHORIZED" // Not logged in
    | "FORBIDDEN" // Logged in but not allowed (e.g. wrong plan)
    | "NOT_FOUND" // Resource does not exist
    | "VALIDATION_ERROR" // Bad input from the client
    | "QUOTA_EXCEEDED" // Out of generations for this billing period
    | "INVALID_REQUEST" // Request is malformed
    | "INTERNAL_ERROR"; // Something went wrong on our side

// The error shape returned inside a failed API response
export type ApiError = {
    code: ErrorCode;
    message: string; // Human-readable, safe to show in the UI
    details?: unknown; // Optional extra info (e.g. Zod field errors)
};

// Every API route returns this shape - either success or failure
// T is the type of the data on success (e.g. ApiResponse<Generation>)
export type ApiResponse<T = null> =
    | { success: true; data: T }
    | { success: false; error: ApiError };

// Type guards - let you narrow the type in if/else blocks
// Usage: if (isApiSuccess(result)) { result.data ... }
export function isApiSuccess<T>(
    response: ApiResponse<T>,
): response is { success: true; data: T } {
    return response.success === true;
}

export function isApiError<T>(
    response: ApiResponse<T>,
): response is { success: false; error: ApiError } {
    return response.success === false;
}
