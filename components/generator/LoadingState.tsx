// Renamed from .jsx to .tsx — .jsx was inconsistent with the rest of the codebase
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const STEPS = [
    "Analyzing keywords",
    "Optimizing structure",
    "Writing high-converting copy",
] as const;

export function LoadingState() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (currentStep < STEPS.length - 1) {
            const id = setTimeout(() => setCurrentStep((s) => s + 1), 1400);
            return () => clearTimeout(id);
        }
    }, [currentStep]);

    return (
        <div
            className="rounded-2xl p-6 space-y-6"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
            }}
        >
            {/* Shimmer skeleton blocks */}
            <div className="space-y-3">
                <div
                    className="h-5 w-2/3 rounded-xl overflow-hidden relative"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                >
                    <span
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(99,102,241,0.25), transparent)",
                            backgroundSize: "200% 100%",
                            animation:
                                "shimmer-sweep 1.5s ease-in-out infinite",
                        }}
                        aria-hidden="true"
                    />
                </div>
                <div
                    className="h-20 rounded-xl overflow-hidden relative"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                >
                    <span
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)",
                            backgroundSize: "200% 100%",
                            animation:
                                "shimmer-sweep 1.8s ease-in-out infinite 0.2s",
                        }}
                        aria-hidden="true"
                    />
                </div>
            </div>

            <div className="space-y-2">
                {[0.6, 1].map((w, i) => (
                    <div
                        key={i}
                        className="h-3 rounded-lg overflow-hidden relative"
                        style={{
                            width: `${w * 100}%`,
                            background: "rgba(255,255,255,0.04)",
                        }}
                    >
                        <span
                            className="absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(90deg, transparent, rgba(99,102,241,0.25), transparent)",
                                backgroundSize: "200% 100%",
                                animation: `shimmer-sweep 1.6s ease-in-out infinite ${i * 0.15}s`,
                            }}
                            aria-hidden="true"
                        />
                    </div>
                ))}
            </div>

            {/* Step indicators */}
            <div
                className="pt-4 space-y-3 border-t"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
                {STEPS.map((step, i) => {
                    const isDone = i < currentStep;
                    const isCurrent = i === currentStep;

                    return (
                        <motion.div
                            key={step}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0.35 }}
                            animate={{ opacity: i <= currentStep ? 1 : 0.35 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Dot */}
                            <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-400",
                                    )}
                                    style={{
                                        background: isDone
                                            ? "#10b981"
                                            : isCurrent
                                              ? "#6366f1"
                                              : "rgba(255,255,255,0.15)",
                                        boxShadow: isCurrent
                                            ? "0 0 8px rgba(99,102,241,0.8)"
                                            : isDone
                                              ? "0 0 6px rgba(16,185,129,0.6)"
                                              : "none",
                                    }}
                                />
                                {/* Pulse ring on current step */}
                                {isCurrent && (
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            border: "1px solid rgba(99,102,241,0.5)",
                                            animation:
                                                "ping 1s cubic-bezier(0,0,0.2,1) infinite",
                                        }}
                                        aria-hidden="true"
                                    />
                                )}
                            </div>

                            <span
                                className={cn(
                                    "text-sm transition-colors duration-300",
                                    isDone
                                        ? "text-emerald-400"
                                        : isCurrent
                                          ? "text-foreground font-medium"
                                          : "text-muted-foreground/50",
                                )}
                            >
                                {step}
                                {isDone && (
                                    <span className="ml-2 text-emerald-400/70 text-xs">
                                        ✓
                                    </span>
                                )}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
