// components/generate/PlatformSelector.tsx
"use client";

import Image from "next/image";

import { PLATFORMS } from "@/config/platforms";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";
import type { Platform } from "@/types";
import { SlGlobe } from "react-icons/sl";

type Props = {
    value: Platform;
    onChange: (value: Platform) => void;
    disabled?: boolean;
};

// Map platform to React component (icon)
const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
    amazon: (
        <Image
            src="/amazon-icon.svg"
            alt="Amazon"
            width={20}
            height={20}
            className="w-5 h-5"
            aria-hidden="true"
        />
    ),
    shopify: (
        <Image
            src="/shopify-icon.svg"
            alt="Shopify"
            width={20}
            height={20}
            className="w-5 h-5"
            aria-hidden="true"
        />
    ),
    etsy: (
        <Image
            src="/etsy-icon.svg"
            alt="Etsy"
            width={20}
            height={20}
            className="w-5 h-5"
            aria-hidden="true"
        />
    ),
    general: (
        <SlGlobe color="blue" width={20} height={20} className="w-5 h-5" />
    ),
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
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                            isSelected
                                ? "border-primary bg-muted text-foreground"
                                : "border-border hover:border-primary/50 text-muted-foreground",
                        )}
                    >
                        <span
                            className="flex items-center justify-center"
                            aria-hidden="true"
                        >
                            {PLATFORM_ICONS[p.value]}
                        </span>
                        <span className="text-sm font-semibold">{p.label}</span>
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
