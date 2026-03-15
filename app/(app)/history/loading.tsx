// app/(app)/history/loading.tsx

export default function HistoryLoading() {
    return (
        <div
            className="max-w-2xl mx-auto space-y-6"
            aria-busy="true"
            aria-label="Loading history"
        >
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
                    <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
                </div>
                <div className="h-9 w-20 bg-muted rounded-xl animate-pulse" />
            </div>

            {/* Card skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3"
                    style={{ animationDelay: `${i * 60}ms` }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-full bg-muted/50 rounded animate-pulse" />
                        </div>
                        <div className="h-3 w-16 bg-muted/50 rounded animate-pulse shrink-0" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-5 w-16 bg-muted/50 rounded-md animate-pulse" />
                        <div className="h-5 w-20 bg-muted/50 rounded-md animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
