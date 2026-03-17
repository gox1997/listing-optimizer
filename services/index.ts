// services/index.ts
//
// Central export point for all business logic services.
// Always import from "@/services" — never from deep service paths.
//
// Rules:
//   - Service files must never import from "@/services" (prevents circular deps)
//   - Types shared across layers live in "@/types"
//   - Service-specific return types live in their own service file and re-export here

// ─── AI Service ───────────────────────────────────────────────────────────────
export { generateListing } from "./ai.service";
export type { AIServiceResult } from "./ai.service";

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

// ─── Usage Service ────────────────────────────────────────────────────────────
export {
    checkQuota,
    getUsageStats,
    incrementUsage,
    resetUsageForNewPeriod,
} from "./usage.service";

// ─── Subscription Service ─────────────────────────────────────────────────────
export {
    getSubscription,
    getPlan,
    upsertFromStripe,
    downgradeToFree,
    getUserIdByStripeCustomerId,
} from "./subscription.service";

// ─── User Service ─────────────────────────────────────────────────────────────
export {
    getUserProfile,
    completeOnboarding,
    updateUserProfile,
} from "./user.service";
