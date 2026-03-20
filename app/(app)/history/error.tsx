"use client";

import { useEffect } from "react";

type Props = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function HistoryError({ error, reset }: Props) {
    useEffect(() => {
        console.error("[HistoryPage] Unhandled error:", error);
    }, [error]);

    return (
        <div className="max-w-2xl mx-auto">
            <div
                className="text-center py-20 rounded-2xl"
                style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.15)",
                }}
            >
                <p className="text-base font-semibold text-foreground">
                    Something went wrong
                </p>
                <p className="text-muted-foreground text-sm mt-1 mb-6">
                    We couldn&apos;t load your generation history.
                </p>
                <button
                    onClick={reset}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                    style={{
                        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                    }}
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
