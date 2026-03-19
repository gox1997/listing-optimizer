// app/api/subscriptions/checkout/route.ts
//
// POST /api/subscriptions/checkout
//
// Two paths — determined by whether an active Stripe subscription exists:
//
//   PATH A — No active subscription
//     → Create Stripe Checkout session → return URL → client redirects
//     → On success Stripe fires customer.subscription.created
//     → Webhook syncs DB
//
//   PATH B — Active subscription exists (upgrade / downgrade)
//     → Call stripe.subscriptions.update() — swap price item in-place
//     → Same subscription ID, no second subscription created
//     → Stripe fires customer.subscription.updated → webhook syncs DB

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PRICE_IDS } from "@/config/plans";
import { getSubscription } from "@/services/subscription.service";
import type { ApiResponse, Plan } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const CheckoutSchema = z.object({
    plan: z.enum(["starter", "pro", "growth", "business", "agency"]),
    interval: z.enum(["monthly", "yearly"]),
});

// Statuses that mean a live Stripe subscription already exists
const ACTIVE_STATUSES = new Set<string>(["active", "trialing", "past_due"]);

// ─────────────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    // ── 1. Authenticate ───────────────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "You must be logged in.",
                },
            },
            { status: 401 },
        );
    }

    // ── 2. Validate body ──────────────────────────────────────────────────────
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: "Request body must be valid JSON.",
                },
            },
            { status: 400 },
        );
    }

    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid plan or interval.",
                },
            },
            { status: 422 },
        );
    }

    const { plan, interval } = parsed.data;

    // ── 3. Resolve price ID ───────────────────────────────────────────────────
    const priceId = STRIPE_PRICE_IDS[plan as Exclude<Plan, "free">][interval];
    if (!priceId) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: "Price not configured for this plan.",
                },
            },
            { status: 400 },
        );
    }

    // ── 4. Load current subscription ─────────────────────────────────────────
    const subscription = await getSubscription(user.id);

    const isActiveSub =
        !!subscription?.stripeSubscriptionId &&
        ACTIVE_STATUSES.has(subscription.status ?? "");

    // ── PATH B — Swap price on existing subscription ──────────────────────────
    if (isActiveSub) {
        // Always fetch live from Stripe — DB item IDs can drift
        let stripeSub;
        try {
            stripeSub = await stripe.subscriptions.retrieve(
                subscription!.stripeSubscriptionId!,
            );
        } catch (err) {
            console.error(
                "[checkout] Failed to retrieve Stripe subscription:",
                err,
            );
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Failed to retrieve current subscription.",
                    },
                },
                { status: 502 },
            );
        }

        const currentItem = stripeSub.items.data[0];
        if (!currentItem) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Subscription is in an unexpected state.",
                    },
                },
                { status: 500 },
            );
        }

        // Guard: no-op if already on this exact price
        if (currentItem.price.id === priceId) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "Already subscribed to this plan.",
                    },
                },
                { status: 409 },
            );
        }

        try {
            await stripe.subscriptions.update(
                subscription!.stripeSubscriptionId!,
                {
                    items: [{ id: currentItem.id, price: priceId }],
                    proration_behavior: "create_prorations",
                    metadata: { supabaseUserId: user.id },
                },
            );
        } catch (err) {
            console.error(
                "[checkout] Failed to update Stripe subscription:",
                err,
            );
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Failed to update subscription.",
                    },
                },
                { status: 502 },
            );
        }

        console.log(
            `[checkout] Swapped subscription ${subscription!.stripeSubscriptionId} ` +
                `to ${plan}/${interval} for user ${user.id}`,
        );

        return NextResponse.json<ApiResponse<{ upgraded: boolean }>>({
            success: true,
            data: { upgraded: true },
        });
    }

    // ── PATH A — No active subscription: create Checkout session ─────────────
    let customerId = subscription?.stripeCustomerId ?? undefined;

    if (!customerId) {
        try {
            const customer = await stripe.customers.create({
                email: user.email ?? undefined,
                metadata: { supabaseUserId: user.id },
            });
            customerId = customer.id;
        } catch (err) {
            console.error("[checkout] Failed to create Stripe customer:", err);
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Failed to initialize payment.",
                    },
                },
                { status: 502 },
            );
        }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let session;
    try {
        session = await stripe.checkout.sessions.create(
            {
                customer: customerId,
                mode: "subscription",
                line_items: [{ price: priceId, quantity: 1 }],
                billing_address_collection: "auto",
                allow_promotion_codes: true,
                subscription_data: {
                    metadata: { supabaseUserId: user.id },
                },
                success_url: `${appUrl}/dashboard?upgrade=success`,
                cancel_url: `${appUrl}/upgrade?upgrade=cancelled`,
                metadata: { supabaseUserId: user.id, plan, interval },
            },
            {
                // Idempotency key: same user + plan + interval within 24h
                // returns the existing session instead of creating a duplicate.
                // Prevents double-sessions from retry clicks or network hiccups.
                idempotencyKey: `checkout-${user.id}-${plan}-${interval}`,
            },
        );
    } catch (err) {
        console.error("[checkout] Failed to create Stripe session:", err);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to create checkout session.",
                },
            },
            { status: 502 },
        );
    }

    if (!session.url) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Checkout session created but no URL returned.",
                },
            },
            { status: 500 },
        );
    }

    console.log(
        `[checkout] Created session ${session.id} for user ${user.id} (${plan}/${interval})`,
    );

    return NextResponse.json<ApiResponse<{ url: string }>>({
        success: true,
        data: { url: session.url },
    });
}
