// app/(app)/dashboard/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/services/usage.service";
import { listGenerations } from "@/services/generation.service";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Sparkles, History, Zap } from "lucide-react";
import type { Metadata } from "next";

/* ------------------------------------------------------------------ */
/*  Force dynamic — dashboard data must never be cached                */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
    title: "Dashboard — ListingAI",
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function DashboardPage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    // Fetch profile, usage stats, and recent generations in parallel
    // Each is wrapped independently so one failure doesn't crash the page
    const [profileResult, stats, historyResult] = await Promise.all([
        supabase
            .from("user_profiles")
            .select("display_name, email")
            .eq("id", user.id)
            .single()
            .then((r) => {
                if (r.error) {
                    console.error("[DashboardPage] Failed to fetch profile:", {
                        userId: user.id,
                        error: r.error.message,
                    });
                }
                return r;
            }),

        getUsageStats(user.id).catch((err) => {
            console.error("[DashboardPage] Failed to fetch usage stats:", {
                userId: user.id,
                err,
            });
            // Safe fallback — free plan with 0 used
            return {
                allowed: true,
                used: 0,
                limit: 5,
                remaining: 5,
                resetDate: "",
                plan: "free" as const,
                percentUsed: 0,
            };
        }),

        listGenerations(user.id, 1, 3).catch((err) => {
            console.error(
                "[DashboardPage] Failed to fetch recent generations:",
                {
                    userId: user.id,
                    err,
                },
            );
            return {
                success: false as const,
                error: "Failed",
                code: "internal_error" as const,
            };
        }),
    ]);

    const name =
        profileResult.data?.display_name ??
        profileResult.data?.email ??
        user.email ??
        "there";
    const displayName = name.includes("@") ? name.split("@")[0] : name;
    const recentGens = historyResult.success ? historyResult.generations : [];
    const usagePercent = Math.min(100, stats.percentUsed);
    const isNearLimit = usagePercent >= 80 && stats.limit !== Infinity;
    const isAtLimit = !stats.allowed;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Welcome back, {displayName} 👋
                </h1>
                <p className="text-slate-500 mt-1 text-base sm:text-lg">
                    Here&apos;s what&apos;s happening with your listings.
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Generations used"
                    value={
                        stats.limit === Infinity
                            ? `${stats.used}`
                            : `${stats.used} / ${stats.limit}`
                    }
                    sub={
                        stats.limit === Infinity
                            ? "Unlimited plan"
                            : `${stats.remaining} remaining`
                    }
                    accent={isAtLimit ? "red" : isNearLimit ? "amber" : "green"}
                >
                    {stats.limit !== Infinity && (
                        <div className="mt-3">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    role="progressbar"
                                    aria-valuenow={stats.used}
                                    aria-valuemin={0}
                                    aria-valuemax={stats.limit as number}
                                    aria-label="Generation usage"
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        isAtLimit
                                            ? "bg-red-500"
                                            : isNearLimit
                                              ? "bg-amber-500"
                                              : "bg-emerald-500",
                                    )}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </StatCard>

                <StatCard
                    label="Current plan"
                    value={
                        stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)
                    }
                    sub={stats.plan === "free" ? "Upgrade for more" : "Active"}
                    accent="slate"
                />

                <StatCard
                    label="Resets"
                    value={
                        stats.resetDate
                            ? formatRelativeTime(stats.resetDate)
                            : "—"
                    }
                    sub="Next billing period"
                    accent="slate"
                />
            </div>

            {/* At-limit / near-limit banner */}
            {(isAtLimit || isNearLimit) && (
                <div
                    role="alert"
                    className={cn(
                        "flex items-center justify-between gap-4 p-4 rounded-xl border text-base",
                        isAtLimit
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-amber-50 border-amber-200 text-amber-800",
                    )}
                >
                    <p>
                        {isAtLimit
                            ? `You've used all ${stats.limit} generations this month.`
                            : `You've used ${usagePercent}% of your monthly generations.`}{" "}
                        Upgrade to keep generating.
                    </p>
                    <Link
                        href="/upgrade"
                        className={cn(
                            "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                            isAtLimit
                                ? "bg-red-700 text-white hover:bg-red-600"
                                : "bg-amber-700 text-white hover:bg-amber-600",
                        )}
                    >
                        Upgrade
                    </Link>
                </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    href="/generate"
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
                        isAtLimit
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                            : "bg-slate-900 text-white hover:bg-slate-700",
                    )}
                    aria-disabled={isAtLimit}
                    tabIndex={isAtLimit ? -1 : undefined}
                >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">Generate listing</p>
                        <p className="text-base opacity-70 mt-0.5">
                            {isAtLimit
                                ? "Upgrade to continue"
                                : "AI-optimized in seconds"}
                        </p>
                    </div>
                </Link>

                <Link
                    href="/history"
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                        <History
                            className="w-5 h-5 text-slate-600"
                            aria-hidden="true"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-lg">
                            View history
                        </p>
                        <p className="text-base text-slate-500 mt-0.5">
                            Browse past generations
                        </p>
                    </div>
                </Link>
            </div>

            {/* Recent generations */}
            {recentGens.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">
                            Recent
                        </h2>
                        <Link
                            href="/history"
                            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            View all
                        </Link>
                    </div>

                    <ul className="space-y-2" aria-label="Recent generations">
                        {recentGens.map((gen) => (
                            <li key={gen.id}>
                                <Link
                                    href={`/generate/${gen.id}`}
                                    className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Zap
                                                className="w-4 h-4 text-slate-500"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {gen.product_name}
                                            </p>
                                            <p className="text-xs text-slate-400 capitalize">
                                                {gen.platform} · {gen.tone}
                                            </p>
                                        </div>
                                    </div>
                                    <time
                                        dateTime={gen.created_at}
                                        className="text-xs text-slate-400 shrink-0"
                                    >
                                        {formatRelativeTime(gen.created_at)}
                                    </time>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                            */
/* ------------------------------------------------------------------ */

function StatCard({
    label,
    value,
    sub,
    accent,
    children,
}: {
    label: string;
    value: string;
    sub: string;
    accent: "green" | "amber" | "red" | "slate";
    children?: React.ReactNode;
}) {
    const dotColor = {
        green: "bg-emerald-500",
        amber: "bg-amber-500",
        red: "bg-red-500",
        slate: "bg-slate-300",
    }[accent];

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <div
                    className={cn("w-2 h-2 rounded-full shrink-0", dotColor)}
                    aria-hidden="true"
                />
                <p className="text-sm font-medium font-mono text-slate-500 uppercase tracking-wider">
                    {label}
                </p>
            </div>
            <p className="text-lg font-bold font-mono text-slate-900">
                {value}
            </p>
            <p className="text-sm font-mono text-slate-400 mt-0.5">{sub}</p>
            {children}
        </div>
    );
}
