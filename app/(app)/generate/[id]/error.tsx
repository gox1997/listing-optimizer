"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function GenerationError({ error, reset }: Props) {
    const router = useRouter();

    useEffect(() => {
        console.error("[GenerationPage] Unhandled error:", error);
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
                    We couldn&apos;t load this generation.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{
                            background:
                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => router.push("/history")}
                        className="px-5 py-2.5 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    >
                        Back to history
                    </button>
                </div>
            </div>
        </div>
    );
}
