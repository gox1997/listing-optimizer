// app/api/subscriptions/checkout/route.ts
//
// POST /api/subscriptions/checkout
//
// Creates a Stripe Checkout session and returns the URL.
// The client redirects the user to that URL — Stripe handles payment.
//
// Flow:
//   1. Authenticate
//   2. Validate plan + billing interval
//   3. Get or create Stripe customer
//   4. Create checkout session
//   5. Return session URL

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PRICE_IDS } from "@/config/plans";
import { getSubscription } from "@/services/subscription.service";
import type { ApiResponse } from "@/types";
import type { Plan } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Request schema
// ─────────────────────────────────────────────────────────────────────────────

const CheckoutSchema = z.object({
    plan: z.enum(["starter", "pro", "growth", "business", "agency"]),
    interval: z.enum(["monthly", "yearly"]),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    // 1. Authenticate
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

    // 2. Validate body
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

    // 3. Get price ID for this plan + interval
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

    // 4. Get or create Stripe customer
    const subscription = await getSubscription(user.id);
    let customerId = subscription?.stripeCustomerId ?? undefined;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email ?? undefined,
            metadata: { supabaseUserId: user.id },
        });
        customerId = customer.id;
    }

    // 5. Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        // Collect billing address for tax compliance
        billing_address_collection: "auto",
        // Allow promo codes
        allow_promotion_codes: true,
        subscription_data: {
            metadata: { supabaseUserId: user.id },
        },
        success_url: `${appUrl}/dashboard?upgrade=success`,
        cancel_url: `${appUrl}/upgrade?upgrade=cancelled`,
        metadata: {
            supabaseUserId: user.id,
            plan,
            interval,
        },
    });

    if (!session.url) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to create checkout session.",
                },
            },
            { status: 500 },
        );
    }

    return NextResponse.json<ApiResponse<{ url: string }>>({
        success: true,
        data: { url: session.url },
    });
}
