"use client";
// app/onboarding/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/utils/api";
import { PLATFORMS } from "@/config/platforms";
import { TONES } from "@/config/tones";
import { cn } from "@/lib/utils/cn";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import type { Platform, Tone } from "@/types";

/* ------------------------------------------------------------------ */
/*  Module-scope constants                                              */
/* ------------------------------------------------------------------ */

const NICHES = [
    { value: "home_garden", label: "Home & Garden", emoji: "🏠" },
    { value: "fashion", label: "Fashion", emoji: "👗" },
    { value: "electronics", label: "Electronics", emoji: "💻" },
    { value: "beauty", label: "Beauty", emoji: "💄" },
    { value: "sports", label: "Sports", emoji: "⚽" },
    { value: "toys", label: "Toys & Games", emoji: "🧸" },
    { value: "food", label: "Food", emoji: "🍎" },
    { value: "other", label: "Other", emoji: "📦" },
];

const TOTAL_STEPS = 3;

type OnboardingState = {
    platform: Platform;
    niche: string;
    tone: Tone;
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState<OnboardingState>({
        platform: "amazon",
        niche: "",
        tone: "professional",
    });

    const update = (field: keyof OnboardingState, value: string) =>
        setData((prev) => ({ ...prev, [field]: value }));

    const handleFinish = async () => {
        setIsSaving(true);
        setError(null);

        const result = await apiPatch("/api/user/profile", {
            defaultPlatform: data.platform,
            defaultTone: data.tone,
            niche: data.niche || null,
            onboardingCompleted: true,
        });

        setIsSaving(false);

        if (result.success) {
            router.push("/generate");
        } else {
            setError(
                "Failed to save preferences. You can update them in Settings.",
            );
            setTimeout(() => router.push("/generate"), 2000);
        }
    };

    const progressWidth = `${(step / TOTAL_STEPS) * 100}%`;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl mb-3">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Welcome aboard!
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Quick setup — 3 questions to personalize your experience
                    </p>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-200 rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-300"
                        style={{ width: progressWidth }}
                    />
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Step {step} of {TOTAL_STEPS}
                    </div>

                    {/* Step 1 — Platform */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">
                                    Where do you primarily sell?
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    We&apos;ll optimize listings for this
                                    platform by default.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {PLATFORMS.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() =>
                                            update("platform", p.value)
                                        }
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-left transition-all",
                                            data.platform === p.value
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200 hover:border-slate-300",
                                        )}
                                    >
                                        <p className="font-semibold text-sm text-slate-900">
                                            {p.label}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 leading-snug">
                                            {p.description}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors"
                            >
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Step 2 — Niche */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">
                                    What&apos;s your product niche?
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    Helps us give better suggestions and tips.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {NICHES.map((n) => (
                                    <button
                                        key={n.value}
                                        onClick={() => update("niche", n.value)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all",
                                            data.niche === n.value
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 text-slate-700 hover:border-slate-300",
                                        )}
                                    >
                                        <span>{n.emoji}</span>
                                        {n.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors"
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Tone */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">
                                    What&apos;s your brand voice?
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    This sets the default tone for your
                                    listings.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {TONES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => update("tone", t.value)}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                                            data.tone === t.value
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200 hover:border-slate-300",
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm text-slate-900">
                                                {t.label}
                                            </p>
                                            {data.tone === t.value && (
                                                <Check className="w-4 h-4 text-slate-900" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {t.description}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 italic">
                                            {t.example}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleFinish}
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 disabled:opacity-60 transition-colors"
                                >
                                    {isSaving ? (
                                        "Saving..."
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />{" "}
                                            Start Generating
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
