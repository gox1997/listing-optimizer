// components/generate/PlatformSelector.tsx
"use client";

import { PLATFORMS } from "@/config/platforms";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";
import type { Platform } from "@/types";

type Props = {
    value: Platform;
    onChange: (value: Platform) => void;
    disabled?: boolean;
};

const PLATFORM_ICONS: Record<Platform, string> = {
    amazon: "🛒",
    shopify: "🏪",
    etsy: "✂️",
    general: "🌐",
};

export function PlatformSelector({ value, onChange, disabled }: Props) {
    return (
        <div
            role="radiogroup"
            aria-label="Platform"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
            {PLATFORMS.map((p) => {
                const isSelected = value === p.value;
                return (
                    <button
                        key={p.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={disabled}
                        onClick={() => onChange(p.value)}
                        className={cn(
                            "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2",
                            "text-center transition-all duration-150",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                            isSelected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 hover:border-slate-300 text-slate-700",
                        )}
                    >
                        <span className="text-xl" aria-hidden="true">
                            {PLATFORM_ICONS[p.value]}
                        </span>
                        <span className="text-xs font-semibold">{p.label}</span>
                        {isSelected && (
                            <Check
                                className="absolute top-2 right-2 w-3.5 h-3.5 text-white"
                                aria-hidden="true"
                            />
                        )}
                        <span className="sr-only">{p.description}</span>
                    </button>
                );
            })}
        </div>
    );
}

PlatformSelector.displayName = "PlatformSelector";
