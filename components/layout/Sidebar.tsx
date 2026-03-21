"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    Sparkles,
    History,
    CreditCard,
    LogOut,
    Menu,
    X,
    Gem,
} from "lucide-react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Plan } from "@/types";

const NAV = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/generate", label: "Generate", icon: Sparkles },
    { href: "/history", label: "History", icon: History },
    { href: "/upgrade", label: "Upgrade", icon: CreditCard },
];

type Props = {
    userEmail: string;
    displayName: string;
    plan: Plan;
    used: number;
    limit: number;
};

function SidebarContent({
    userEmail,
    displayName,
    plan,
    used,
    limit,
    closeMobile,
}: Props & { closeMobile?: () => void }) {
    const pathname = usePathname();
    const usagePercent =
        limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const isNearLimit = usagePercent >= 60;
    const isAtLimit = usagePercent >= 100;
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

    return (
        // ── flex-col + h-full keeps the three sections pinned: nav grows, bottom stays ──
        <div className="flex h-full flex-col">
            {/* ── Logo ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    }}
                >
                    <Gem className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-base sm:text-xl tracking-tight text-foreground">
                    ListingGem
                </span>
            </div>

            {/* ── Nav — flex-1 so it takes available space ─────── */}
            <nav
                className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-hide"
                aria-label="Main navigation"
            >
                {NAV.map(({ href, label, icon: Icon }) => {
                    const isActive =
                        href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={closeMobile}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                                isActive
                                    ? "text-white"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                            )}
                            style={
                                isActive
                                    ? {
                                          background:
                                              "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                      }
                                    : {}
                            }
                            aria-current={isActive ? "page" : undefined}
                        >
                            <Icon
                                className={cn(
                                    "h-4 w-4 shrink-0",
                                    isActive
                                        ? "text-white"
                                        : "text-muted-foreground group-hover:text-foreground",
                                )}
                            />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Bottom section — never scrolls away ──────────── */}
            <div className="shrink-0 px-2 pb-2 space-y-2">
                {/* Usage card */}
                <div
                    className="rounded-xl p-3"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            Credits
                        </span>
                        <span
                            className={cn(
                                "text-xs font-semibold font-mono",
                                isAtLimit
                                    ? "text-red-400"
                                    : isNearLimit
                                      ? "text-amber-400"
                                      : "text-indigo-400",
                            )}
                        >
                            {used} / {limit}
                        </span>
                    </div>

                    <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${usagePercent}%`,
                                background: isAtLimit
                                    ? "#ef4444"
                                    : isNearLimit
                                      ? "#f59e0b"
                                      : "linear-gradient(90deg,#6366f1, #8b5cf6)",
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
                            style={{
                                background: "rgba(99,102,241,0.12)",
                                color: "#6366f1",
                                border: "1px solid rgba(6,182,212,0.2)",
                            }}
                        >
                            {planLabel}
                        </span>
                        {plan === "free" && (
                            <Link
                                href="/upgrade"
                                onClick={closeMobile}
                                className="text-xs font-medium text-#c084fc hover:text-violet-300 transition-colors"
                            >
                                Upgrade →
                            </Link>
                        )}
                    </div>
                </div>

                {/* User row */}
                <div
                    className="flex items-center gap-3 px-2 py-2 rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                            background:
                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                        aria-hidden="true"
                    >
                        {(displayName || userEmail).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate leading-none">
                            {displayName || userEmail.split("@")[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {userEmail}
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            const supabase = createClientSupabaseClient();
                            await supabase.auth.signOut();
                            window.location.href = "/auth";
                        }}
                        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        aria-label="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function Sidebar({ userEmail, displayName, plan, used, limit }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ── Desktop — floating pill pinned to viewport ───── */}
            {/*
                sticky + top-4 + h-[calc(100vh-2rem)] keeps the entire sidebar
                pinned to the viewport regardless of page scroll.
                The m-3 + rounded-2xl give it the floating pill look.
            */}
            <aside
                className="hidden lg:flex lg:flex-col lg:shrink-0 sticky top-4 self-start h-[calc(100vh-2rem)] w-60 m-2 rounded-2xl overflow-hidden"
                style={{
                    background: "rgba(15,23,42,0.85)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow:
                        "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.5)",
                }}
            >
                <SidebarContent
                    userEmail={userEmail}
                    displayName={displayName}
                    plan={plan}
                    used={used}
                    limit={limit}
                />
            </aside>

            {/* ── Mobile top bar ────────────────────────────────── */}
            <div
                className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between px-4 lg:hidden"
                style={{
                    background: "rgba(11,17,32,0.9)",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                            background:
                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                    >
                        <Gem className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-sm text-foreground">
                        ListingGem
                    </span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* ── Mobile drawer ─────────────────────────────────── */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="true"
                    />
                    <aside
                        className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden flex flex-col"
                        style={{
                            background: "rgba(15,23,42,0.97)",
                            borderRight: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {/* Mobile drawer header */}
                        <div
                            className="flex items-center justify-between px-4 py-4"
                            style={{
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.07)",
                            }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    }}
                                >
                                    <Gem className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-bold text-base text-foreground">
                                    ListingGem
                                </span>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <SidebarContent
                                userEmail={userEmail}
                                displayName={displayName}
                                plan={plan}
                                used={used}
                                limit={limit}
                                closeMobile={() => setMobileOpen(false)}
                            />
                        </div>
                    </aside>
                </>
            )}
        </>
    );
}
