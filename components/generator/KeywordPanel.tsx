"use client";

// components/generator/KeywordPanel.tsx
//
// Renders the Keyword Intelligence results returned by the AI pipeline.
// Displayed on the generate/[id] result page below the listing output.
//
// Design rules:
//   - Matches the dark glass aesthetic of OutputPanel.tsx
//   - Every keyword chip is individually copyable
//   - avoidTerms are styled as red "danger" chips — visually distinct
//   - buyerIntent maps to a human-readable label + color
//   - competitorGap is the hero insight — gets the most visual weight

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Copy,
    Check,
    AlertTriangle,
    Users,
    Target,
    Lightbulb,
    TrendingUp,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { KeywordResult, KeywordBuyerIntent } from "@/types";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface Props {
    keywords: KeywordResult;
    /** Platform context — used to label platformTerms correctly */
    platform: string;
}

/* ------------------------------------------------------------------ */
/*  Buyer intent config                                                  */
/* ------------------------------------------------------------------ */

const INTENT_CONFIG: Record<
    KeywordBuyerIntent,
    { label: string; color: string; bg: string; border: string }
> = {
    transactional: {
        label: "Ready to Buy",
        color: "#34d399",
        bg: "rgba(52,211,153,0.1)",
        border: "rgba(52,211,153,0.25)",
    },
    gift: {
        label: "Gift Purchase",
        color: "#f472b6",
        bg: "rgba(244,114,182,0.1)",
        border: "rgba(244,114,182,0.25)",
    },
    replacement: {
        label: "Replacement",
        color: "#60a5fa",
        bg: "rgba(96,165,250,0.1)",
        border: "rgba(96,165,250,0.25)",
    },
    upgrade: {
        label: "Upgrade",
        color: "#a78bfa",
        bg: "rgba(167,139,250,0.1)",
        border: "rgba(167,139,250,0.25)",
    },
    discovery: {
        label: "Browsing",
        color: "#fb923c",
        bg: "rgba(251,146,60,0.1)",
        border: "rgba(251,146,60,0.25)",
    },
};

/* ------------------------------------------------------------------ */
/*  Platform term label                                                  */
/* ------------------------------------------------------------------ */

const PLATFORM_TERM_LABELS: Record<string, string> = {
    amazon: "Backend Search Terms",
    shopify: "LSI / Semantic Terms",
    etsy: "Style & Occasion Tags",
    general: "Category Terms",
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function KeywordPanel({ keywords, platform }: Props) {
    const [copied, setCopied] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    const intent =
        INTENT_CONFIG[keywords.buyerIntent] ?? INTENT_CONFIG.transactional;
    const platformTermLabel =
        PLATFORM_TERM_LABELS[platform.toLowerCase()] ?? "Platform Terms";

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const copyAllKeywords = () => {
        const all = [
            keywords.primaryKeyword,
            ...keywords.secondaryKeywords,
            ...keywords.platformTerms,
        ].join(", ");
        copy(all, "all");
    };

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
            }}
        >
            {/* ── Header ── */}
            <button
                onClick={() => setIsExpanded((v) => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/2 transition-colors"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                            background: "rgba(99,102,241,0.15)",
                            border: "1px solid rgba(99,102,241,0.25)",
                        }}
                    >
                        <Target
                            className="w-4 h-4 text-indigo-400"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">
                            Keyword Intelligence
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            AI-researched keywords for{" "}
                            <span className="capitalize">{platform}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Copy all */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            copyAllKeywords();
                        }}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            copied === "all"
                                ? "text-emerald-400"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                        style={{
                            background:
                                copied === "all"
                                    ? "rgba(16,185,129,0.1)"
                                    : "rgba(255,255,255,0.05)",
                            border:
                                copied === "all"
                                    ? "1px solid rgba(16,185,129,0.2)"
                                    : "1px solid rgba(255,255,255,0.08)",
                        }}
                        aria-label="Copy all keywords"
                    >
                        {copied === "all" ? (
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        Copy All
                    </motion.button>

                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-180",
                        )}
                        aria-hidden="true"
                    />
                </div>
            </button>

            {/* ── Body ── */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            className="px-5 pb-5 space-y-4"
                            style={{
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                            }}
                        >
                            {/* ── Buyer Intent + Primary Keyword row ── */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                {/* Intent badge */}
                                <div
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
                                    style={{
                                        background: intent.bg,
                                        border: `1px solid ${intent.border}`,
                                    }}
                                >
                                    <TrendingUp
                                        className="w-3.5 h-3.5 shrink-0"
                                        style={{ color: intent.color }}
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p
                                            className="text-[10px] font-semibold uppercase tracking-wider"
                                            style={{
                                                color: intent.color,
                                                opacity: 0.7,
                                            }}
                                        >
                                            Buyer Intent
                                        </p>
                                        <p
                                            className="text-xs font-bold"
                                            style={{ color: intent.color }}
                                        >
                                            {intent.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Primary keyword */}
                                <KeywordRow
                                    label="Primary Keyword"
                                    accentColor="#6366f1"
                                    className="flex-1"
                                >
                                    <CopyChip
                                        text={keywords.primaryKeyword}
                                        chipKey="primary"
                                        copied={copied}
                                        onCopy={copy}
                                        variant="primary"
                                    />
                                </KeywordRow>
                            </div>

                            {/* ── Competitor Gap — hero insight ── */}
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    background: "rgba(251,191,36,0.06)",
                                    border: "1px solid rgba(251,191,36,0.15)",
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                        style={{
                                            background: "rgba(251,191,36,0.12)",
                                            border: "1px solid rgba(251,191,36,0.2)",
                                        }}
                                    >
                                        <Lightbulb
                                            className="w-3.5 h-3.5 text-amber-400"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                                            Competitor Gap — Overlooked
                                            Opportunity
                                        </p>
                                        <p className="text-sm text-foreground/90 leading-relaxed">
                                            {keywords.competitorGap}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            copy(keywords.competitorGap, "gap")
                                        }
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
                                        aria-label="Copy competitor gap insight"
                                    >
                                        {copied === "gap" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* ── Secondary Keywords ── */}
                            <KeywordRow
                                label="Secondary Keywords"
                                accentColor="#8b5cf6"
                            >
                                <div className="flex flex-wrap gap-2">
                                    {keywords.secondaryKeywords.map((kw, i) => (
                                        <CopyChip
                                            key={i}
                                            text={kw}
                                            chipKey={`sec-${i}`}
                                            copied={copied}
                                            onCopy={copy}
                                        />
                                    ))}
                                </div>
                            </KeywordRow>

                            {/* ── Platform Terms ── */}
                            <KeywordRow
                                label={platformTermLabel}
                                accentColor="#06b6d4"
                            >
                                <div className="flex flex-wrap gap-2">
                                    {keywords.platformTerms.map((term, i) => (
                                        <CopyChip
                                            key={i}
                                            text={term}
                                            chipKey={`plat-${i}`}
                                            copied={copied}
                                            onCopy={copy}
                                            variant="platform"
                                        />
                                    ))}
                                </div>
                            </KeywordRow>

                            {/* ── Buyer Persona ── */}
                            <KeywordRow
                                label="Buyer Persona"
                                accentColor="#10b981"
                                icon={
                                    <Users
                                        className="w-3 h-3"
                                        aria-hidden="true"
                                    />
                                }
                            >
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {keywords.buyerPersona}
                                </p>
                            </KeywordRow>

                            {/* ── Avoid Terms ── */}
                            <KeywordRow
                                label="Avoid These Terms"
                                accentColor="#ef4444"
                                icon={
                                    <AlertTriangle
                                        className="w-3 h-3"
                                        aria-hidden="true"
                                    />
                                }
                            >
                                <div className="flex flex-wrap gap-2">
                                    {keywords.avoidTerms.map((term, i) => (
                                        <span
                                            key={i}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{
                                                background:
                                                    "rgba(239,68,68,0.08)",
                                                border: "1px solid rgba(239,68,68,0.2)",
                                                color: "#fca5a5",
                                            }}
                                        >
                                            <AlertTriangle
                                                className="w-3 h-3"
                                                aria-hidden="true"
                                            />
                                            {term}
                                        </span>
                                    ))}
                                </div>
                            </KeywordRow>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  KeywordRow — section wrapper                                        */
