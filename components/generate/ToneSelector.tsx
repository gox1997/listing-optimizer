// components/generate/ToneSelector.tsx
"use client";

import { TONES } from "@/config/tones";
import { cn } from "@/lib/utils/cn";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Tone } from "@/types";

type Props = {
    value: Tone;
    onChange: (value: Tone) => void;
    disabled?: boolean;
};

export function ToneSelector({ value, onChange, disabled }: Props) {
    return (
        <TooltipProvider>
            <div
                role="radiogroup"
                aria-label="Brand tone"
                className="flex flex-wrap gap-2"
            >
                {TONES.map((t) => (
                    <Tooltip key={t.value}>
                        <TooltipTrigger
                            role="radio"
                            aria-checked={value === t.value}
                            disabled={disabled}
                            onClick={() => onChange(t.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all duration-150",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                value === t.value
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600",
                            )}
                        >
                            {t.label}
                        </TooltipTrigger>
                        <TooltipContent
                            side="bottom"
                            className="max-w-50 text-center"
                        >
                            <p className="font-medium">{t.description}</p>
                            <p className="text-xs opacity-80 mt-0.5 italic">
                                {t.example}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}

ToneSelector.displayName = "ToneSelector";
