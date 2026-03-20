"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface Keyword {
    keyword: string;
    volume: "High" | "Medium" | "Low";
    difficulty: number;
}

interface Props {
    keywords: Keyword[];
    onApply?: () => void;
}

const VOLUME_CONFIG = {
    High: { style: { color: "#34d399" }, bar: "#10b981", label: "High" },
    Medium: { style: { color: "#fbbf24" }, bar: "#f59e0b", label: "Medium" },
    Low: { style: { color: "#f87171" }, bar: "#ef4444", label: "Low" },
} as const;

export function KeywordPanel({ keywords, onApply }: Props) {
    return (
        <div
            className="rounded-2xl p-5"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp
                        className="w-4 h-4"
                        style={{ color: "#6366f1" }}
                        aria-hidden="true"
                    />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Keyword Intelligence
                    </h3>
                </div>

                {onApply && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onApply}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{
                            background:
                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                    >
                        Apply All
                    </motion.button>
                )}
            </div>

            <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                    Keyword
                </span>
                <div className="flex items-center gap-6 text-xs text-muted-foreground/50 uppercase tracking-wider">
                    <span>Volume</span>
                    <span className="w-16 text-right">Difficulty</span>
                </div>
            </div>

            <div className="space-y-1">
                {keywords.map((kw, i) => {
                    const cfg = VOLUME_CONFIG[kw.volume];
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center justify-between py-2.5 px-1"
                            style={{
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.05)",
                            }}
                        >
                            <span className="text-sm text-foreground font-medium truncate mr-4">
                                {kw.keyword}
                            </span>
                            <div className="flex items-center gap-4 shrink-0">
                                <span
                                    className="text-xs font-semibold px-2 py-0.5 rounded-md"
                                    style={{
                                        ...cfg.style,
                                        background: `${cfg.bar}15`,
                                        border: `1px solid ${cfg.bar}30`,
                                    }}
                                >
                                    {cfg.label}
                                </span>
                                <div className="flex items-center gap-2 w-20">
                                    <div
                                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${kw.difficulty}%`,
                                                background:
                                                    kw.difficulty >= 70
                                                        ? "#ef4444"
                                                        : kw.difficulty >= 40
                                                          ? "#f59e0b"
                                                          : "#10b981",
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                                        {kw.difficulty}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {keywords.length === 0 && (
                <p className="text-center text-sm text-muted-foreground/50 py-6">
                    No keywords found.
                </p>
            )}
        </div>
    );
}
