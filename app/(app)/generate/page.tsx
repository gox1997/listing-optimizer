// app/(app)/generate/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GenerationForm } from "@/components/generate/GenerationForm";
import { getUsageStats } from "@/services/usage.service";
import { getUserProfile } from "@/services/user.service";
import { Sparkles } from "lucide-react";
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
                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Sparkles className="w-5 h-5" aria-hidden="true" />
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            Generate Listing
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base font-mono mt-1">
                            Fill in your product details and let the AI do the
                            rest.
                        </p>
                    </div>

                    {/* Usage badge */}
                    <div className="shrink-0 text-right mt-3">
                        <p className="text-xs text-muted-foreground pt-12">
                            <span className="font-semibold text-foreground">
                                {stats.used}
                            </span>
                            {" / "}
                            {stats.limit} used
                        </p>
                        <div className="w-28 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    isAtLimit
                                        ? "bg-red-500"
                                        : isNearLimit
                                          ? "bg-amber-500"
                                          : "bg-emerald-500",
                                )}
                                style={{ width: `${usagePercent}%` }}
                                role="progressbar"
                                aria-valuenow={stats.used}
                                aria-valuemin={0}
                                aria-valuemax={stats.limit}
                                aria-label="Generation usage"
                            />
                        </div>
                    </div>
                </div>

                {/* Near-limit / at-limit banner */}
                {(isAtLimit || isNearLimit) && (
                    <div
                        role="alert"
                        className={cn(
                            "p-4 rounded-xl text-sm flex items-center justify-between gap-4",
                            isAtLimit
                                ? "bg-red-50 border border-red-200 text-red-800"
                                : "bg-amber-50 border border-amber-200 text-amber-800",
                        )}
                    >
                        <p>
                            {isAtLimit ? (
                                <>
                                    You&apos;ve used all{" "}
                                    <strong>{stats.limit}</strong> generations
                                    this month.
                                </>
                            ) : (
                                <>
                                    You&apos;ve used {usagePercent}% of your
                                    monthly generations.
                                </>
                            )}{" "}
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

                {/* Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <GenerationForm
                        defaultPlatform={defaultPlatform}
                        defaultTone={defaultTone}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error("[GeneratePage] Failed to load data:", error);
        throw new Error(
            "Unable to load the generation page. Please try again.",
        );
    }
}