/* ------------------------------------------------------------------ */

function KeywordRow({
    label,
    accentColor,
    icon,
    children,
    className,
}: {
    label: string;
    accentColor: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn("rounded-xl p-3.5 space-y-2.5", className)}
            style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
            }}
        >
            <div className="flex items-center gap-1.5">
                <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: accentColor }}
                    aria-hidden="true"
                />
                {icon && (
                    <span style={{ color: accentColor, opacity: 0.7 }}>
                        {icon}
                    </span>
                )}
                <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: accentColor, opacity: 0.85 }}
                >
                    {label}
                </span>
            </div>
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  CopyChip — individually copyable keyword pill                       */
/* ------------------------------------------------------------------ */

type ChipVariant = "default" | "primary" | "platform";

const CHIP_STYLES: Record<
    ChipVariant,
    { bg: string; border: string; color: string; hoverBg: string }
> = {
    default: {
        bg: "rgba(99,102,241,0.06)",
        border: "rgba(99,102,241,0.15)",
        color: "#c7d2fe",
        hoverBg: "rgba(99,102,241,0.12)",
    },
    primary: {
        bg: "rgba(99,102,241,0.12)",
        border: "rgba(99,102,241,0.3)",
        color: "#a5b4fc",
        hoverBg: "rgba(99,102,241,0.18)",
    },
    platform: {
        bg: "rgba(6,182,212,0.06)",
        border: "rgba(6,182,212,0.15)",
        color: "#a5f3fc",
        hoverBg: "rgba(6,182,212,0.12)",
    },
};

function CopyChip({
    text,
    chipKey,
    copied,
    onCopy,
    variant = "default",
}: {
    text: string;
    chipKey: string;
    copied: string | null;
    onCopy: (text: string, key: string) => void;
    variant?: ChipVariant;
}) {
    const isCopied = copied === chipKey;
    const styles = CHIP_STYLES[variant];

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCopy(text, chipKey)}
            className={cn(
                "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
            )}
            style={{
                background: isCopied ? "rgba(16,185,129,0.1)" : styles.bg,
                border: `1px solid ${isCopied ? "rgba(16,185,129,0.25)" : styles.border}`,
                color: isCopied ? "#34d399" : styles.color,
            }}
            aria-label={`Copy keyword: ${text}`}
        >
            <span>{text}</span>
            {isCopied ? (
                <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
            ) : (
                <Copy
                    className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                    aria-hidden="true"
                />
            )}
        </motion.button>
    );
}
