// services/subscription.service.ts
//
// Reads subscription state and syncs Stripe data after webhooks.
// Stripe is the source of truth for paid plan state.
// Our DB is a cache — we never call Stripe on every request.

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Subscription, Plan, SubscriptionStatus } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// getSubscription
// Full subscription row — used in settings page and billing portal.
// Returns null if no row exists (should never happen — trigger creates one).
// ─────────────────────────────────────────────────────────────────────────────

export async function getSubscription(
    userId: string,
): Promise<Subscription | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createAdminSupabaseClient() as any)
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error?.code === "PGRST116") return null;
    if (error) {
        console.error("[subscription.service] getSubscription failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return mapSubscription(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// getPlan
// Lightweight — returns just the plan string. Called on every hot path.
// Fails safe to "free" on any DB error — never blocks the user.
// Treats past_due and canceled as free until the user resolves it.
// ─────────────────────────────────────────────────────────────────────────────

export async function getPlan(userId: string): Promise<Plan> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createAdminSupabaseClient() as any)
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", userId)
        .single();

    if (error) return "free";

    const activeStatuses: SubscriptionStatus[] = ["active", "trialing"];
    if (!activeStatuses.includes(data.status as SubscriptionStatus))
        return "free";

    return data.plan as Plan;
}

// ─────────────────────────────────────────────────────────────────────────────
// upsertFromStripe
// Called by the Stripe webhook after every subscription event.
// Uses upsert on user_id conflict — idempotent, safe to call multiple times.
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertFromStripe(params: {
    userId: string;
    plan: Plan;
    status: SubscriptionStatus;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
}): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (createAdminSupabaseClient() as any)
        .from("subscriptions")
        .upsert(
            {
                user_id: params.userId,
                plan: params.plan,
                status: params.status,
                stripe_customer_id: params.stripeCustomerId,
                stripe_subscription_id: params.stripeSubscriptionId,
                stripe_price_id: params.stripePriceId,
                current_period_start: params.currentPeriodStart.toISOString(),
                current_period_end: params.currentPeriodEnd.toISOString(),
                cancel_at_period_end: params.cancelAtPeriodEnd,
                canceled_at: params.canceledAt?.toISOString() ?? null,
            },
            { onConflict: "user_id" },
        );

    if (error) {
        console.error("[subscription.service] upsertFromStripe failed:", {
            userId: params.userId,
            message: error.message,
        });
        throw new Error(`Failed to upsert subscription: ${error.message}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// downgradeToFree
// Called when customer.subscription.deleted fires in the Stripe webhook.
// Strips all Stripe identifiers — the user is fully on free plan.
// ─────────────────────────────────────────────────────────────────────────────

export async function downgradeToFree(userId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (createAdminSupabaseClient() as any)
        .from("subscriptions")
        .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            stripe_price_id: null,
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
        })
        .eq("user_id", userId);

    if (error) {
        console.error("[subscription.service] downgradeToFree failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to downgrade subscription: ${error.message}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// getUserIdByStripeCustomerId
// Stripe webhooks only provide a customer ID — this maps it to our user ID.
// Returns null instead of throwing — webhook handler decides how to proceed.
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserIdByStripeCustomerId(
    stripeCustomerId: string,
): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createAdminSupabaseClient() as any)
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();

    if (error) return null;
    return data.user_id as string;
}

// ─────────────────────────────────────────────────────────────────────────────
// mapSubscription
// Single mapping point — snake_case DB row → camelCase TypeScript type.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubscription(row: Record<string, any>): Subscription {
    return {
        id: row.id,
        userId: row.user_id,
        plan: row.plan,
        status: row.status,
        stripeCustomerId: row.stripe_customer_id ?? null,
        stripeSubscriptionId: row.stripe_subscription_id ?? null,
        stripePriceId: row.stripe_price_id ?? null,
        currentPeriodStart: row.current_period_start ?? null,
        currentPeriodEnd: row.current_period_end ?? null,
        cancelAtPeriodEnd: row.cancel_at_period_end,
        canceledAt: row.canceled_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
