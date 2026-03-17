import type { Plan } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// PLAN LIMITS
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<Plan, number> = {
    free: 5,
    starter: 30,
    pro: 100,
    growth: 300,
    business: 800,
    agency: 2000,
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAN METADATA
// ─────────────────────────────────────────────────────────────────────────────
export const PLAN_ORDER: Plan[] = [
    "free",
    "starter",
    "pro",
    "growth",
    "business",
    "agency",
];
export type PlanMetadata = {
    name: string;
    tagline: string;
    monthlyPrice: number;
    yearlyPrice: number;
    generationsPerMonth: number;
    features: string[];
    highlighted: boolean;
    ctaLabel: string;
};

export const PLAN_METADATA: Record<Plan, PlanMetadata> = {
    free: {
        name: "Free",
        tagline: "Try the product",
        monthlyPrice: 0,
        yearlyPrice: 0,
        generationsPerMonth: PLAN_LIMITS.free,
        features: [
            "5 listings per month",
            "All 4 platforms",
            "All 5 tones",
            "SEO title, bullets, description, tags",
        ],
        highlighted: false,
        ctaLabel: "Get started free",
    },
    starter: {
        name: "Starter",
        tagline: "Small sellers",
        monthlyPrice: 15,
        yearlyPrice: 12,
        generationsPerMonth: PLAN_LIMITS.starter,
        features: [
            "30 listings per month",
            "Everything in Free",
            "Listing Score (quality audit)",
        ],
        highlighted: false,
        ctaLabel: "Start Starter",
    },
    pro: {
        name: "Pro",
        tagline: "Your money printer",
        monthlyPrice: 29,
        yearlyPrice: 23,
        generationsPerMonth: PLAN_LIMITS.pro,
        features: [
            "100 listings per month",
            "Everything in Starter",
            "Keyword Intelligence (AI research)",
            "Full generation history",
            "5 variations per generation",
        ],
        highlighted: true,
        ctaLabel: "Start Pro",
    },
    growth: {
        name: "Growth",
        tagline: "Scaling stores",
        monthlyPrice: 59,
        yearlyPrice: 47,
        generationsPerMonth: PLAN_LIMITS.growth,
        features: [
            "300 listings per month",
            "Everything in Pro",
            "Bulk generation (CSV upload)",
            "Faster generation speed",
        ],
        highlighted: false,
        ctaLabel: "Start Growth",
    },
    business: {
        name: "Business",
        tagline: "Serious brands",
        monthlyPrice: 99,
        yearlyPrice: 79,
        generationsPerMonth: PLAN_LIMITS.business,
        features: [
            "800 listings per month",
            "Everything in Growth",
            "CSV export",
            "API access",
            "Priority queue",
        ],
        highlighted: false,
        ctaLabel: "Start Business",
    },
    agency: {
        name: "Agency",
        tagline: "Teams & agencies",
        monthlyPrice: 199,
        yearlyPrice: 159,
        generationsPerMonth: PLAN_LIMITS.agency,
        features: [
            "2000 listings per month",
            "Everything in Business",
            "Team seats (up to 10 users)",
            "Shared workspace",
            "SLA support",
        ],
        highlighted: false,
        ctaLabel: "Start Agency",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// STRIPE PRICE IDs
// ─────────────────────────────────────────────────────────────────────────────

type PaidPlan = Exclude<Plan, "free">;

export const STRIPE_PRICE_IDS: Record<
    PaidPlan,
    { monthly: string; yearly: string }
> = {
    starter: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? "",
        yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID ?? "",
    },
    pro: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    },
    growth: {
        monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID ?? "",
        yearly: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID ?? "",
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

export function getPlanLimit(plan: Plan): number {
    return PLAN_LIMITS[plan];
}

export function hasListingScore(plan: Plan): boolean {
    return plan !== "free";
}

export function hasKeywordIntelligence(plan: Plan): boolean {
    return (
        plan === "pro" ||
        plan === "growth" ||
        plan === "business" ||
        plan === "agency"
    );
}

export function hasBulkGeneration(plan: Plan): boolean {
    return plan === "growth" || plan === "business" || plan === "agency";
}

export function hasApiAccess(plan: Plan): boolean {
    return plan === "business" || plan === "agency";
}

export function hasTeamSeats(plan: Plan): boolean {
    return plan === "agency";
}

export function annualSavingsPercent(plan: PaidPlan): number {
    const meta = PLAN_METADATA[plan];
    const annualAtMonthly = meta.monthlyPrice * 12;
    const annualActual = meta.yearlyPrice * 12;
    return Math.round(
        ((annualAtMonthly - annualActual) / annualAtMonthly) * 100,
    );
}
