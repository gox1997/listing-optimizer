/**
 *
 * Central export point for all business logic services.
 * Always import from '@/services' — never from deep service paths.
 *
 * Rules:
 *   - Service files must never import from '@/services' (no circular deps)
 *   - Types shared across layers live in '@/types'
 *   - Service-specific return types (Result, ErrorCode) live here
 */

// ─── AI Service ───────────────────────────────────────────────────────────────
export { generateListing } from "./ai.service";
export type { AIServiceResult } from "./ai.service";

// ─── Usage Service ────────────────────────────────────────────────────────────
export {
    checkQuota,
    getUsageStats,
    incrementUsage,
    resetUsageForNewPeriod,
} from "./usage.service";

// ─── Generation Service ───────────────────────────────────────────────────────
export {
    createGeneration,
    getGeneration,
    listGenerations,
    deleteGeneration,
} from "./generation.service";
export type {
    GenerationResult,
    GenerationErrorCode,
    GenerationRow,
} from "./generation.service";

// ─── Coming in Sprint 4 ───────────────────────────────────────────────────────
// export { getUserSubscription, createCheckoutSession } from "./subscription.service"
// export { getUserProfile, updateUserProfile }          from "./user.service"
