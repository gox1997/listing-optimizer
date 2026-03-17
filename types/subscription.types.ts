// The four plans we offer
// Matches exactly the keys in config/plans.ts
export type Plan =
    | "free"
    | "starter"
    | "pro"
    | "growth"
    | "business"
    | "agency";

// Mirrors Stripe's subscription status values exactly
// We store this in our DB so we don't have to call Stripe on every request
export type SubscriptionStatus =
    | "active" // Paying and current
    | "trialing" // In trial period
    | "past_due" // Payment failed, grace period active
    | "canceled" // Subscription ended
    | "incomplete"; // Payment not yet completed

// A row in the subscriptions database table
// One row per user, always - even free plan users have a row
export type Subscription = {
    id: string;
    userId: string;
    plan: Plan;
    status: SubscriptionStatus;

    // Stripe identifiers - null for free plan users
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;

    // Billing period dates from Stripe - null for free plan
    // We use these to know when to reset the usage counter
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;

    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    createdAt: string;
    updatedAt: string;
};

// A row in the usage_tracking database table
// Tracks how many generations a user has made in the current period
export type UsageTracking = {
    id: string;
    userId: string;
    periodStart: string;
    periodEnd: string;
    generationsUsed: number;
    createdAt: string;
    updatedAt: string;
};

// Result of checking if a user can generate
// Returned by the quota check before every generation attempt
export type QuotaCheckResult = {
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
    resetDate: string;
};

// Full usage stats for displaying in the UI (sidebar, settings page)
export type UsageStats = QuotaCheckResult & {
    percentUsed: number;
    plan: Plan;
};
