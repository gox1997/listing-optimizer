// app/(app)/upgrade/UpgradeClient.tsx
"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/utils/api";
import { cn } from "@/lib/utils/cn";
import { Check, Zap, Loader2 } from "lucide-react";
import type { Plan } from "@/types";
import type { PlanMetadata } from "@/config/plans";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    currentPlan: Plan;
    planMetadata: Record<Plan, PlanMetadata>;
    savings: Record<Exclude<Plan, "free">, number>;
    hasBillingPortal: boolean;
};

type BillingInterval = "monthly" | "yearly";

const PAID_PLANS: Exclude<Plan, "free">[] = [
    "starter",
    "pro",
    "growth",
    "business",
    "agency",
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function UpgradeClient({
    currentPlan,
    planMetadata,
    savings,
    hasBillingPortal,
}: Props) {
    const searchParams = useSearchParams();

    const [interval, setInterval] = useState<BillingInterval>("monthly");
    const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Show success/cancel banners from Stripe redirect
    const upgradeStatus = searchParams.get("upgrade");

    const handleUpgrade = useCallback(
        async (plan: Exclude<Plan, "free">) => {
            if (loadingPlan) return;
            setError(null);
            setLoadingPlan(plan);

            const result = await apiPost<{ url: string }>(
                "/api/subscriptions/checkout",
                { plan, interval },
            );

            if (!result.success) {
                setError(
                    result.error?.message ??
                        "Failed to start checkout. Please try again.",
                );
                setLoadingPlan(null);
                return;
            }

            // Redirect to Stripe Checkout
            window.location.href = result.data.url;
        },
        [loadingPlan, interval],
    );

    const handlePortal = useCallback(async () => {
        if (portalLoading) return;
        setError(null);
        setPortalLoading(true);

        const result = await apiPost<{ url: string }>(
            "/api/subscriptions/portal",
        );

        if (!result.success) {
            setError(result.error?.message ?? "Failed to open billing portal.");
            setPortalLoading(false);
            return;
        }

        window.location.href = result.data.url;
    }, [portalLoading]);

    const isCurrentPlan = (plan: Plan) => plan === currentPlan;

    const isDowngrade = (plan: Plan) => {
        const order: Plan[] = [
            "free",
            "starter",
            "pro",
            "growth",
            "business",
            "agency",
        ];
        return order.indexOf(plan) < order.indexOf(currentPlan);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                    Choose your plan
                </h1>
                <p className="text-muted-foreground text-base">
                    Higher-ranking listings. More clicks. More sales.
                </p>
            </div>

            {/* Status banners */}
            {upgradeStatus === "success" && (
                <div
                    role="alert"
                    className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 text-center font-medium"
                >
                    🎉 Welcome to your new plan! Your account has been upgraded.
                </div>
            )}
            {upgradeStatus === "cancelled" && (
                <div
                    role="alert"
                    className="p-4 bg-muted border border-border rounded-xl text-sm text-muted-foreground text-center"
                >
                    Checkout cancelled — no charges were made.
                </div>
            )}
            {error && (
                <div
                    role="alert"
                    className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center"
                >
                    {error}
                </div>
            )}

            {/* Billing interval toggle */}
            <div className="flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => setInterval("monthly")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                        interval === "monthly"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    Monthly
                </button>
                <button
                    type="button"
                    onClick={() => setInterval("yearly")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                        interval === "yearly"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    Annual
                    <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">
                        Save 20%
                    </span>
                </button>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {PAID_PLANS.map((plan) => {
                    const meta = planMetadata[plan];
                    const current = isCurrentPlan(plan);
                    const down = isDowngrade(plan);
                    const loading = loadingPlan === plan;
                    const price =
                        interval === "yearly"
                            ? meta.yearlyPrice
                            : meta.monthlyPrice;

                    return (
                        <div
                            key={plan}
                            className={cn(
                                "relative flex flex-col rounded-2xl border p-5 transition-all",
                                meta.highlighted
                                    ? "border-primary shadow-lg shadow-primary/10 bg-card"
                                    : "border-border bg-card",
                                current && "ring-2 ring-primary",
                            )}
                        >
                            {/* Most popular badge */}
                            {meta.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full whitespace-nowrap">
                                        ⭐ Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Current plan badge */}
                            {current && (
                                <div className="absolute -top-3 right-4">
                                    <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                        Current
                                    </span>
                                </div>
                            )}

                            {/* Plan name + tagline */}
                            <div className="mb-4">
                                <h2 className="text-base font-bold text-foreground">
                                    {meta.name}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {meta.tagline}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-foreground">
                                        ${price}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        /mo
                                    </span>
                                </div>
                                {interval === "yearly" && (
                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                        Save {savings[plan]}% vs monthly
                                    </p>
                                )}
                                {interval === "monthly" && (
                                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                                        or ${meta.yearlyPrice}/mo billed yearly
                                    </p>
                                )}
                            </div>

                            {/* Generations */}
                            <div className="mb-4 px-3 py-2 bg-muted rounded-xl">
                                <p className="text-xs font-semibold text-foreground">
                                    {meta.generationsPerMonth.toLocaleString()}{" "}
                                    listings/mo
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2 mb-6 flex-1">
                                {meta.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start gap-2"
                                    >
                                        <Check
                                            className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5"
                                            aria-hidden="true"
                                        />
                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                type="button"
                                onClick={() => handleUpgrade(plan)}
                                disabled={current || loading || !!loadingPlan}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    "disabled:cursor-not-allowed",
                                    current
                                        ? "bg-muted text-muted-foreground opacity-60"
                                        : down
                                          ? "border border-border text-muted-foreground hover:bg-muted"
                                          : meta.highlighted
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                            : "bg-foreground text-background hover:bg-foreground/90",
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : current ? (
                                    "Current plan"
                                ) : down ? (
                                    "Downgrade"
                                ) : (
                                    <>
                                        <Zap className="w-3.5 h-3.5" />
                                        {meta.ctaLabel}
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Free plan note */}
            {currentPlan === "free" && (
                <p className="text-center text-sm text-muted-foreground">
                    You&apos;re on the <strong>Free plan</strong> — 5
                    listings/month. Upgrade anytime, cancel anytime.
                </p>
            )}

            {/* Billing portal */}
            {hasBillingPortal && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={handlePortal}
                        disabled={portalLoading}
                        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors disabled:opacity-50"
                    >
                        {portalLoading ? (
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Opening portal...
                            </span>
                        ) : (
                            "Manage billing, invoices & payment method →"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
