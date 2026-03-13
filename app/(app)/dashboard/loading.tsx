// app/(app)/dashboard/loading.tsx

export default function DashboardLoading() {
    return (
        <div
            className="max-w-3xl mx-auto space-y-8"
            aria-busy="true"
            aria-label="Loading dashboard"
        >
            {/* Welcome skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                        <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
                <div className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            </div>

            {/* Recent */}
            <div className="space-y-3">
                <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse"
                        style={{ animationDelay: `${i * 60}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}
