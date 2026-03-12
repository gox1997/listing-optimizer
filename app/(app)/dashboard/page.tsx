"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { PLATFORMS } from "@/config";
import { TONES } from "@/config";
import { cn } from "@/lib/utils/cn";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { Platform, Tone, Niche } from "@/types";

const NICHES: { value: Niche; label: string; emoji: string }[] = [
    { value: "fashion", label: "Fashion & Apparel", emoji: "👗" },
    { value: "electronics", label: "Electronics & Tech", emoji: "📱" },
    { value: "home_garden", label: "Home & Garden", emoji: "🏡" },
    { value: "sports", label: "Sports & Outdoors", emoji: "⚽" },
    { value: "beauty", label: "Beauty & Personal Care", emoji: "💄" },
    { value: "toys", label: "Toys & Games", emoji: "🧸" },
    { value: "food", label: "Food & Grocery", emoji: "🍕" },
    { value: "other", label: "Other", emoji: "📦" },
];

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClientSupabaseClient();

    const [step, setStep] = useState<Step>(1);
    const [platform, setPlatform] = useState<Platform>("amazon");
    const [niche, setNiche] = useState<Niche>("other");
    const [tone, setTone] = useState<Tone>("professional");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFinish = async () => {
        setIsSaving(true);
        setError(null);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            router.push("/auth");
            return;
        }

        const { error } = await supabase
            .from("user_profiles")
            .update({
                default_platform: platform,
                niche,
                default_tone: tone,
                onboarding_completed: true,
            })
            .eq("id", user.id);

        if (error) {
            setError(error.message);
            setIsSaving(false);
            return;
        }

        router.push("/dashboard");
    };

    const STEP_LABELS = ["Your Platform", "Your Niche", "Your Tone"];

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 mask-[radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none" />

            <div className="relative w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-slate-900 to-slate-700 rounded-2xl mb-4 shadow-lg shadow-slate-900/10">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Let&apos;s set up your account
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Takes 30 seconds — helps us tailor the AI to your store
                    </p>
                </div>

                {/* Step indicators (refined) */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {([1, 2, 3] as Step[]).map((s, idx) => (
                        <div key={s} className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                                    step === s
                                        ? "bg-slate-900 text-white ring-4 ring-slate-900/10 scale-110"
                                        : step > s
                                          ? "bg-emerald-500 text-white"
                                          : "bg-slate-100 text-slate-400 border border-slate-200",
                                )}
                            >
                                {step > s ? <Check className="w-5 h-5" /> : s}
                            </div>
                            {idx < 2 && (
                                <div
                                    className={cn(
                                        "w-12 h-0.5 rounded-full transition-colors",
                                        step > s
                                            ? "bg-emerald-500"
                                            : "bg-slate-200",
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Main Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
                    {/* Step 1 — Platform */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Where do you primarily sell?
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {PLATFORMS.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => setPlatform(p.value)}
                                        className={cn(
                                            "p-5 rounded-2xl border-2 text-left transition-all duration-200",
                                            "hover:border-slate-300 hover:shadow-md hover:shadow-slate-100",
                                            platform === p.value
                                                ? "border-slate-900 bg-slate-50 shadow-lg shadow-slate-100"
                                                : "border-slate-200",
                                        )}
                                    >
                                        <p className="font-semibold text-slate-900">
                                            {p.label}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1 leading-snug">
                                            {p.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Niche */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                What do you sell?
                            </h2>
                            <div className="grid grid-cols-2 gap-2">
                                {NICHES.map((n) => (
                                    <button
                                        key={n.value}
                                        onClick={() => setNiche(n.value)}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-left transition-all duration-200",
                                            "hover:border-slate-300 hover:shadow-md hover:shadow-slate-100",
                                            niche === n.value
                                                ? "border-slate-900 bg-slate-50 shadow-lg shadow-slate-100"
                                                : "border-slate-200",
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">
                                                {n.emoji}
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">
                                                {n.label}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Tone */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                What&apos;s your brand voice?
                            </h2>
                            <div className="space-y-2">
                                {TONES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTone(t.value)}
                                        className={cn(
                                            "w-full p-5 rounded-2xl border-2 text-left transition-all duration-200",
                                            "hover:border-slate-300 hover:shadow-md hover:shadow-slate-100",
                                            tone === t.value
                                                ? "border-slate-900 bg-slate-50 shadow-lg shadow-slate-100"
                                                : "border-slate-200",
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-900">
                                                {t.label}
                                            </p>
                                            {tone === t.value && (
                                                <Check className="w-5 h-5 text-slate-900" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {t.description}
                                        </p>
                                        <p className="text-sm text-slate-400 mt-2 italic border-l-2 border-slate-200 pl-3">
                                            {t.example}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <p className="mt-5 text-sm text-red-600 text-center bg-red-50 p-3 rounded-xl border border-red-100">
                            {error}
                        </p>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={() =>
                                setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
                            }
                            disabled={step === 1}
                            className={cn(
                                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl",
                                "text-sm font-medium text-slate-600 bg-white border border-slate-200",
                                "hover:bg-slate-50 hover:border-slate-300 transition-all duration-200",
                                "shadow-sm hover:shadow",
                                "disabled:opacity-0 disabled:pointer-events-none",
                            )}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={() =>
                                    setStep((s) =>
                                        s < 3 ? ((s + 1) as Step) : s,
                                    )
                                }
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-xl"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {isSaving ? "Saving..." : "Finish Setup"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Subtle footer note */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    You can change these later in Settings
                </p>
            </div>
        </div>
    );
}
