// app/(app)/generate/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GenerationForm } from "@/components/generate/GenerationForm";
import { getUsageStats } from "@/services/usage.service";
import { Sparkles } from "lucide-react";
import type { Platform, Tone } from "@/types";

export default async function GeneratePage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/auth");
    }

    try {
        const [profileResult, stats] = await Promise.all([
            supabase
                .from("user_profiles")
                .select("default_platform, default_tone")
                .eq("id", user.id)
                .single(),
            getUsageStats(user.id),
        ]);

        const defaultPlatform = (profileResult.data?.default_platform ??
            "amazon") as Platform;
        const defaultTone = (profileResult.data?.default_tone ??
            "professional") as Tone;

        const isAtLimit = !stats.allowed;
        const usagePercent = stats.percentUsed; // already clamped 0-100 by the service

        return (
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" aria-hidden="true" />
                            Generate Listing
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Fill in your product details and let the AI do the
                            rest.
                        </p>
                    </div>

                    {/* Usage badge */}
                    <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-500">
                            {stats.limit === Infinity ? (
                                <span className="font-semibold text-slate-900">
                                    Unlimited
                                </span>
                            ) : (
                                <>
                                    <span className="font-semibold text-slate-900">
                                        {stats.used}
                                    </span>
                                    {" / "}
                                    {stats.limit} used
                                </>
                            )}
                        </p>
                        {stats.limit !== Infinity && (
                            <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        usagePercent >= 90
                                            ? "bg-red-500"
                                            : usagePercent >= 70
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${usagePercent}%` }}
                                    role="progressbar"
                                    aria-valuenow={stats.used}
                                    aria-valuemin={0}
                                    aria-valuemax={stats.limit}
                                    aria-label="Generation usage"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* At-limit banner */}
                {isAtLimit && (
                    <div
                        role="alert"
                        className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center justify-between gap-4"
                    >
                        <p>
                            You&apos;ve used all <strong>{stats.limit}</strong>{" "}
                            generations for this month.
                        </p>
                        <Link
                            href="/upgrade"
                            className="shrink-0 px-3 py-1.5 bg-amber-800 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                        >
                            Upgrade
                        </Link>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <GenerationForm
                        defaultPlatform={defaultPlatform}
                        defaultTone={defaultTone}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error("[GeneratePage] Failed to load data:", error);
        // You can throw a custom error or render a fallback
        throw new Error(
            "Unable to load the generation page. Please try again.",
        );
    }
}
