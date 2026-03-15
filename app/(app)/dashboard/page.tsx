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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Dashboard — ListingAI",
};

export default async function DashboardPage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    // Safely fetch profile – always return an object with data/error
    const fetchProfile = async () => {
        const { data, error } = await supabase
            .from("user_profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            console.error("[DashboardPage] Failed to fetch profile:", {
                userId: user.id,
                error: error.message || String(error),
            });
            return { data: null, error };
        }
        return { data, error: null };
    };

    const [profileResult, stats, historyResult] = await Promise.all([
        fetchProfile(),
        getUsageStats(user.id).catch((err) => {
            console.error("[DashboardPage] Failed to fetch usage stats:", {
                userId: user.id,
                err,
            });
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

    // Determine display name with fallbacks
    const name =
        profileResult.data?.full_name ??
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
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Welcome back, {displayName} 👋
                </h1>
                <p className="text-muted-foreground mt-1 text-base font-mono sm:text-lg">
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
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isAtLimit
                            ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    aria-disabled={isAtLimit}
                    tabIndex={isAtLimit ? -1 : undefined}
                >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">Generate listing</p>
                        <p className="text-base font-mono opacity-70 mt-0.5">
                            {isAtLimit
                                ? "Upgrade to continue"
                                : "AI-optimized in seconds"}
                        </p>
                    </div>
                </Link>

                <Link
                    href="/history"
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                        <History
                            className="w-5 h-5 text-muted-foreground"
                            aria-hidden="true"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-foreground text-lg">
                            View history
                        </p>
                        <p className="text-base font-mono text-muted-foreground mt-0.5">
                            Browse past generations
                        </p>
                    </div>
                </Link>
            </div>

            {/* Recent generations */}
            {recentGens.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-foreground">
                            Recent
                        </h2>
                        <Link
                            href="/history"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            View all
                        </Link>
                    </div>

                    <ul className="space-y-2" aria-label="Recent generations">
                        {recentGens.map((gen) => (
                            <li key={gen.id}>
                                <Link
                                    href={`/generate/${gen.id}`}
                                    className="flex items-center justify-between gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                            <Zap
                                                className="w-4 h-4 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {gen.product_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground/70 capitalize">
                                                {gen.platform} · {gen.tone}
                                            </p>
                                        </div>
                                    </div>
                                    <time
                                        dateTime={gen.created_at}
                                        className="text-xs text-muted-foreground/70 shrink-0"
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
        slate: "bg-muted-foreground/30",
    }[accent];

    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <div
                    className={cn("w-2 h-2 rounded-full shrink-0", dotColor)}
                    aria-hidden="true"
                />
                <p className="text-sm font-medium font-mono text-muted-foreground uppercase tracking-wider">
                    {label}
                </p>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">
                {value}
            </p>
            <p className="text-sm font-mono text-muted-foreground/70 mt-0.5">
                {sub}
            </p>
            {children}
        </div>
    );
}
