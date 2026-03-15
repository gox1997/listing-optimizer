// app/(app)/generate/[id]/error.tsx
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
            <div className="text-center py-20 bg-card border border-red-100 rounded-2xl">
                <p className="text-lg font-semibold text-foreground">
                    Something went wrong
                </p>
                <p className="text-muted-foreground text-sm mt-1 mb-6">
                    We couldn&apos;t load this generation.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => router.push("/history")}
                        className="px-5 py-2.5 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Back to history
                    </button>
                </div>
            </div>
        </div>
    );
}
