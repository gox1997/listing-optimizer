"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/utils/api";
import { PLATFORMS } from "@/config/platforms";
import { TONES } from "@/config/tones";
import { cn } from "@/lib/utils/cn";
import { Gem, ArrowRight, Check } from "lucide-react";
import type { Platform, Tone } from "@/types";

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
            setError("Failed to save. Taking you to the app anyway.");
            setTimeout(() => router.push("/generate"), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
            >
                <div
                    className="absolute -top-40 left-1/2 -translate-x-1/2 h-125 w-125 rounded-full opacity-[0.07]"
                    style={{
                        background:
                            "radial-gradient(circle, #8b5cf6, transparent 70%)",
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3"
                        style={{
                            background:
                                "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                        }}
                    >
                        <Gem className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Welcome to ListingGem
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        3 quick questions to personalize your experience
                    </p>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-border rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${(step / TOTAL_STEPS) * 100}%`,
                            background:
                                "linear-gradient(90deg, #06b6d4, #8b5cf6)",
                        }}
                    />
                </div>

                {/* Card */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Step {step} of {TOTAL_STEPS}
                    </p>

                    {/* ── Step 1 — Platform ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    Where do you primarily sell?
                                </h2>
                                <p className="text-muted-foreground text-sm">
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
                                            "p-4 rounded-xl border-2 text-left transition-all duration-150",
                                            data.platform === p.value
                                                ? "border-cyan-500/60 bg-cyan-500/10 text-foreground"
                                                : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        <p className="font-semibold text-sm">
                                            {p.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                            {p.description}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                                }}
                            >
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* ── Step 2 — Niche ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    What&apos;s your product niche?
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Helps us give better AI suggestions.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {NICHES.map((n) => (
                                    <button
                                        key={n.value}
                                        onClick={() => update("niche", n.value)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all duration-150",
                                            data.niche === n.value
                                                ? "border-purple-500/60 bg-purple-500/10 text-foreground"
                                                : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        <span className="text-base">
                                            {n.emoji}
                                        </span>
                                        {n.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                                    }}
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3 — Tone ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    What&apos;s your brand voice?
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Sets the default tone for your listings.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {TONES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => update("tone", t.value)}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 text-left transition-all duration-150",
                                            data.tone === t.value
                                                ? "border-cyan-500/60 bg-cyan-500/10"
                                                : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/60",
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm text-foreground">
                                                {t.label}
                                            </p>
                                            {data.tone === t.value && (
                                                <Check className="w-4 h-4 text-cyan-400" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 mt-1 italic">
                                            {t.example}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <p className="text-sm text-red-400">{error}</p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleFinish}
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                                    }}
                                >
                                    {isSaving ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Gem className="w-4 h-4" />
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
