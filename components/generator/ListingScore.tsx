// components/generator/ListingScore.tsx
"use client";

import { cn } from "@/lib/utils";

interface ScoreData {
    overall: number;
    breakdown: {
        seo: number;
        keywords: number;
        readability: number;
        conversion: number;
    };
    before?: number;
}

interface Props {
    score: ScoreData;
    showBreakdown?: boolean;
}

export function ListingScore({ score, showBreakdown = true }: Props) {
    const getScoreColor = (value: number) => {
        if (value >= 80) return "text-emerald-500";
        if (value >= 60) return "text-amber-500";
        return "text-red-500";
    };

    const overallColor = getScoreColor(score.overall);

    return (
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] shadow-lg p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#94A3B8] uppercase tracking-wide">
                    Listing Score
                </h3>
                {score.before !== undefined && (
                    <div className="text-xs text-[#94A3B8]">
                        Before{" "}
                        <span className="text-[#F8FAFC] font-mono">
                            {score.before}
                        </span>{" "}
                        → After{" "}
                        <span className={cn("font-mono", overallColor)}>
                            {score.overall}
                        </span>
                        <span className="ml-1 text-emerald-500">
                            (+{score.overall - score.before})
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
                <span className={cn("text-5xl font-bold", overallColor)}>
                    {score.overall}
                </span>
                <span className="text-[#94A3B8] text-lg">/ 100</span>
            </div>

            {showBreakdown && (
                <div className="mt-6 space-y-4">
                    <BreakdownItem label="SEO" value={score.breakdown.seo} />
                    <BreakdownItem
                        label="Keywords"
                        value={score.breakdown.keywords}
                    />
                    <BreakdownItem
                        label="Readability"
                        value={score.breakdown.readability}
                    />
                    <BreakdownItem
                        label="Conversion"
                        value={score.breakdown.conversion}
                    />
                </div>
            )}
        </div>
    );
}

function BreakdownItem({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-[#94A3B8]">{label}</span>
                <span className="text-[#F8FAFC] font-mono">{value}</span>
            </div>
            <div className="h-1.5 bg-[#334155] rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-600"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
