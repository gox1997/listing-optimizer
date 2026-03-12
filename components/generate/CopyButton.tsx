// components/generate/CopyButton.tsx
"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
    text: string;
    label?: string;
    className?: string;
};

export function CopyButton({ text, label, className }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        if (copied) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that block clipboard API
            const el = document.createElement("textarea");
            el.value = text;
            el.style.position = "fixed";
            el.style.opacity = "0";
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [text, copied]);

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied!" : `Copy ${label ?? "to clipboard"}`}
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                "text-xs font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1",
                copied
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200",
                className,
            )}
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    {label ?? "Copy"}
                </>
            )}
        </button>
    );
}

CopyButton.displayName = "CopyButton";
