// app/api/subscriptions/webhook/route.ts
//
// POST /api/subscriptions/webhook
//
// Stripe sends signed events here after every payment lifecycle change.
// This is the ONLY place that syncs Stripe state into our database.
//
// Critical rules:
//   - Always verify the webhook signature — reject unverified requests
//   - Always return 200 quickly — Stripe retries on non-2xx
//   - Be idempotent — Stripe may send the same event more than once

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import {
    upsertFromStripe,
    downgradeToFree,
    getUserIdByStripeCustomerId,
} from "@/services/subscription.service";
import { resetUsageForNewPeriod } from "@/services/usage.service";
import { STRIPE_PRICE_IDS } from "@/config/plans";
import type { Plan, SubscriptionStatus } from "@/types";
import type Stripe from "stripe";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a Stripe price ID back to our Plan type.
 * Checks both monthly and yearly price IDs for each plan.
 */
function getPlanFromPriceId(priceId: string): Plan {
    const entries = Object.entries(STRIPE_PRICE_IDS) as [
        Exclude<Plan, "free">,
        { monthly: string; yearly: string },
    ][];

    for (const [plan, ids] of entries) {
        if (ids.monthly === priceId || ids.yearly === priceId) {
            return plan;
        }
    }

    console.warn(`[webhook] Unknown price ID: ${priceId} — defaulting to free`);
    return "free";
}

/**
 * Safely casts Stripe's subscription status string to our SubscriptionStatus type.
 * Stripe statuses that don't map to ours default to "incomplete".
 */
function toSubscriptionStatus(
    status: Stripe.Subscription.Status,
): SubscriptionStatus {
    const valid: SubscriptionStatus[] = [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
    ];
    return valid.includes(status as SubscriptionStatus)
        ? (status as SubscriptionStatus)
        : "incomplete";
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        console.error("[webhook] Missing stripe-signature header");
        return NextResponse.json(
            { error: "Missing signature" },
            { status: 400 },
        );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
        return NextResponse.json(
            { error: "Webhook secret not configured" },
            { status: 500 },
        );
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[webhook] Signature verification failed:", message);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 },
        );
    }

    console.log(`[webhook] Received: ${event.type} (${event.id})`);

    try {
        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const sub = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpsert(sub);
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                const userId = await getUserIdByStripeCustomerId(
                    sub.customer as string,
                );
                if (userId) {
                    await downgradeToFree(userId);
                    console.log(`[webhook] Downgraded user ${userId} to free`);
                }
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.billing_reason === "subscription_cycle") {
                    await handlePeriodReset(invoice);
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                console.warn(
                    `[webhook] Payment failed for customer ${invoice.customer}`,
                );
                break;
            }

            default:
                console.log(`[webhook] Unhandled event type: ${event.type}`);
        }
    } catch (err) {
        // Log full error details
        console.error(`[webhook] Handler error for ${event.type}:`, {
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            error: err,
        });
        return NextResponse.json({ error: "Handler failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// handleSubscriptionUpsert
// ─────────────────────────────────────────────────────────────────────────────

async function handleSubscriptionUpsert(
    sub: Stripe.Subscription,
): Promise<void> {
    const customerId = sub.customer as string;
    const priceId = sub.items.data[0]?.price.id ?? "";
    const plan = getPlanFromPriceId(priceId);
    const status = toSubscriptionStatus(sub.status);

    let currentPeriodStart = sub.current_period_start;
    let currentPeriodEnd = sub.current_period_end;
    let canceledAt = sub.canceled_at;

    if (
        typeof currentPeriodStart !== "number" ||
        typeof currentPeriodEnd !== "number"
    ) {
        console.warn(
            `[webhook] Timestamps missing for subscription ${sub.id}, fetching from Stripe...`,
        );
        const fullSub = await stripe.subscriptions.retrieve(sub.id);
        currentPeriodStart = fullSub.current_period_start;
        currentPeriodEnd = fullSub.current_period_end;
        canceledAt = fullSub.canceled_at;
    }

    const sharedParams = {
        plan,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
    };

    let userId = await getUserIdByStripeCustomerId(customerId);
    if (!userId) {
        userId = sub.metadata?.supabaseUserId ?? null;
        if (!userId) {
            console.error(
                `[webhook] No userId found for customer ${customerId}`,
            );
            return;
        }
    }

    console.log(
        `[webhook] Upserting subscription for user ${userId}, plan: ${plan}`,
    );
    await upsertFromStripe({ userId, ...sharedParams });
}

// ─────────────────────────────────────────────────────────────────────────────
// handlePeriodReset
// ─────────────────────────────────────────────────────────────────────────────

async function handlePeriodReset(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const userId = await getUserIdByStripeCustomerId(customerId);

    if (!userId) {
        console.warn(
            `[webhook] handlePeriodReset: no userId for customer ${customerId}`,
        );
        return;
    }

    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const periodStart = new Date(sub.current_period_start * 1000).toISOString();
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

    await resetUsageForNewPeriod(userId, periodStart, periodEnd);
    console.log(
        `[webhook] Reset usage for user ${userId}, period: ${periodStart} → ${periodEnd}`,
    );
}
