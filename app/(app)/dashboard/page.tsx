// app/(app)/dashboard/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/services/usage.service";
import { listGenerations } from "@/services/generation.service";
import { getUserProfile } from "@/services/user.service";
import { CountUp } from "@/components/ui/CountUp";
import { formatRelativeTime } from "@/lib/utils/format";

import { Sparkles, History, Zap, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

type Props = { searchParams: Promise<{ upgrade?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
    const { upgrade } = await searchParams;

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const [profileResult, stats, historyResult] = await Promise.all([
        getUserProfile(user.id).catch(() => null),
        getUsageStats(user.id).catch(() => ({
            allowed: true,
            used: 0,
            limit: 5,
            remaining: 5,
            resetDate: "",
            plan: "free" as const,
            percentUsed: 0,
        })),
        listGenerations(user.id, 1, 3).catch(() => ({
            success: false as const,
            error: "Failed",
            code: "internal_error" as const,
        })),
    ]);

    const rawName =
        profileResult?.displayName ??
        profileResult?.email ??
        user.email ??
        "there";
    const displayName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    const recentGens = historyResult.success ? historyResult.generations : [];
    const usagePercent = Math.min(100, stats.percentUsed);
    const isNearLimit = usagePercent >= 60 && stats.limit !== Infinity;
    const isAtLimit = !stats.allowed;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Upgrade success banner */}
            {upgrade === "success" && (
                <div
                    role="alert"
                    className="p-4 rounded-xl border text-sm font-medium text-center"
                    style={{
                        background: "rgba(16,185,129,0.08)",
                        borderColor: "rgba(16,185,129,0.2)",
                        color: "#34d399",
                    }}
                >
                    🎉 Welcome to your new plan! Your account has been upgraded.
                </div>
            )}

            {/* Welcome */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Welcome back,{" "}
                    <span className="gradient-text">{displayName}</span> 👋
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                    Here&apos;s what&apos;s happening with your listings.
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Generations used"
                    value={
                        <>
                            <CountUp target={stats.used} />
                            <span className="text-muted-foreground/50 text-lg">
                                {" "}
                                / {stats.limit}
                            </span>
                        </>
                    }
                    sub={`${stats.remaining} remaining`}
                    accentColor={
                        isAtLimit
                            ? "#ef4444"
                            : isNearLimit
                              ? "#f59e0b"
                              : "#10b981"
                    }
                >
                    <div className="mt-3">
                        <div className="h-1.5 rounded-full overflow-hidden bg-border">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${usagePercent}%`,
                                    background: isAtLimit
                                        ? "#ef4444"
                                        : isNearLimit
                                          ? "#f59e0b"
                                          : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                                }}
                                role="progressbar"
                                aria-valuenow={stats.used}
                                aria-valuemin={0}
                                aria-valuemax={stats.limit as number}
                            />
                        </div>
                    </div>
                </StatCard>

                <StatCard
                    label="Current plan"
                    value={
                        stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)
                    }
                    sub={stats.plan === "free" ? "Upgrade for more" : "Active"}
                    accentColor="#8b5cf6"
                />

                <StatCard
                    label="Resets"
                    value={
                        stats.resetDate
                            ? formatRelativeTime(stats.resetDate)
                            : "—"
                    }
                    sub="Next billing period"
                    accentColor="#6366f1"
                />
            </div>

            {/* Limit warning */}
            {(isAtLimit || isNearLimit) && (
                <div
                    role="alert"
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border text-sm"
                    style={
                        isAtLimit
                            ? {
                                  background: "rgba(239,68,68,0.08)",
                                  borderColor: "rgba(239,68,68,0.2)",
                                  color: "#fca5a5",
                              }
                            : {
                                  background: "rgba(245,158,11,0.08)",
                                  borderColor: "rgba(245,158,11,0.2)",
                                  color: "#fcd34d",
                              }
                    }
                >
                    <div className="flex items-center gap-2">
                        <TrendingUp
                            className="w-4 h-4 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            {isAtLimit
                                ? `You've used all ${stats.limit} generations this month.`
                                : `You've used ${usagePercent}% of your monthly generations.`}{" "}
                            Upgrade to keep going.
                        </p>
                    </div>
                    <Link
                        href="/upgrade"
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{
                            background:
                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                    >
                        Upgrade
                    </Link>
                </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ── Generate CTA — elite card ──────────────────── */}
                {isAtLimit ? (
                    <div
                        className="flex items-center gap-4 p-5 rounded-2xl bg-muted text-muted-foreground cursor-not-allowed"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <div className="w-10 h-10 rounded-xl bg-border flex items-center justify-center shrink-0">
                            <Sparkles
                                className="w-5 h-5 text-muted-foreground/50"
                                aria-hidden="true"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-base">
                                Generate listing
                            </p>
                            <p className="text-sm opacity-60 mt-0.5">
                                Upgrade to continue
                            </p>
                        </div>
                    </div>
                ) : (
                    // Gradient card with shimmer sweep + glow — no class conflicts
                    <Link
                        href="/generate"
                        className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-2xl text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{
                            background:
                                "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #8b5cf6 100%)",
                            boxShadow:
                                "0 0 0 1px rgba(99,102,241,0.3), 0 8px 32px rgba(99,102,241,0.3), 0 0 60px rgba(139,92,246,0.15)",
                        }}
                    >
                        {/* Shimmer sweep */}
                        <span
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)",
                                backgroundSize: "200% 100%",
                                animation:
                                    "shimmer-sweep 3s ease-in-out infinite",
                            }}
                            aria-hidden="true"
                        />
                        {/* Top specular line */}
                        <span
                            className="pointer-events-none absolute inset-x-0 top-0 h-px"
                            style={{ background: "rgba(255,255,255,0.25)" }}
                            aria-hidden="true"
                        />
                        {/* Icon */}
                        <div
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.2)",
                            }}
                        >
                            <Sparkles
                                className="w-5 h-5 text-white"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="relative">
                            <p className="font-bold text-base">
                                Generate listing
                            </p>
                            <p className="text-sm opacity-70 mt-0.5">
                                AI-optimized in seconds
                            </p>
                        </div>
                        {/* Arrow slides right on hover */}
                        <span
                            className="relative ml-auto text-white/50 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-200 text-lg"
                            aria-hidden="true"
                        >
                            →
                        </span>
                    </Link>
                )}

                {/* ── History card ───────────────────────────────── */}
                <Link
                    href="/history"
                    className="group flex items-center gap-4 p-5 rounded-2xl card-history hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
                        style={{
                            background: "rgba(139,92,246,0.1)",
                            border: "1px solid rgba(139,92,246,0.15)",
                        }}
                    >
                        <History
                            className="w-5 h-5 text-violet-400"
                            aria-hidden="true"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-foreground text-base">
                            View history
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Browse past generations
                        </p>
                    </div>
                    <span
                        className="ml-auto text-muted-foreground/40 group-hover:text-muted-foreground/70 group-hover:translate-x-1 transition-all duration-200 text-lg"
                        aria-hidden="true"
                    >
                        →
                    </span>
                </Link>
            </div>

            {/* Recent generations */}
            {recentGens.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground">
                            Recent
                        </h2>
                        <Link
                            href="/history"
                            className="text-xs text-indigo-400/70 hover:text-indigo-400 transition-colors"
                        >
                            View all →
                        </Link>
                    </div>

                    <ul className="space-y-2" aria-label="Recent generations">
                        {recentGens.map((gen) => (
                            <li key={gen.id}>
                                <Link
                                    href={`/generate/${gen.id}`}
                                    className="group flex items-center justify-between gap-3 p-4 rounded-xl transition-all duration-150 hover:bg-[rgba(30,41,59,0.7)] hover:border-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                                    style={{
                                        background: "rgba(30,41,59,0.4)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Zap icon with indigo tint */}
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{
                                                background:
                                                    "rgba(99,102,241,0.1)",
                                                border: "1px solid rgba(99,102,241,0.15)",
                                            }}
                                        >
                                            <Zap
                                                className="w-3.5 h-3.5 text-indigo-400"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {gen.product_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60 capitalize mt-0.5">
                                                {gen.platform} · {gen.tone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <time
                                            dateTime={gen.created_at}
                                            className="text-xs text-muted-foreground/50"
                                        >
                                            {formatRelativeTime(gen.created_at)}
                                        </time>
                                        <span
                                            className="text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all duration-150 text-sm"
                                            aria-hidden="true"
                                        >
                                            →
                                        </span>
                                    </div>
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
    accentColor,
    children,
}: {
    label: string;
    value: React.ReactNode;
    sub: string;
    accentColor: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
            }}
        >
            {/* Top accent bar */}
            <div
                className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
                style={{ background: accentColor }}
                aria-hidden="true"
            />
            {/* Hover glow */}
            <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle at top left, ${accentColor}12, transparent 60%)`,
                }}
                aria-hidden="true"
            />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: accentColor }}
                        aria-hidden="true"
                    />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {label}
                    </p>
                </div>
                <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {value}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
                {children}
            </div>
        </div>
    );
}
