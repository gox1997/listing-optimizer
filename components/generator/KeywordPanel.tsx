// components/generator/KeywordPanel.tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Keyword {
    keyword: string;
    volume: "High" | "Medium" | "Low";
    difficulty: number; // 0–100
}

interface Props {
    keywords: Keyword[];
    onApply?: () => void;
}

const volumeColor = {
    High: "text-emerald-500",
    Medium: "text-amber-500",
    Low: "text-red-500",
};

export function KeywordPanel({ keywords, onApply }: Props) {
    return (
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#94A3B8] uppercase tracking-wide">
                    Keyword Intelligence
                </h3>
                {onApply && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onApply}
                        className="px-3 py-1.5 text-xs font-medium bg-[#334155] text-[#F8FAFC] rounded-xl hover:bg-[#475569] transition-colors"
                    >
                        Apply All
                    </motion.button>
                )}
            </div>
            <div className="space-y-3">
                {keywords.map((kw, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-[#334155] last:border-0"
                    >
                        <span className="text-[#F8FAFC] text-sm">
                            {kw.keyword}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                            <span className={cn(volumeColor[kw.volume])}>
                                {kw.volume}
                            </span>
                            <span className="text-[#94A3B8]">
                                {kw.difficulty}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
