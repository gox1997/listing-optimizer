import type { Plan } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// PLAN LIMITS
// The single source of truth for what each plan is allowed to do.
// Read by: usage.service.ts (quota check), UI (usage indicator, upgrade modal)
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<Plan, number> = {
    free: 5, // 5 generations / month — enough to experience value, tight enough to convert
    pro: 100, // 100 generations / month
    business: 500, // 500 generations / month
    agency: 2000, // 2000 generations / month
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAN METADATA
// Display copy and feature lists — used by pricing page and upgrade modal.
// ─────────────────────────────────────────────────────────────────────────────

export type PlanMetadata = {
    name: string;
    tagline: string;
    monthlyPrice: number; // USD — 0 for free
    yearlyPrice: number; // USD — 0 for free (billed annually)
    generationsPerMonth: number;
    features: string[];
    highlighted: boolean; // Show "Most popular" badge
    ctaLabel: string;
};

export const PLAN_METADATA: Record<Plan, PlanMetadata> = {
    free: {
        name: "Free",
        tagline: "Try it out",
        monthlyPrice: 0,
        yearlyPrice: 0,
        generationsPerMonth: PLAN_LIMITS.free,
        features: [
            `${PLAN_LIMITS.free} listings per month`,
            "All 4 platforms (Amazon, Shopify, Etsy, General)",
            "All 5 tones",
            "SEO title, bullets, description, tags",
            "Generation history (last 10)",
        ],
        highlighted: false,
        ctaLabel: "Get started free",
    },
    pro: {
        name: "Pro",
        tagline: "For serious sellers",
        monthlyPrice: 19,
        yearlyPrice: 15, // per month billed annually → $180/yr
        generationsPerMonth: PLAN_LIMITS.pro,
        features: [
            `${PLAN_LIMITS.pro} listings per month`,
            "Everything in Free",
            "Keyword Intelligence (AI keyword research)",
            "Listing Score (quality audit)",
            "Full generation history",
            "Priority support",
        ],
        highlighted: true,
        ctaLabel: "Start Pro",
    },
    business: {
        name: "Business",
        tagline: "For growing brands",
        monthlyPrice: 49,
        yearlyPrice: 39, // per month billed annually → $468/yr
        generationsPerMonth: PLAN_LIMITS.business,
        features: [
            `${PLAN_LIMITS.business} listings per month`,
            "Everything in Pro",
            "Bulk generation (coming soon)",
            "CSV export",
            "API access (coming soon)",
            "Dedicated support",
        ],
        highlighted: false,
        ctaLabel: "Start Business",
    },
    agency: {
        name: "Agency",
        tagline: "For agencies and power users",
        monthlyPrice: 149,
        yearlyPrice: 119, // per month billed annually → $1,428/yr
        generationsPerMonth: PLAN_LIMITS.agency,
        features: [
            `${PLAN_LIMITS.agency} listings per month`,
            "Everything in Business",
            "Team members (coming soon)",
            "White-label export (coming soon)",
            "Custom tone profiles (coming soon)",
            "SLA support",
        ],
        highlighted: false,
        ctaLabel: "Start Agency",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// STRIPE PRICE IDs
// Placeholder until Stripe products are created.
// Replace with real IDs from the Stripe dashboard.
// Pattern: price_XXXXXXXXXXXXXXXXXXXXXXXX
// ─────────────────────────────────────────────────────────────────────────────

export const STRIPE_PRICE_IDS: Record<
    Exclude<Plan, "free">,
    { monthly: string; yearly: string }
> = {
    pro: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    },
    business: {
        monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? "",
        yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID ?? "",
    },
    agency: {
        monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID ?? "",
        yearly: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID ?? "",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the generation limit for a given plan */
export function getPlanLimit(plan: Plan): number {
    return PLAN_LIMITS[plan];
}

/** Returns true if this plan has access to Keyword Intelligence */
export function hasKeywordIntelligence(plan: Plan): boolean {
    return plan === "pro" || plan === "business" || plan === "agency";
}

/** Returns true if this plan has access to Listing Score */
export function hasListingScore(plan: Plan): boolean {
    return plan === "pro" || plan === "business" || plan === "agency";
}

/** Returns savings percentage for annual billing */
export function annualSavingsPercent(plan: Exclude<Plan, "free">): number {
    const meta = PLAN_METADATA[plan];
    const annualAtMonthly = meta.monthlyPrice * 12;
    const annualActual = meta.yearlyPrice * 12;
    return Math.round(
        ((annualAtMonthly - annualActual) / annualAtMonthly) * 100,
    );
}
