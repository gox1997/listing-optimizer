import type { Plan } from "@/types";

// How many generations each plan allows per billing period
// Infinity = truly unlimited (Agency plan)
export const PLAN_LIMITS: Record<Plan, number> = {
    free: 5,
    pro: 100,
    business: 500,
    agency: Infinity,
} as const;

// Full metadata for each plan - used by the pricing page and upgrade modal
export type PlanMetadata = {
    id: Plan;
    name: string;
    price: number; // Monthly price in USD
    description: string;
    features: string[];
    stripePriceId: string | null; // null for free plan, fill in after Stripe setup
    isPopular: boolean;
    cta: string; // Button label
};

export const PLAN_METADATA: Record<Plan, PlanMetadata> = {
    free: {
        id: "free",
        name: "Free",
        price: 0,
        description: "Get started with AI-powered listings",
        features: [
            "5 generations per month",
            "All 4 platforms (Amazon, Shopify, Etsy, General)",
            "All 5 tone options",
            "Generation history",
            "Copy to clipboard",
        ],
        stripePriceId: null,
        isPopular: false,
        cta: "Get Started Free",
    },

    pro: {
        id: "pro",
        name: "Pro",
        price: 29,
        description: "For active sellers who generate listings regularly",
        features: [
            "100 generations per month",
            "All platforms and tones",
            "Full generation history",
            "Export all fields",
            "Regenerate with one click",
            "Priority support",
        ],
        // Replace with real Stripe price ID after running scripts/setup-stripe.ts
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
        isPopular: true,
        cta: "Start Pro",
    },

    business: {
        id: "business",
        name: "Business",
        price: 79,
        description: "For stores with large or growing catalogs",
        features: [
            "500 generations per month",
            "Everything in Pro",
            "Bulk generation (CSV upload)",
            "Saved brand profiles",
            "Dedicated support",
        ],
        stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID ?? null,
        isPopular: false,
        cta: "Start Business",
    },

    agency: {
        id: "agency",
        name: "Agency",
        price: 199,
        description: "For agencies managing multiple client stores",
        features: [
            "Unlimited generations",
            "Everything in Business",
            "API access",
            "Team seats (up to 10)",
            "White-label exports",
            "SLA + priority support",
        ],
        stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID ?? null,
        isPopular: false,
        cta: "Contact Sales",
    },
};

// Helper - get the generation limit for a plan
// Returns free limit (5) as a safe fallback for unknown plans
export function getPlanLimit(plan: Plan): number {
    return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

// Helper - check if a plan is paid
export function isPaidPlan(plan: Plan): boolean {
    return plan !== "free";
}

// Plans in display order for the pricing page
export const DISPLAY_PLANS: Plan[] = ["free", "pro", "business", "agency"];
