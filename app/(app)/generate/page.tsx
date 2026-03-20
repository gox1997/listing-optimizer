import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GenerationForm } from "@/components/generate/GenerationForm";
import { getUsageStats } from "@/services/usage.service";
import { getUserProfile } from "@/services/user.service";
import { GradientBorderCard } from "@/components/ui/GradientBorderCard";
import { Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Platform, Tone } from "@/types";

export default async function GeneratePage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    try {
        const [profile, stats] = await Promise.all([
            getUserProfile(user.id),
            getUsageStats(user.id),
        ]);

        const defaultPlatform = (profile?.defaultPlatform ??
            "amazon") as Platform;
        const defaultTone = (profile?.defaultTone ?? "professional") as Tone;
        const isAtLimit = !stats.allowed;
        const isNearLimit = stats.percentUsed >= 60 && !isAtLimit;
        const usagePercent = stats.percentUsed;

        return (
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5">
                            <Sparkles
                                className="w-6 h-6 text-indigo-400"
                                aria-hidden="true"
                            />
                            Generate Listing
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Fill in your product details — AI handles the rest.
                        </p>
                    </div>

                    {/* Usage mini-bar */}
                    <div className="shrink-0 text-right mt-12">
                        <p className="text-xs text-muted-foreground">
                            <span
                                className={cn(
                                    "font-bold font-mono",
                                    isAtLimit
                                        ? "text-red-400"
                                        : isNearLimit
                                          ? "text-amber-400"
                                          : "text-indigo-400",
                                )}
                            >
                                {stats.used}
                            </span>
                            <span className="text-muted-foreground/50">
                                {" "}
                                / {stats.limit}
                            </span>
                        </p>
                        <div className="w-24 h-1 bg-border rounded-full mt-1.5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
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
                                aria-valuemax={stats.limit}
                                aria-label="Generation usage"
                            />
                        </div>
                    </div>
                </div>

                {/* Limit banner */}
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
                                Upgrade to keep generating.
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

                {/* Form — animated gradient border card */}
                <GradientBorderCard>
                    <div className="p-6">
                        <GenerationForm
                            defaultPlatform={defaultPlatform}
                            defaultTone={defaultTone}
                        />
                    </div>
                </GradientBorderCard>
            </div>
        );
    } catch (error) {
        console.error("[GeneratePage] Failed to load data:", error);
        throw new Error(
            "Unable to load the generation page. Please try again.",
        );
    }
}
