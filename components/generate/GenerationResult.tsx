// components/generate/GenerationResult.tsx
"use client";

import { useState, useMemo } from "react";
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

type Props = {
    generation: GenerationRow;
};

export function GenerationResult({ generation }: Props) {
    const router = useRouter();
    const output = generation.output_data;

    const [descExpanded, setDescExpanded] = useState(false);

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
            <div className="text-center py-16 text-slate-400 text-sm">
                Generation output is unavailable.
            </div>
        );
    }

    const needsExpand = output.description.length > DESCRIPTION_PREVIEW_LENGTH;

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Back
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="capitalize">{generation.platform}</span>
                    <span>·</span>
                    <span className="capitalize">{generation.tone}</span>
                    <span>·</span>
                    <span>{generation.tokens_used ?? "—"} tokens</span>
                </div>
            </div>

            {/* SEO Title */}
            <ResultCard
                id="seo-title"
                icon={<Type className="w-4 h-4" />}
                label="SEO Title"
                copyText={output.seoTitle}
                copyLabel="title"
            >
                <p className="text-base font-medium text-slate-900 leading-relaxed">
                    {output.seoTitle}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    {output.seoTitle.length} characters
                </p>
            </ResultCard>

            {/* Bullet Points */}
            <ResultCard
                id="bullet-points"
                icon={<List className="w-4 h-4" />}
                label="Bullet Points"
                copyText={output.bulletPoints.join("\n")}
                copyLabel="bullets"
            >
                <ul className="space-y-2" aria-label="Bullet points">
                    {output.bulletPoints.map((bullet, i) => (
                        <li key={i} className="flex gap-2 group">
                            <span
                                className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-semibold mt-0.5"
                                aria-hidden="true"
                            >
                                {i + 1}
                            </span>
                            <div className="flex-1 flex items-start justify-between gap-2">
                                <p className="text-base text-slate-700 leading-relaxed">
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

            {/* Description */}
            <ResultCard
                id="description"
                icon={<AlignLeft className="w-4 h-4" />}
                label="Description"
                copyText={output.description}
                copyLabel="description"
            >
                <div
                    id="description-body"
                    className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap"
                >
                    {needsExpand && !descExpanded
                        ? shortDescription + "..."
                        : output.description}
                </div>

                {needsExpand && (
                    <button
                        type="button"
                        aria-expanded={descExpanded}
                        aria-controls="description-body"
                        onClick={() => setDescExpanded((v) => !v)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
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

                <p className="text-xs text-slate-400 mt-2">{wordCount} words</p>
            </ResultCard>

            {/* Meta Description */}
            <ResultCard
                id="meta-description"
                icon={<Search className="w-4 h-4" />}
                label="Meta Description"
                copyText={output.metaDescription}
                copyLabel="meta description"
            >
                <p className="text-base text-slate-700 leading-relaxed">
                    {output.metaDescription}
                </p>
                <p
                    className={cn(
                        "text-xs mt-1",
                        output.metaDescription.length > 160
                            ? "text-red-500"
                            : "text-slate-400",
                    )}
                >
                    {output.metaDescription.length}/160 characters
                </p>
            </ResultCard>

            {/* Tags */}
            <ResultCard
                id="tags"
                icon={<Tag className="w-4 h-4" />}
                label="Tags"
                copyText={output.tags.join(", ")}
                copyLabel="all tags"
            >
                <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                    {output.tags.map((tag, i) => (
                        <li
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
                        >
                            {tag}
                            <CopyButton
                                text={tag}
                                label={tag}
                                className="border-0 bg-transparent p-0 hover:bg-transparent text-slate-400 hover:text-slate-700"
                            />
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-slate-400 mt-2">
                    {output.tags.length} tags
                </p>
            </ResultCard>

            {/* Generate another */}
            <Link
                href="/generate"
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 mt-2",
                    "border-2 border-dashed border-slate-200 rounded-xl",
                    "text-sm font-medium text-slate-500",
                    "hover:border-slate-900 hover:text-slate-900 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
                )}
            >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Generate another listing
            </Link>
        </div>
    );
}

GenerationResult.displayName = "GenerationResult";

function ResultCard({
    id,
    icon,
    label,
    copyText,
    copyLabel,
    children,
}: {
    id: string;
    icon: React.ReactNode;
    label: string;
    copyText: string;
    copyLabel: string;
    children: React.ReactNode;
}) {
    const headingId = `${id}-heading`;

    return (
        <section
            aria-labelledby={headingId}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-500">
                    <span aria-hidden="true">{icon}</span>
                    <h2
                        id={headingId}
                        className="text-xs font-semibold uppercase tracking-wider text-slate-500"
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
