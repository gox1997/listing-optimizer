// app/(app)/generate/[id]/loading.tsx

export default function GenerationLoading() {
    return (
        <div
            className="max-w-2xl mx-auto space-y-4"
            aria-busy="true"
            aria-label="Loading generation"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
            </div>

            {/* Cards */}
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
                    style={{ animationDelay: `${i * 60}ms` }}
                >
                    <div className="flex items-center justify-between">
                        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                        <div className="h-6 w-16 bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full  bg-slate-100 rounded animate-pulse" />
                        <div className="h-3 w-5/6   bg-slate-100 rounded animate-pulse" />
                        <div className="h-3 w-4/6   bg-slate-100 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
