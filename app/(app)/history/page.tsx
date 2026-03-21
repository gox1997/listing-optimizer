import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listGenerations } from "@/services/generation.service";
import { formatRelativeTime } from "@/lib/utils/format";
import { History, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "History" };

const LIMIT = 20;

const PLATFORM_LABELS: Record<string, string> = {
    amazon: "Amazon",
    shopify: "Shopify",
    etsy: "Etsy",
    general: "General",
};

// Dark-compatible tone styles — inline to avoid Tailwind purging
const TONE_STYLES: Record<string, React.CSSProperties> = {
    professional: {
        background: "rgba(99,102,241,0.1)",
        color: "#a5b4fc",
        border: "1px solid rgba(99,102,241,0.2)",
    },
    casual: {
        background: "rgba(16,185,129,0.1)",
        color: "#6ee7b7",
        border: "1px solid rgba(16,185,129,0.2)",
    },
    luxury: {
        background: "rgba(139,92,246,0.1)",
        color: "#c4b5fd",
        border: "1px solid rgba(139,92,246,0.2)",
    },
    playful: {
        background: "rgba(236,72,153,0.1)",
        color: "#f9a8d4",
        border: "1px solid rgba(236,72,153,0.2)",
    },
    technical: {
        background: "rgba(148,163,184,0.1)",
        color: "#94a3b8",
        border: "1px solid rgba(148,163,184,0.2)",
    },
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function HistoryPage({ searchParams }: Props) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { page: pageParam } = await searchParams;
    const parsed = parseInt(pageParam ?? "1", 10);
    const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

    const result = await listGenerations(user.id, page, LIMIT);

    if (!result.success) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <PageHeader total={0} />
                <div
                    role="alert"
                    className="p-6 rounded-2xl text-sm text-center"
                    style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#fca5a5",
                    }}
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
                <div
                    className="text-center py-20 rounded-2xl"
                    style={{
                        background: "rgba(30,41,59,0.4)",
                        border: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{
                            background: "rgba(139,92,246,0.12)",
                            border: "1px solid rgba(139,92,246,0.2)",
                        }}
                    >
                        <Sparkles
                            className="w-6 h-6 text-violet-400"
                            aria-hidden="true"
                        />
                    </div>
                    <p className="font-semibold text-foreground">
                        No listings yet
                    </p>
                    <p className="text-muted-foreground text-sm mt-1 mb-6">
                        Generate your first listing to see it here.
                    </p>
                    <Link
                        href="/generate"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{
                            background:
                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
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
                                className="block rounded-2xl p-5 card-history-row transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
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
                                        className="shrink-0 text-xs text-muted-foreground/60 mt-0.5"
                                    >
                                        {formatRelativeTime(gen.created_at)}
                                    </time>
                                </div>

                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    {/* Platform badge */}
                                    <span
                                        className="px-2 py-0.5 rounded-md text-xs font-medium"
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.06)",
                                            color: "#94a3b8",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        {PLATFORM_LABELS[gen.platform] ??
                                            gen.platform}
                                    </span>

                                    {/* Tone badge */}
                                    <span
                                        className="px-2 py-0.5 rounded-md text-xs font-medium capitalize"
                                        style={
                                            TONE_STYLES[gen.tone] ??
                                            TONE_STYLES.professional
                                        }
                                    >
                                        {gen.tone}
                                    </span>

                                    {/* Keyword badge */}
                                    {gen.primary_keyword && (
                                        <span
                                            className="px-2 py-0.5 rounded-md text-xs truncate max-w-40"
                                            style={{
                                                background:
                                                    "rgba(255,255,255,0.04)",
                                                color: "#64748b",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                            }}
                                        >
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
                    <span className="text-sm text-muted-foreground">
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

function PageHeader({ total }: { total: number }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5">
                    <History
                        className="w-5 h-5 text-muted-foreground"
                        aria-hidden="true"
                    />
                    History
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {total > 0
                        ? `${total} listing${total === 1 ? "" : "s"} generated`
                        : "No generations yet"}
                </p>
            </div>
            <Link
                href="/generate"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
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
                "px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                disabled
                    ? "opacity-30 pointer-events-none text-muted-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
        >
            {children}
        </Link>
    );
}
