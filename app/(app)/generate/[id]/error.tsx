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
            <div className="text-center py-20 bg-white border border-red-100 rounded-2xl">
                <p className="text-lg font-semibold text-slate-900">
                    Something went wrong
                </p>
                <p className="text-slate-500 text-sm mt-1 mb-6">
                    We couldn&apos;t load this generation.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => router.push("/history")}
                        className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                        Back to history
                    </button>
                </div>
            </div>
        </div>
    );
}
