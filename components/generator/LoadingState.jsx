// components/generator/LoadingState.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const steps = [
    "Analyzing keywords",
    "Optimizing structure",
    "Writing high-converting copy",
];

export function LoadingState() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (currentStep < steps.length - 1) {
            const timer = setTimeout(() => setCurrentStep((s) => s + 1), 600);
            return () => clearTimeout(timer);
        }
    }, [currentStep]);

    return (
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] shadow-lg p-6 space-y-6">
            {/* Skeleton blocks */}
            <div className="space-y-3">
                <div className="h-6 w-2/3 bg-[#334155] rounded-2xl animate-pulse" />
                <div className="h-20 bg-[#334155] rounded-2xl animate-pulse" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-1/2 bg-[#334155] rounded-2xl animate-pulse" />
                <div className="h-4 w-full bg-[#334155] rounded-2xl animate-pulse" />
            </div>

            {/* Step indicators */}
            <div className="pt-4 space-y-3">
                {steps.map((step, i) => (
                    <motion.div
                        key={step}
                        className="flex items-center gap-3 text-[#F8FAFC]"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: i <= currentStep ? 1 : 0.5 }}
                    >
                        <div
                            className={cn(
                                "w-2 h-2 rounded-full",
                                i < currentStep
                                    ? "bg-emerald-500"
                                    : i === currentStep
                                      ? "bg-cyan-500"
                                      : "bg-[#334155]",
                            )}
                        />
                        <span className="text-sm">{step}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
