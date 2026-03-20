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
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg min-h-8 min-w-8",
                "text-xs font-medium transition-all duration-150",
                "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                copied
                    ? "text-emerald-400 border border-emerald-500/25"
                    : "text-muted-foreground border border-border hover:text-foreground hover:border-white/15 hover:bg-white/5",
                className,
            )}
            style={copied ? { background: "rgba(16,185,129,0.08)" } : {}}
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
