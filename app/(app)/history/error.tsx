// app/(app)/history/error.tsx
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
            <div className="text-center py-20 bg-white border border-red-100 rounded-2xl">
                <p className="text-lg font-semibold text-slate-900">
                    Something went wrong
                </p>
                <p className="text-slate-500 text-sm mt-1 mb-6">
                    We couldn&apos;t load your generation history. Please try
                    again.
                </p>
                <button
                    onClick={reset}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
