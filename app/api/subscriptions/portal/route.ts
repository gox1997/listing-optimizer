// app/api/subscriptions/portal/route.ts
//
// POST /api/subscriptions/portal
//
// Creates a Stripe Customer Portal session.
// Used for: cancel subscription, update payment method, view invoices.

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getSubscription } from "@/services/subscription.service";
import type { ApiResponse } from "@/types";

export async function POST() {
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

    // ── 2. Verify a Stripe customer exists ────────────────────────────────────
    const subscription = await getSubscription(user.id);

    if (!subscription?.stripeCustomerId) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "No active subscription found.",
                },
            },
            { status: 403 },
        );
    }

    // ── 3. Create portal session ──────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let session;
    try {
        session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${appUrl}/dashboard`,
        });
    } catch (err) {
        console.error("[portal] Failed to create Stripe portal session:", err);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to open billing portal.",
                },
            },
            { status: 502 },
        );
    }

    return NextResponse.json<ApiResponse<{ url: string }>>({
        success: true,
        data: { url: session.url },
    });
}
