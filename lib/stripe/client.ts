// lib/stripe/client.ts
//
// Stripe SDK singleton — server-side only.
// Never import this in Client Components or pages marked "use client".
// The publishable key is safe for the browser but the secret key is not.

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
        "Missing environment variable: STRIPE_SECRET_KEY\n" +
            "Add it to your .env.local file.",
    );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Pin the API version — never silently inherit breaking changes
    apiVersion: "2025-02-24.acacia",
    // Identify our platform in Stripe logs
    appInfo: {
        name: "ListingBull",
        version: "1.0.0",
    },
});
