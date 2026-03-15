// components/generate/CopyButton.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
    text: string;
    label?: string;
    className?: string;
};

export function CopyButton({ text, label, className }: Props) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleCopy = useCallback(async () => {
        if (copied) return;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            clearTimer();
            timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const el = document.createElement("textarea");
            el.value = text;
            el.style.position = "fixed";
            el.style.opacity = "0";
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            clearTimer();
            timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        }
    }, [text, copied, clearTimer]);

    useEffect(() => {
        return clearTimer;
    }, [clearTimer]);

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied!" : `Copy ${label ?? "to clipboard"}`}
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                "text-xs font-medium transition-all duration-150",
                "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Increase tap target on mobile
                "min-h-8 min-w-8",
                copied
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-muted text-muted-foreground border border-border hover:bg-muted-foreground/20",
                className,
            )}
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{label ?? "Copy"}</span>
                </>
            )}
        </button>
    );
}

CopyButton.displayName = "CopyButton";
