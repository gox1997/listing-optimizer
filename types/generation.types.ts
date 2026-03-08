// types/generation.types.ts
// Core types for the AI generation system
// These types flow through every layer: API → Service → AI → Database

// ─────────────────────────────────────────────
// ENUMS & UNIONS
// ─────────────────────────────────────────────

export type Platform = "amazon" | "shopify" | "etsy" | "general";

export type Tone =
    | "professional"
    | "casual"
    | "luxury"
    | "playful"
    | "technical";

export type GenerationStatus =
    | "pending" // Row created, AI call not yet made
    | "processing" // AI call in progress
    | "completed" // AI returned valid output
    | "failed"; // AI call failed or parse failed

// ─────────────────────────────────────────────
// AI SERVICE TYPES
// ─────────────────────────────────────────────

/**
 * Input to the AI generation service.
 * Comes from the user's form submission after Zod validation.
 */
export type GenerationInput = {
    productName: string;
    productCategory: string;
    description?: string;
    features?: string[];
    platform: Platform;
    tone: Tone;
    keywords?: string[];
    primaryKeyword?: string;
};

/**
 * Structured output from the AI service.
 * Always fully populated — never partial.
 * Stored as JSONB in the generations table.
 */
export type ListingOutput = {
    seoTitle: string;
    bulletPoints: string[]; // Always exactly 5
    description: string;
    metaDescription: string; // Always ≤ 160 characters
    tags: string[]; // 10–15 tags
};

// ─────────────────────────────────────────────
// DATABASE ROW TYPES
// ─────────────────────────────────────────────

/**
 * Shape of a row in the `generations` table.
 * Mirrors the schema from Phase 4 exactly.
 */
export type Generation = {
    id: string;
    userId: string;
    status: GenerationStatus;
    platform: Platform;
    tone: Tone;
    input: GenerationInput;
    output: ListingOutput | null;
    tokensUsed: number | null;
    errorMessage: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

/**
 * Lightweight version for list views (history, dashboard).
 * Avoids shipping the full output JSONB for list queries.
 */
export type GenerationSummary = Pick<
    Generation,
    "id" | "status" | "platform" | "tone" | "createdAt"
> & {
    productName: string; // Extracted from input.productName
};

// ─────────────────────────────────────────────
// FILTER & PAGINATION TYPES
// ─────────────────────────────────────────────

export type GenerationFilters = {
    platform?: Platform;
    search?: string;
};

export type PaginationParams = {
    page: number;
    limit: number;
};

export type PaginatedResult<T> = {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
};
