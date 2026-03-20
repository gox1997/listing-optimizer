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
                {TONES.map((t) => {
                    const isSelected = value === t.value;
                    return (
                        <Tooltip key={t.value}>
                            <TooltipTrigger
                                role="radio"
                                aria-checked={isSelected}
                                disabled={disabled}
                                onClick={() => onChange(t.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold",
                                    "transition-all duration-150",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                                    "disabled:opacity-40 disabled:cursor-not-allowed",
                                    isSelected
                                        ? "text-white"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                                style={
                                    isSelected
                                        ? {
                                              background:
                                                  "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                              border: "1px solid transparent",
                                          }
                                        : {
                                              background:
                                                  "rgba(255,255,255,0.04)",
                                              border: "1px solid rgba(255,255,255,0.09)",
                                          }
                                }
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
                    );
                })}
            </div>
        </TooltipProvider>
    );
}

ToneSelector.displayName = "ToneSelector";
