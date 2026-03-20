"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/utils/api";
import { cn } from "@/lib/utils/cn";
import { Check, Zap, Loader2 } from "lucide-react";
import type { Plan } from "@/types";
import type { PlanMetadata } from "@/config/plans";

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

// Per-plan accent colors — makes each card feel distinct
const PLAN_ACCENT: Record<string, { color: string; glow: string }> = {
    starter: { color: "#6366f1", glow: "rgba(6,182,212,0.2)" },
    pro: { color: "#8b5cf6", glow: "rgba(139,92,246,0.25)" },
    growth: { color: "#a78bfa", glow: "rgba(167,139,250,0.2)" },
    business: { color: "#6366f1", glow: "rgba(6,182,212,0.2)" },
    agency: { color: "#f59e0b", glow: "rgba(245,158,11,0.2)" },
};

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

    const upgradeStatus = searchParams.get("upgrade");

    const handleUpgrade = useCallback(
        async (plan: Exclude<Plan, "free">) => {
            if (loadingPlan) return;
            setError(null);
            setLoadingPlan(plan);

            const result = await apiPost<{ url?: string; success?: boolean }>(
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

            // PATH B (upgrade/downgrade in-place) returns { success: true }, no URL
            if (result.data.url) {
                window.location.href = result.data.url;
            } else {
                window.location.href = "/dashboard?upgraded=true";
            }
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
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                    Choose your plan
                </h1>
                <p className="text-muted-foreground text-base max-w-md mx-auto">
                    Higher-ranking listings. More clicks. More sales.
                </p>
            </div>

            {/* Status banners */}
            {upgradeStatus === "success" && (
                <div
                    role="alert"
                    className="p-4 rounded-xl text-sm text-center font-medium"
                    style={{
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        color: "#34d399",
                    }}
                >
                    🎉 Welcome to your new plan! Your account has been upgraded.
                </div>
            )}
            {upgradeStatus === "cancelled" && (
                <div
                    role="alert"
                    className="p-4 rounded-xl text-sm text-center"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                    }}
                >
                    Checkout cancelled — no charges were made.
                </div>
            )}
            {error && (
                <div
                    role="alert"
                    className="p-4 rounded-xl text-sm text-center"
                    style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#fca5a5",
                    }}
                >
                    {error}
                </div>
            )}

            {/* ── Billing interval toggle ───────────────────────── */}
            <div className="flex items-center justify-center">
                <div
                    className="flex items-center p-1 rounded-xl gap-1"
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    {(["monthly", "yearly"] as BillingInterval[]).map((i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setInterval(i)}
                            className={cn(
                                "px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                                interval === i
                                    ? "text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                            style={
                                interval === i
                                    ? {
                                          background:
                                              "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                      }
                                    : {}
                            }
                        >
                            {i === "monthly" ? "Monthly" : "Annual"}
                            {i === "yearly" && (
                                <span
                                    className="ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md"
                                    style={{
                                        background: "rgba(16,185,129,0.15)",
                                        color: "#34d399",
                                        border: "1px solid rgba(16,185,129,0.25)",
                                    }}
                                >
                                    Save 20%
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Plan cards ────────────────────────────────────── */}
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
                    const accent = PLAN_ACCENT[plan] ?? PLAN_ACCENT.pro;

                    return (
                        <div
                            key={plan}
                            className="relative flex flex-col rounded-2xl p-5 transition-all duration-200"
                            style={{
                                background: meta.highlighted
                                    ? "rgba(139,92,246,0.08)"
                                    : "rgba(30,41,59,0.5)",
                                border: current
                                    ? `2px solid ${accent.color}60`
                                    : meta.highlighted
                                      ? "2px solid rgba(139,92,246,0.4)"
                                      : "1px solid rgba(255,255,255,0.07)",
                                boxShadow: meta.highlighted
                                    ? `0 0 40px ${accent.glow}`
                                    : "none",
                            }}
                        >
                            {/* Most popular badge */}
                            {meta.highlighted && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                                    <span
                                        className="px-3 py-1 text-xs font-bold rounded-full text-white whitespace-nowrap"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            boxShadow:
                                                "0 0 20px rgba(139,92,246,0.5)",
                                        }}
                                    >
                                        ⭐ Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Current plan badge */}
                            {current && !meta.highlighted && (
                                <div className="absolute -top-3 right-4 z-10">
                                    <span
                                        className="px-2.5 py-1 text-xs font-bold rounded-full text-white"
                                        style={{
                                            background: "rgba(16,185,129,0.9)",
                                        }}
                                    >
                                        Current
                                    </span>
                                </div>
                            )}

                            {/* Plan name + tagline */}
                            <div className="mb-4 mt-1">
                                <h2
                                    className="text-base font-bold"
                                    style={{ color: accent.color }}
                                >
                                    {meta.name}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {meta.tagline}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-foreground font-mono">
                                        ${price}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        /mo
                                    </span>
                                </div>
                                {interval === "yearly" ? (
                                    <p
                                        className="text-xs font-medium mt-0.5"
                                        style={{ color: "#34d399" }}
                                    >
                                        Save {savings[plan]}% vs monthly
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                                        or ${meta.yearlyPrice}/mo billed yearly
                                    </p>
                                )}
                            </div>

                            {/* Generations pill */}
                            <div
                                className="mb-4 px-3 py-2 rounded-xl"
                                style={{
                                    background: `${accent.color}12`,
                                    border: `1px solid ${accent.color}25`,
                                }}
                            >
                                <p
                                    className="text-xs font-semibold"
                                    style={{ color: accent.color }}
                                >
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
                                            className="w-3.5 h-3.5 shrink-0 mt-0.5"
                                            style={{ color: "#10b981" }}
                                            aria-hidden="true"
                                        />
                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* ── CTA button — three distinct states ── */}
                            {current ? (
                                // Current plan — locked, subtle
                                <div
                                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-center"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        color: "#64748b",
                                    }}
                                >
                                    Current plan
                                </div>
                            ) : down ? (
                                // Downgrade — ghost border button
                                <button
                                    type="button"
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={loading || !!loadingPlan}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground transition-all duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        background: "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        (
                                            e.currentTarget as HTMLElement
                                        ).style.background =
                                            "rgba(255,255,255,0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (
                                            e.currentTarget as HTMLElement
                                        ).style.background = "transparent";
                                    }}
                                >
                                    {loading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        "Downgrade"
                                    )}
                                </button>
                            ) : meta.highlighted ? (
                                // Highlighted plan — full gradient + shimmer
                                <button
                                    type="button"
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={loading || !!loadingPlan}
                                    className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 hover:-translate-y-0.5"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
                                        boxShadow:
                                            "0 0 30px rgba(139,92,246,0.4)",
                                    }}
                                >
                                    {/* Shimmer */}
                                    <span
                                        className="pointer-events-none absolute inset-0"
                                        style={{
                                            background:
                                                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                                            backgroundSize: "200% 100%",
                                            animation:
                                                "shimmer-sweep 2s ease-in-out infinite",
                                        }}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className="pointer-events-none absolute inset-x-0 top-0 h-px"
                                        style={{
                                            background: "rgba(255,255,255,0.4)",
                                        }}
                                        aria-hidden="true"
                                    />
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Zap
                                                className="w-3.5 h-3.5"
                                                aria-hidden="true"
                                            />
                                            {meta.ctaLabel}
                                        </>
                                    )}
                                </button>
                            ) : (
                                // Regular upgrade — gradient border, transparent fill
                                <button
                                    type="button"
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={loading || !!loadingPlan}
                                    className="relative w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 hover:-translate-y-0.5 group"
                                    style={{ padding: "1px" }}
                                >
                                    {/* Gradient border wrapper */}
                                    <span
                                        className="absolute inset-0 rounded-xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${accent.color}, #8b5cf6)`,
                                            opacity: 0.7,
                                        }}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className="relative flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-[11px] text-sm font-semibold transition-colors duration-150"
                                        style={{
                                            background: "rgba(11,17,32,0.95)",
                                            color: accent.color,
                                        }}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Zap
                                                    className="w-3.5 h-3.5"
                                                    aria-hidden="true"
                                                />
                                                {meta.ctaLabel}
                                            </>
                                        )}
                                    </span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Free plan note */}
            {currentPlan === "free" && (
                <p className="text-center text-sm text-muted-foreground/60">
                    You&apos;re on the{" "}
                    <span className="text-foreground font-medium">
                        Free plan
                    </span>{" "}
                    — 5 listings/month. Upgrade anytime, cancel anytime.
                </p>
            )}

            {/* Billing portal */}
            {hasBillingPortal && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={handlePortal}
                        disabled={portalLoading}
                        className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded"
                    >
                        {portalLoading ? (
                            <span className="flex items-center justify-center gap-1.5">
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
