"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import type { GenerationRow } from "@/services/generation.service";

const DESCRIPTION_PREVIEW_LENGTH = 300;

// Replace lines 24–52 — entire useTypewriter hook
function useTypewriter(text: string, speed = 14) {
    const [index, setIndex] = useState(0);
    const [trackedText, setTrackedText] = useState(text);

    // React-approved "adjust state when prop changes" pattern.
    // setState during render (inside a conditional) is explicitly
    // documented at react.dev/learn/you-might-not-need-an-effect
    // No ref access, no effect, no cascade.
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

// ── Delayed reveal — unmounts until delay expires ──────────────────
function useReveal(delayMs: number) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const id = setTimeout(() => setVisible(true), delayMs);
        return () => clearTimeout(id);
    }, [delayMs]);
    return visible;
}

// ── Props ──────────────────────────────────────────────────────────
type Props = { generation: GenerationRow };

export function GenerationResult({ generation }: Props) {
    const router = useRouter();
    const output = generation.output_data;
    const [descExpanded, setDescExpanded] = useState(false);

    // Typewriter on SEO title
    const { displayed: titleDisplayed, done: titleDone } = useTypewriter(
        output?.seoTitle ?? "",
        14,
    );

    // Calculate when title finishes, then stagger the rest
    const titleDuration = (output?.seoTitle?.length ?? 0) * 14;
    const bulletsVisible = useReveal(titleDuration + 120);
    const descVisible = useReveal(titleDuration + 450);
    const metaVisible = useReveal(titleDuration + 650);
    const tagsVisible = useReveal(titleDuration + 850);
    const ctaVisible = useReveal(titleDuration + 1050);

    const wordCount = useMemo(
        () =>
            output?.description.trim().split(/\s+/).filter(Boolean).length ?? 0,
        [output?.description],
    );

    const shortDescription = useMemo(
        () => output?.description.slice(0, DESCRIPTION_PREVIEW_LENGTH) ?? "",
        [output?.description],
    );

    if (!output) {
        return (
            <div className="text-center py-16 text-muted-foreground/50 text-sm">
                Generation output is unavailable.
            </div>
        );
    }

    const needsExpand = output.description.length > DESCRIPTION_PREVIEW_LENGTH;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Back
                </button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <span className="capitalize">{generation.platform}</span>
                    <span>·</span>
                    <span className="capitalize">{generation.tone}</span>
                    <span>·</span>
                    <span>{generation.tokens_used ?? "—"} tokens</span>
                </div>
            </div>

            {/* ── SEO Title — typewriter ─────────────────────────── */}
            <ResultCard
                id="seo-title"
                icon={<Type className="w-4 h-4" />}
                label="SEO Title"
                accentColor="#6366f1"
                copyText={output.seoTitle}
                copyLabel="title"
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

            {/* ── Bullet Points — staggered fade-up ─────────────── */}
            {bulletsVisible && (
                <ResultCard
                    id="bullet-points"
                    icon={<List className="w-4 h-4" />}
                    label="Bullet Points"
                    accentColor="#8b5cf6"
                    copyText={output.bulletPoints.join("\n")}
                    copyLabel="bullets"
                    fadeIn
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

            {/* ── Description — fade in ──────────────────────────── */}
            {descVisible && (
                <ResultCard
                    id="description"
                    icon={<AlignLeft className="w-4 h-4" />}
                    label="Description"
                    accentColor="#6366f1"
                    copyText={output.description}
                    copyLabel="description"
                    fadeIn
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

            {/* ── Meta Description — fade in ─────────────────────── */}
            {metaVisible && (
                <ResultCard
                    id="meta-description"
                    icon={<Search className="w-4 h-4" />}
                    label="Meta Description"
                    accentColor="#8b5cf6"
                    copyText={output.metaDescription}
                    copyLabel="meta description"
                    fadeIn
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

            {/* ── Tags — stagger pop ─────────────────────────────── */}
            {tagsVisible && (
                <ResultCard
                    id="tags"
                    icon={<Tag className="w-4 h-4" />}
                    label="Tags"
                    accentColor="#a78bfa"
                    copyText={output.tags.join(", ")}
                    copyLabel="all tags"
                    fadeIn
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

            {/* ── Generate another ───────────────────────────────── */}
            {ctaVisible && (
                <Link
                    href="/generate"
                    className="w-full flex items-center justify-center gap-2 py-3 mt-1 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    style={{
                        border: "2px dashed rgba(255,255,255,0.1)",
                        animation: "fade-up 0.4s ease forwards",
                        opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(99,102,241,0.4)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(255,255,255,0.1)";
                    }}
                >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    Generate another listing
                </Link>
            )}
        </div>
    );
}

GenerationResult.displayName = "GenerationResult";

// ── ResultCard ─────────────────────────────────────────────────────

function ResultCard({
    id,
    icon,
    label,
    accentColor,
    copyText,
    copyLabel,
    fadeIn = false,
    children,
}: {
    id: string;
    icon: React.ReactNode;
    label: string;
    accentColor: string;
    copyText: string;
    copyLabel: string;
    fadeIn?: boolean;
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
            {/* Per-card accent top line */}
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
                <CopyButton text={copyText} label={copyLabel} />
            </div>

            <div id={`${id}-body`}>{children}</div>
        </section>
    );
}
