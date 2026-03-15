// app/(app)/history/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listGenerations } from "@/services/generation.service";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { History, Sparkles } from "lucide-react";
import type { Metadata } from "next";

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
    title: "Generation History — ListingAI",
};

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const LIMIT = 20;

const PLATFORM_LABELS: Record<string, string> = {
    amazon: "Amazon",
    shopify: "Shopify",
    etsy: "Etsy",
    general: "General",
};

const TONE_COLORS: Record<string, string> = {
    professional: "bg-blue-50   text-blue-700",
    casual: "bg-green-50  text-green-700",
    luxury: "bg-purple-50 text-purple-700",
    playful: "bg-pink-50   text-pink-700",
    technical: "bg-slate-100 text-slate-700",
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

type Props = {
    searchParams: Promise<{ page?: string }>;
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function HistoryPage({ searchParams }: Props) {
    // Auth — redirect if no session
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    // Sanitize page param
    const { page: pageParam } = await searchParams;
    const parsed = parseInt(pageParam ?? "1", 10);
    const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

    // Fetch
    const result = await listGenerations(user.id, page, LIMIT);

    // Service error — show inline error, not a crash
    if (!result.success) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <PageHeader total={0} />
                <div
                    role="alert"
                    className="p-6 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 text-center"
                >
                    Failed to load generation history. Please refresh the page.
                </div>
            </div>
        );
    }

    const { generations, total } = result;
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <PageHeader total={total} />

            {/* Empty state */}
            {generations.length === 0 && (
                <div className="text-center py-20 bg-card border border-border rounded-2xl">
                    <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles
                            className="w-6 h-6 text-muted-foreground"
                            aria-hidden="true"
                        />
                    </div>
                    <p className="font-semibold text-base sm:text-lg text-foreground">
                        No listings yet
                    </p>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1 mb-6 pl-2 pr-2 pb-4">
                        Generate your first listing to see it here.
                    </p>
                    <Link
                        href="/generate"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-base sm:text-lg font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                        Generate a listing
                    </Link>
                </div>
            )}

            {/* List */}
            {generations.length > 0 && (
                <ul className="space-y-3" aria-label="Generation history">
                    {generations.map((gen) => (
                        <li key={gen.id}>
                            <Link
                                href={`/generate/${gen.id}`}
                                className="block bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground truncate">
                                            {gen.product_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                            {gen.output_data?.seoTitle ?? "—"}
                                        </p>
                                    </div>
                                    <time
                                        dateTime={gen.created_at}
                                        className="shrink-0 text-xs text-muted-foreground/70 mt-0.5"
                                    >
                                        {formatRelativeTime(gen.created_at)}
                                    </time>
                                </div>

                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs font-medium">
                                        {PLATFORM_LABELS[gen.platform] ??
                                            gen.platform}
                                    </span>
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                                            TONE_COLORS[gen.tone] ??
                                                "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {gen.tone}
                                    </span>
                                    {gen.primary_keyword && (
                                        <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-md text-xs border border-border truncate max-w-40">
                                            {gen.primary_keyword}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <nav
                    aria-label="Pagination"
                    className="flex items-center justify-between pt-2"
                >
                    <PaginationLink
                        href={`/history?page=${page - 1}`}
                        disabled={page <= 1}
                    >
                        Previous
                    </PaginationLink>

                    <span className="text-base text-muted-foreground">
                        Page{" "}
                        <span className="font-semibold text-foreground">
                            {page}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-foreground">
                            {totalPages}
                        </span>
                    </span>

                    <PaginationLink
                        href={`/history?page=${page + 1}`}
                        disabled={page >= totalPages}
                    >
                        Next
                    </PaginationLink>
                </nav>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function PageHeader({ total }: { total: number }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                    <History className="w-5 h-5" aria-hidden="true" />
                    History
                </h1>
                <p className="text-muted-foreground text-base mt-1">
                    {total > 0
                        ? `${total} listing${total === 1 ? "" : "s"} generated`
                        : "No generations yet"}
                </p>
            </div>
            <Link
                href="/generate"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-base sm:text-lg font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                New
            </Link>
        </div>
    );
}

function PaginationLink({
    href,
    disabled,
    children,
}: {
    href: string;
    disabled: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={cn(
                "px-4 py-2 rounded-xl border border-border text-base font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                disabled
                    ? "opacity-40 pointer-events-none"
                    : "hover:bg-muted text-muted-foreground",
            )}
        >
            {children}
        </Link>
    );
}
