"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CopyButton } from "./CopyButton";
import { cn } from "@/lib/utils/cn";
import {
    Tag,
    AlignLeft,
    List,
    Type,
    Search,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Sparkles,
    Lock,
    Award,
    TrendingUp,
    Copy,
    Check,
    RefreshCw,
    X,
} from "lucide-react";
import { apiPost } from "@/lib/utils/api";
import type { GenerationRow } from "@/services/generation.service";
import type { Plan, ListingScore, Platform, Tone } from "@/types";

const DESCRIPTION_PREVIEW_LENGTH = 300;

const PLAN_ORDER: Plan[] = [
    "free",
    "starter",
    "pro",
    "growth",
    "business",
    "agency",
];
const isPaidPlan = (plan: Plan) => PLAN_ORDER.indexOf(plan) >= 1;

// ── useTypewriter ────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 14) {
    const [index, setIndex] = useState(0);
    const [trackedText, setTrackedText] = useState(text);

    if (trackedText !== text) {
        setTrackedText(text);
        setIndex(0);
    }

    const displayed = text.slice(0, index);
    const done = index >= text.length;

    useEffect(() => {
        if (index >= text.length) return;
        const id = setTimeout(() => setIndex((i) => i + 1), speed);
        return () => clearTimeout(id);
    }, [index, text.length, speed]);

    return { displayed, done };
}

// ── useReveal ────────────────────────────────────────────────────────

function useReveal(delayMs: number) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const id = setTimeout(() => setVisible(true), delayMs);
        return () => clearTimeout(id);
    }, [delayMs]);
    return visible;
}

// ── useCopyAll ───────────────────────────────────────────────────────

