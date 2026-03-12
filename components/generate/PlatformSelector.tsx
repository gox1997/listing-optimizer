// components/generate/PlatformSelector.tsx
"use client";

import { PLATFORMS } from "@/config/platforms";
import { cn } from "@/lib/utils/cn";
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
            {PLATFORMS.map((p) => (
                <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={value === p.value}
                    disabled={disabled}
                    onClick={() => onChange(p.value)}
                    className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2",
                        "text-center transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        value === p.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 text-slate-700",
                    )}
                >
                    <span className="text-xl" aria-hidden="true">
                        {PLATFORM_ICONS[p.value]}
                    </span>
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span className="sr-only">{p.description}</span>
                </button>
            ))}
        </div>
    );
}

PlatformSelector.displayName = "PlatformSelector";
