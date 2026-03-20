"use client";

import { useEffect, useRef, useState } from "react";
import { Award } from "lucide-react";

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

function useCountUp(target: number, duration = 1000) {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return value;
}

function getScoreConfig(value: number) {
    if (value >= 80)
        return {
            color: "#10b981",
            glow: "rgba(16,185,129,0.3)",
            label: "Excellent",
        };
    if (value >= 60)
        return {
            color: "#f59e0b",
            glow: "rgba(245,158,11,0.3)",
            label: "Good",
        };
    return {
        color: "#ef4444",
        glow: "rgba(239,68,68,0.3)",
        label: "Needs work",
    };
}

export function ListingScore({ score, showBreakdown = true }: Props) {
    const animatedScore = useCountUp(score.overall, 1200);
    const cfg = getScoreConfig(score.overall);

    return (
        <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
            }}
        >
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at top right, ${cfg.glow.replace("0.3", "0.06")}, transparent 60%)`,
                }}
                aria-hidden="true"
            />

            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Award
                        className="w-4 h-4"
                        style={{ color: cfg.color }}
                        aria-hidden="true"
                    />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Listing Score
                    </h3>
                </div>

                {score.before !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground/60 font-mono">
                            {score.before}
                        </span>
                        <span className="text-muted-foreground/40">→</span>
                        <span
                            className="font-mono font-bold"
                            style={{ color: cfg.color }}
                        >
                            {score.overall}
                        </span>
                        <span
                            className="font-semibold"
                            style={{ color: "#10b981" }}
                        >
                            (+{score.overall - score.before})
                        </span>
                    </div>
                )}
            </div>

            <div className="relative flex items-end gap-3 mb-1">
                <span
                    className="text-6xl font-bold font-mono leading-none tabular-nums"
                    style={{
                        color: cfg.color,
                        textShadow: `0 0 30px ${cfg.glow}`,
                    }}
                >
                    {animatedScore}
                </span>
                <div className="mb-1.5">
                    <span className="text-lg text-muted-foreground/60">
                        /100
                    </span>
                    <p
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: cfg.color }}
                    >
                        {cfg.label}
                    </p>
                </div>
            </div>

            <div
                className="h-1.5 rounded-full overflow-hidden mb-5"
                style={{ background: "rgba(255,255,255,0.08)" }}
            >
                <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                        width: `${score.overall}%`,
                        background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`,
                        boxShadow: `0 0 8px ${cfg.glow}`,
                    }}
                />
            </div>

            {showBreakdown && (
                <div className="space-y-3">
                    {Object.entries(score.breakdown).map(([key, value]) => (
                        <BreakdownRow
                            key={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            value={value as number}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
    const cfg = getScoreConfig(value);
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span
                    className="text-xs font-mono font-semibold"
                    style={{ color: cfg.color }}
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