function useCopyAll() {
    const [copied, setCopied] = useState(false);
    const copy = async (text: string) => {
        if (copied) return;
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return { copied, copy };
}

// ── usePostCopyToast ─────────────────────────────────────────────────
// Fires once per session — on the first copy action only

function usePostCopyToast(isPaid: boolean) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = () => {
        setVisible(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const trigger = () => {
        if (isPaid) return;
        if (sessionStorage.getItem("copy_toast_shown")) return;
        sessionStorage.setItem("copy_toast_shown", "1");
        setVisible(true);
        timerRef.current = setTimeout(() => setVisible(false), 5000);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { visible, trigger, dismiss };
}

// Add after usePostCopyToast hook
function useCountUp(target: number, duration = 1000) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);
    return value;
}
// ── Score helpers ────────────────────────────────────────────────────

function getScoreColor(value: number) {
    if (value >= 80) return "#10b981";
    if (value >= 60) return "#f59e0b";
    return "#ef4444";
}

function getScoreGlow(value: number) {
    if (value >= 80) return "rgba(16,185,129,0.35)";
    if (value >= 60) return "rgba(245,158,11,0.35)";
    return "rgba(239,68,68,0.35)";
}

// ── Props ────────────────────────────────────────────────────────────

type Props = {
    generation: GenerationRow;
    plan: Plan;
};

// ── Main component ───────────────────────────────────────────────────

export function GenerationResult({ generation, plan }: Props) {
    const router = useRouter();
    const output = generation.output_data;
    const score = output?.listingScore ?? null;
    const isPaid = isPaidPlan(plan);

    const [descExpanded, setDescExpanded] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const {
        visible: toastVisible,
        trigger: triggerToast,
        dismiss: dismissToast,
    } = usePostCopyToast(isPaid);

    const { displayed: titleDisplayed, done: titleDone } = useTypewriter(
        output?.seoTitle ?? "",
        14,
    );

    const titleDuration = (output?.seoTitle?.length ?? 0) * 14;
    const scoreVisible = useReveal(titleDuration + 200); // before bullets
    const bulletsVisible = useReveal(titleDuration + 500); // after score
    const descVisible = useReveal(titleDuration + 750);
    const metaVisible = useReveal(titleDuration + 950);
    const tagsVisible = useReveal(titleDuration + 1150);
    const ctaVisible = useReveal(titleDuration + 1350);

    const wordCount = useMemo(
        () =>
            output?.description.trim().split(/\s+/).filter(Boolean).length ?? 0,
        [output?.description],
    );

    const shortDescription = useMemo(
        () => output?.description.slice(0, DESCRIPTION_PREVIEW_LENGTH) ?? "",
        [output?.description],
    );

    const { copied: copiedAll, copy: copyAll } = useCopyAll();

    if (!output) {
        return (
            <div className="text-center py-16 text-muted-foreground/50 text-sm">
                Generation output is unavailable.
            </div>
        );
    }
    const allText = output
        ? [
              `SEO Title:\n${output.seoTitle}`,
              `\nBullet Points:\n${output.bulletPoints.map((b, i) => `${i + 1}. ${b}`).join("\n")}`,
              `\nDescription:\n${output.description}`,
              `\nMeta Description:\n${output.metaDescription}`,
              `\nTags:\n${output.tags.join(", ")}`,
          ].join("")
        : "";

    const needsExpand = output.description.length > DESCRIPTION_PREVIEW_LENGTH;

    return (
        <div className="space-y-3">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Back
                </button>

                <div className="flex items-center gap-3">
                    {/* Copy All */}
                    <button
                        type="button"
                        onClick={() => copyAll(allText)}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                            copiedAll
                                ? "text-emerald-400"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                        style={{
                            background: copiedAll
                                ? "rgba(16,185,129,0.1)"
                                : "rgba(255,255,255,0.05)",
                            border: copiedAll
                                ? "1px solid rgba(16,185,129,0.2)"
                                : "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {copiedAll ? (
                            <Check className="w-3.5 h-3.5" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedAll ? "Copied!" : "Copy All"}
                    </button>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        <span className="capitalize">
                            {generation.platform}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{generation.tone}</span>
                        <span>·</span>
                        <span className="text-muted-foreground/40">
                            {generation.tokens_used
                                ? `${generation.tokens_used} credits used`
                                : "—"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Listing Score ──────────────────────────────────── */}

            {score && (
                <div
                    style={{
                        transition: "opacity 0.6s ease, transform 0.6s ease",
                        opacity: scoreVisible ? 1 : 0,
                        transform: scoreVisible
                            ? "translateY(0)"
                            : "translateY(10px)",
                    }}
                >
                    <ScoreCard
                        score={score}
                        isPaid={isPaid}
                        onUnlock={() => setUpgradeModalOpen(true)}
                    />
                </div>
            )}

            {/* ── SEO Title — typewriter ─────────────────────────── */}
            <ResultCard
                id="seo-title"
                icon={<Type className="w-4 h-4" />}
                label="SEO Title"
                accentColor="#6366f1"
                copyText={output.seoTitle}
                copyLabel="title"
                onCopy={triggerToast}
            >
                <p className="text-base font-medium text-foreground leading-relaxed min-h-6">
                    {titleDisplayed}
                    {!titleDone && (
                        <span
                            className="inline-block w-0.5 h-4 ml-0.5 bg-indigo-400 align-middle"
                            style={{ animation: "cursor-blink 0.7s infinite" }}
                            aria-hidden="true"
                        />
                    )}
                </p>
                {titleDone && (
                    <p className="text-xs text-muted-foreground/50 mt-1.5">
                        {output.seoTitle.length} characters
                    </p>
                )}
            </ResultCard>

            {/* ── Bullet Points ──────────────────────────────────── */}
            {bulletsVisible && (
                <ResultCard
                    id="bullet-points"
                    icon={<List className="w-4 h-4" />}
                    label="Bullet Points"
                    accentColor="#8b5cf6"
                    copyText={output.bulletPoints.join("\n")}
                    copyLabel="bullets"
                    fadeIn
                    onCopy={triggerToast}
                >
                    <ul className="space-y-2.5" aria-label="Bullet points">
                        {output.bulletPoints.map((bullet, i) => (
                            <li
                                key={i}
                                className="flex gap-3 group"
                                style={{
                                    animation: "fade-up 0.4s ease forwards",
                                    animationDelay: `${i * 110}ms`,
                                    opacity: 0,
                                }}
                            >
                                <span
                                    className="shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold mt-0.5"
                                    style={{
                                        background: "rgba(139,92,246,0.15)",
                                        color: "#a78bfa",
                                        border: "1px solid rgba(139,92,246,0.25)",
                                    }}
                                    aria-hidden="true"
                                >
                                    {i + 1}
                                </span>
                                <div className="flex-1 flex items-start justify-between gap-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {bullet}
                                    </p>
                                    <CopyButton
                                        text={bullet}
                                        label={`bullet ${i + 1}`}
                                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0 transition-opacity"
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </ResultCard>
            )}

            {/* ── Description ────────────────────────────────────── */}
            {descVisible && (
                <ResultCard
                    id="description"
                    icon={<AlignLeft className="w-4 h-4" />}
                    label="Description"
                    accentColor="#6366f1"
                    copyText={output.description}
                    copyLabel="description"
                    fadeIn
                    onCopy={triggerToast}
                >
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {needsExpand && !descExpanded
                            ? shortDescription + "..."
                            : output.description}
                    </div>
                    {needsExpand && (
                        <button
                            type="button"
                            aria-expanded={descExpanded}
                            onClick={() => setDescExpanded((v) => !v)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded"
                        >
                            {descExpanded ? (
                                <>
                                    <ChevronUp
                                        className="w-3.5 h-3.5"
                                        aria-hidden="true"
                                    />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown
                                        className="w-3.5 h-3.5"
                                        aria-hidden="true"
                                    />
                                    Show more
                                </>
                            )}
                        </button>
                    )}
                    <p className="text-xs text-muted-foreground/50 mt-2">
                        {wordCount} words
                    </p>
                </ResultCard>
            )}

            {/* ── Meta Description ───────────────────────────────── */}
            {metaVisible && (
                <ResultCard
                    id="meta-description"
                    icon={<Search className="w-4 h-4" />}
                    label="Meta Description"
                    accentColor="#8b5cf6"
                    copyText={output.metaDescription}
                    copyLabel="meta description"
                    fadeIn
                    onCopy={triggerToast}
                >
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {output.metaDescription}
                    </p>
                    <p
                        className={cn(
                            "text-xs mt-1.5",
                            output.metaDescription.length > 160
                                ? "text-red-400"
                                : "text-muted-foreground/50",
                        )}
                    >
                        {output.metaDescription.length}/160 characters
                    </p>
                </ResultCard>
            )}

            {/* ── Tags ───────────────────────────────────────────── */}
            {tagsVisible && (
                <ResultCard
                    id="tags"
                    icon={<Tag className="w-4 h-4" />}
                    label="Tags"
                    accentColor="#a78bfa"
                    copyText={output.tags.join(", ")}
                    copyLabel="all tags"
                    fadeIn
                    onCopy={triggerToast}
                >
                    <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                        {output.tags.map((tag, i) => (
                            <li
                                key={i}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                                style={{
                                    background: "rgba(167,139,250,0.1)",
                                    color: "#a78bfa",
                                    border: "1px solid rgba(167,139,250,0.2)",
                                    animation: "fade-up 0.3s ease forwards",
                                    animationDelay: `${i * 55}ms`,
                                    opacity: 0,
                                }}
                            >
                                {tag}
                                <CopyButton
                                    text={tag}
                                    label={tag}
                                    className="border-0 bg-transparent p-0 hover:bg-transparent text-violet-400/60 hover:text-violet-300"
                                />
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-muted-foreground/50 mt-2">
                        {output.tags.length} tags
                    </p>
                </ResultCard>
            )}
            {/* ── Regenerate quick actions ──────────────── */}
            {tagsVisible && (
                <RegenerateActions
                    generation={generation}
                    isPaid={isPaid}
                    onUpgrade={() => setUpgradeModalOpen(true)}
                />
            )}
            {/* ── Bottom CTA — plan-gated ────────────────────────── */}
            {ctaVisible &&
                (isPaid ? (
                    // Paid: "Generate another"
                    <Link
                        href="/generate"
                        className="w-full flex items-center justify-center gap-2 py-3 mt-1 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{
                            border: "2px dashed rgba(255,255,255,0.1)",
                            animation: "fade-up 0.4s ease forwards",
                            opacity: 0,
                        }}
                    >
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                        Generate another listing
                    </Link>
                ) : (
                    // Free: emotion-driven upgrade CTA
                    <div
                        className="rounded-2xl p-6 text-center space-y-4"
                        style={{
                            background: "rgba(99,102,241,0.06)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            animation: "fade-up 0.4s ease forwards",
                            opacity: 0,
                        }}
                    >
                        <div>
                            <p className="font-bold text-foreground text-base">
                                Loving your listing?
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upgrade to Pro for 100 listings/month, score
                                breakdown, and keyword intelligence.
                            </p>
                        </div>

                        <Link
                            href="/upgrade"
                            className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                            style={{
                                background:
                                    "linear-gradient(135deg, #4f46e5, #7c3aed, #8b5cf6)",
                                boxShadow:
                                    "0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(139,92,246,0.15)",
                            }}
                        >
                            <span
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    background:
                                        "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)",
                                    backgroundSize: "200% 100%",
                                    animation:
                                        "shimmer-sweep 2.5s ease-in-out infinite",
                                }}
                                aria-hidden="true"
                            />
                            <span
                                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                                style={{ background: "rgba(255,255,255,0.3)" }}
                                aria-hidden="true"
                            />
                            <TrendingUp
                                className="w-4 h-4 relative"
                                aria-hidden="true"
                            />
                            <span className="relative">
                                Start Pro — 30-day guarantee
                            </span>
                        </Link>

                        <p className="text-xs text-muted-foreground/50">
                            Trusted by 500+ ecommerce sellers · Cancel anytime
                        </p>

                        <Link
                            href="/generate"
                            className="block text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                            Generate another free listing →
                        </Link>
                    </div>
                ))}

            {/* ── Upgrade modal (score breakdown lock) ─────────── */}
            {upgradeModalOpen && (
                <UpgradeModal onClose={() => setUpgradeModalOpen(false)} />
            )}
            {/* ── Post-copy toast — always mounted ─────── */}
            <PostCopyToast visible={toastVisible} onDismiss={dismissToast} />
        </div>
    );
}

GenerationResult.displayName = "GenerationResult";

// ── ScoreCard ─────────────────────────────────────────────────────────

function ScoreCard({
    score,
    isPaid,
    onUnlock,
}: {
    score: ListingScore;
    isPaid: boolean;
    onUnlock: () => void;
}) {
    const color = getScoreColor(score.overall);
    const glow = getScoreGlow(score.overall);
    const animatedScore = useCountUp(score.overall, 1200);

    return (
        <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
                animationDelay: "0.05s",
            }}
        >
            {/* Ambient glow from score color */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at top right, ${glow.replace("0.35", "0.06")}, transparent 60%)`,
                }}
                aria-hidden="true"
            />

            {/* Top accent */}
            <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: color, opacity: 0.6 }}
                aria-hidden="true"
            />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Award
                            className="w-4 h-4"
                            style={{ color }}
                            aria-hidden="true"
                        />
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Listing Score
                        </h2>
                    </div>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{
                            background: `${color}18`,
                            color,
                            border: `1px solid ${color}30`,
                        }}
                    >
                        {score.grade}
                    </span>
                </div>

                {/* Score number + bar */}
                <div className="flex items-end gap-3 mb-3">
                    <span
                        className="text-5xl font-bold font-mono leading-none tabular-nums"
                        style={{ color, textShadow: `0 0 24px ${glow}` }}
                    >
                        {animatedScore}
                    </span>
                    <div className="mb-1">
                        <span className="text-base text-muted-foreground/50">
                            /100
                        </span>
                    </div>
                </div>

                <div
                    className="h-1.5 rounded-full overflow-hidden mb-4"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${score.overall}%`,
                            background: `linear-gradient(90deg, ${color}80, ${color})`,
                            boxShadow: `0 0 8px ${glow}`,
                        }}
                    />
                </div>

                {/* Verdict */}
                <p className="text-xs text-muted-foreground/70 italic mb-4 leading-relaxed">
                    &ldquo;{score.verdict}&rdquo;
                </p>

                {/* Breakdown — locked for free users */}
                {isPaid ? (
                    <div className="space-y-2.5">
                        {Object.entries(score.breakdown).map(([key, value]) => (
                            <BreakdownRow
                                key={key}
                                label={key}
                                value={value as number}
                            />
                        ))}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onUnlock}
                        className="w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:border-indigo-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.07)",
                        }}
                    >
                        {/* Blurred breakdown preview */}
                        <div
                            className="space-y-2 blur-sm pointer-events-none select-none"
                            aria-hidden="true"
                        >
                            {Object.entries(score.breakdown).map(
                                ([key, value]) => (
                                    <BreakdownRow
                                        key={key}
                                        label={key}
                                        value={value as number}
                                    />
                                ),
                            )}
                        </div>

                        {/* Lock overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl">
                            <div
                                className="flex items-center justify-center w-8 h-8 rounded-full"
                                style={{
                                    background: "rgba(99,102,241,0.15)",
                                    border: "1px solid rgba(99,102,241,0.3)",
                                }}
                            >
                                <Lock
                                    className="w-3.5 h-3.5 text-indigo-400"
                                    aria-hidden="true"
                                />
                            </div>
                            <p className="text-xs font-semibold text-indigo-400">
                                Unlock score breakdown with Pro →
                            </p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
    const color = getScoreColor(value);
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground capitalize">
                    {label}
                </span>
                <span
                    className="text-xs font-mono font-semibold"
                    style={{ color }}
                >
                    {value}
                </span>
            </div>
            <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
            >
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${value}%`,
                        background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    }}
                />
            </div>
        </div>
    );
}

// ── ResultCard ────────────────────────────────────────────────────────

function ResultCard({
    id,
    icon,
    label,
    accentColor,
    copyText,
    copyLabel,
    fadeIn = false,
    onCopy,
    children,
}: {
    id: string;
    icon: React.ReactNode;
    label: string;
    accentColor: string;
    copyText: string;
    copyLabel: string;
    fadeIn?: boolean;
    onCopy?: () => void;
    children: React.ReactNode;
}) {
    const headingId = `${id}-heading`;
    return (
        <section
            aria-labelledby={headingId}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                ...(fadeIn && {
                    animation: "fade-up 0.5s ease forwards",
                    opacity: 0,
                }),
            }}
        >
            <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: accentColor, opacity: 0.55 }}
                aria-hidden="true"
            />
            <div className="flex items-center justify-between mb-3">
                <div
                    className="flex items-center gap-2"
                    style={{ color: accentColor, opacity: 0.85 }}
                >
                    <span aria-hidden="true">{icon}</span>
                    <h2
                        id={headingId}
                        className="text-xs font-semibold uppercase tracking-wider"
                    >
                        {label}
                    </h2>
                </div>
                <div onClick={onCopy}>
                    <CopyButton text={copyText} label={copyLabel} />
                </div>
            </div>
            <div id={`${id}-body`}>{children}</div>
        </section>
    );
}

// ── UpgradeModal ──────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
            }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl p-6 text-center space-y-4"
                style={{
                    background: "rgba(15,23,42,0.97)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 0 60px rgba(99,102,241,0.2)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.25)",
                    }}
                >
                    <Award
                        className="w-6 h-6 text-indigo-400"
                        aria-hidden="true"
                    />
                </div>

                <div>
                    <h2 className="text-lg font-bold text-foreground">
                        Unlock Score Breakdown
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        See exactly what&apos;s holding your score back — SEO,
                        Keywords, Conversion, and Compliance scores with
                        specific fixes.
                    </p>
                </div>

                <ul className="text-left space-y-2">
                    {[
                        "Detailed breakdown across 4 dimensions",
                        "Specific improvement suggestions",
                        "Keyword Intelligence panel",
                        "100 listings/month",
                    ].map((f) => (
                        <li
                            key={f}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <span
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-emerald-400"
                                style={{ background: "rgba(16,185,129,0.12)" }}
                            >
                                ✓
                            </span>
                            {f}
                        </li>
                    ))}
                </ul>

                <Link
                    href="/upgrade"
                    className="relative overflow-hidden flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{
                        background:
                            "linear-gradient(135deg, #4f46e5, #7c3aed, #8b5cf6)",
                        boxShadow: "0 0 30px rgba(99,102,241,0.4)",
                    }}
                >
                    <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)",
                            backgroundSize: "200% 100%",
                            animation:
                                "shimmer-sweep 2.5s ease-in-out infinite",
                        }}
                        aria-hidden="true"
                    />
                    <span className="relative">
                        Start Pro — 30-day guarantee
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}

// ── RegenerateActions ─────────────────────────────────────────────────

const TONES: { value: Tone; label: string }[] = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "luxury", label: "Luxury" },
    { value: "playful", label: "Playful" },
    { value: "technical", label: "Technical" },
];

const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
    { value: "amazon", label: "Amazon", icon: "/amazon-icon.svg" },
    { value: "shopify", label: "Shopify", icon: "/shopify-icon.svg" },
    { value: "etsy", label: "Etsy", icon: "/etsy-icon.svg" },
    { value: "general", label: "General", icon: "🌐" },
];

function RegenerateActions({
    generation,
    isPaid,
    onUpgrade,
}: {
    generation: GenerationRow;
    isPaid: boolean;
    onUpgrade: () => void;
}) {
    const router = useRouter();

    const currentTone = generation.tone as Tone;
    const currentPlatform = generation.platform as Platform;

    const [selectedTone, setSelectedTone] = useState<Tone>(currentTone);
    const [selectedPlatform, setSelectedPlatform] =
        useState<Platform>(currentPlatform);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasChanges =
        selectedTone !== currentTone || selectedPlatform !== currentPlatform;

    // ── Fix 2: user-friendly labels in button ────────────────────────
    const selectedToneLabel =
        TONES.find((t) => t.value === selectedTone)?.label ?? selectedTone;
    const selectedPlatformLabel =
        PLATFORMS.find((p) => p.value === selectedPlatform)?.label ??
        selectedPlatform;

    const handlePlatformSelect = (platform: Platform) => {
        if (!isPaid && platform !== currentPlatform) {
            onUpgrade();
            return;
        }
        setError(null);
        setSelectedPlatform(platform);
    };

    const handleToneSelect = (tone: Tone) => {
        setError(null);
        setSelectedTone(tone);
    };

    const handleRegenerate = async () => {
        if (isLoading || !hasChanges) return;
        setIsLoading(true);
        setError(null);

        const payload = {
            ...generation.input_data,
            tone: selectedTone,
            platform: selectedPlatform,
        };

        const result = await apiPost<{ generation: { id: string } }>(
            "/api/generate",
            payload,
        );

        if (!result.success) {
            // ── Fix 1: inline error on failure ───────────────────────
            setError(
                result.error?.code === "QUOTA_EXCEEDED"
                    ? "You've hit your monthly limit. Upgrade to keep generating."
                    : (result.error?.message ??
                          "Generation failed. Please try again."),
            );
            setIsLoading(false);
            return;
        }

        router.push(`/generate/${result.data.generation.id}`);
    };

    return (
        <div
            className="rounded-2xl p-4 space-y-4"
            style={{
                background: "rgba(99,102,241,0.04)",
                border: "1px solid rgba(99,102,241,0.15)",
                animation: "fade-up 0.5s ease forwards",
                opacity: 0,
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <RefreshCw
                    className="w-3.5 h-3.5 text-indigo-400/60"
                    aria-hidden="true"
                />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/60">
                    Regenerate with different settings
                </p>
            </div>

            {/* Tone selector */}
            <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground/50">Tone</p>
                <div className="flex flex-wrap gap-1.5">
                    {TONES.map((t) => {
                        const isSelected = selectedTone === t.value;
                        const isCurrent = currentTone === t.value;
                        return (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => handleToneSelect(t.value)}
                                disabled={isLoading}
                                aria-pressed={isSelected}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                                style={{
                                    background: isSelected
                                        ? "rgba(99,102,241,0.18)"
                                        : "rgba(255,255,255,0.04)",
                                    border: isSelected
                                        ? "1px solid rgba(99,102,241,0.5)"
                                        : "1px solid rgba(255,255,255,0.08)",
                                    color: isSelected ? "#a5b4fc" : "#64748b",
                                }}
                            >
                                {t.label}
                                {isCurrent && !isSelected && (
                                    <span className="text-muted-foreground/30 text-[10px]">
                                        current
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Platform selector */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <p className="text-xs text-muted-foreground/50">Platform</p>
                    {!isPaid && (
                        <span
                            className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                            style={{
                                background: "rgba(99,102,241,0.1)",
                                color: "#818cf8",
                                border: "1px solid rgba(99,102,241,0.2)",
                            }}
                        >
                            <Lock className="w-2.5 h-2.5" aria-hidden="true" />
                            Pro
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS.map((p) => {
                        const isSelected = selectedPlatform === p.value;
                        const isCurrent = currentPlatform === p.value;
                        const isLocked = !isPaid && p.value !== currentPlatform;
                        return (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => handlePlatformSelect(p.value)}
                                disabled={isLoading}
                                aria-pressed={isSelected}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                                style={{
                                    background: isSelected
                                        ? "rgba(99,102,241,0.18)"
                                        : "rgba(255,255,255,0.04)",
                                    border: isSelected
                                        ? "1px solid rgba(99,102,241,0.5)"
                                        : isLocked
                                          ? "1px solid rgba(255,255,255,0.05)"
                                          : "1px solid rgba(255,255,255,0.08)",
                                    color: isSelected
                                        ? "#a5b4fc"
                                        : isLocked
                                          ? "#475569"
                                          : "#64748b",
                                }}
                            >
                                {/* ── Fix 3: platform icon as img ──── */}
                                {isLocked ? (
                                    <Lock
                                        className="w-3 h-3 opacity-40"
                                        aria-hidden="true"
                                    />
                                ) : p.value !== "general" ? (
                                    <Image
                                        src={`/${p.value}-icon.svg`}
                                        alt=""
                                        width={14}
                                        height={14}
                                        className="w-3.5 h-3.5 object-contain"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <span
                                        className="text-xs leading-none"
                                        aria-hidden="true"
                                    >
                                        🌐
                                    </span>
                                )}
                                {p.label}
                                {isCurrent && !isSelected && (
                                    <span className="text-muted-foreground/30 text-[10px]">
                                        current
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Fix 1: inline error message ─────────────────────── */}
            {error && (
                <p
                    className="text-xs px-3 py-2 rounded-lg"
                    style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#fca5a5",
                    }}
                    role="alert"
                >
                    {error}
                    {error.includes("limit") && (
                        <Link
                            href="/upgrade"
                            className="ml-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Upgrade →
                        </Link>
                    )}
                </p>
            )}

            {/* Generate button */}
            <button
                type="button"
                onClick={handleRegenerate}
                disabled={isLoading || !hasChanges}
                className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                style={{
                    background: hasChanges
                        ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                        : "rgba(255,255,255,0.05)",
                    border: hasChanges
                        ? "none"
                        : "1px solid rgba(255,255,255,0.08)",
                    color: hasChanges ? "white" : "#475569",
                    boxShadow: hasChanges
                        ? "0 0 20px rgba(99,102,241,0.25)"
                        : "none",
                    cursor: !hasChanges ? "not-allowed" : "pointer",
                }}
            >
                {hasChanges && !isLoading && (
                    <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)",
                            backgroundSize: "200% 100%",
                            animation:
                                "shimmer-sweep 2.5s ease-in-out infinite",
                        }}
                        aria-hidden="true"
                    />
                )}

                {isLoading ? (
                    <>
                        <span
                            className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white"
                            style={{ animation: "spin 0.8s linear infinite" }}
                            aria-hidden="true"
                        />
                        Generating...
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                        {/* ── Fix 2: user-friendly label ──────────── */}
                        {hasChanges
                            ? `Regenerate as ${selectedPlatform !== currentPlatform ? selectedPlatformLabel + " · " : ""}${selectedToneLabel}`
                            : "Select a different tone or platform"}
                    </>
                )}
            </button>
        </div>
    );
}

// ── PostCopyToast ─────────────────────────────────────────────────────

function PostCopyToast({
    visible,
    onDismiss,
}: {
    visible: boolean;
    onDismiss: () => void;
}) {
    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible
                    ? "translateX(-50%) translateY(0)"
                    : "translateX(-50%) translateY(16px)",
                pointerEvents: visible ? "auto" : "none",
            }}
            role="status"
            aria-live="polite"
        >
            <div
                className="relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white shadow-2xl"
                style={{
                    background: "rgba(15,23,42,0.97)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    backdropFilter: "blur(16px)",
                    boxShadow:
                        "0 0 40px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.4)",
                    whiteSpace: "nowrap",
                }}
            >
                {/* Gradient left accent */}
                <div
                    className="absolute left-0 inset-y-0 w-0.5 rounded-l-2xl"
                    style={{
                        background: "linear-gradient(180deg, #6366f1, #8b5cf6)",
                    }}
                    aria-hidden="true"
                />

                <span className="text-base" aria-hidden="true">
                    ✨
                </span>
                <span className="text-foreground">
                    Loving this?{" "}
                    <Link
                        href="/upgrade"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                        onClick={onDismiss}
                    >
                        Upgrade to Pro
                    </Link>{" "}
                    for 100 listings/month.
                </span>

                <button
                    type="button"
                    onClick={onDismiss}
                    className="ml-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors focus-visible:outline-none"
                    aria-label="Dismiss"
                >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
