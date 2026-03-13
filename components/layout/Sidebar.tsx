// components/layout/Sidebar.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
    LayoutDashboard,
    Sparkles,
    History,
    LogOut,
    Menu,
    X,
    Zap,
    ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Nav config                                                          */
/* ------------------------------------------------------------------ */

type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    highlight?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/generate",
        label: "Generate",
        icon: Sparkles,
        highlight: true,
    },
    {
        href: "/history",
        label: "History",
        icon: History,
    },
];

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

type Props = {
    userEmail: string;
    displayName: string;
    plan: string;
    used: number;
    limit: number | typeof Infinity;
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function Sidebar({ userEmail, displayName, plan, used, limit }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClientSupabaseClient();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    // Trap scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    const handleSignOut = useCallback(async () => {
        setSigningOut(true);
        await supabase.auth.signOut();
        router.push("/auth");
    }, [supabase, router]);

    const closeMobile = useCallback(() => setMobileOpen(false), []);

    const usagePercent =
        limit === Infinity
            ? 0
            : Math.min(100, Math.round((used / (limit as number)) * 100));
    const isNearLimit = usagePercent >= 80 && limit !== Infinity;
    const isAtLimit = limit !== Infinity && used >= (limit as number);
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const initials = displayName
        ? displayName.slice(0, 2).toUpperCase()
        : userEmail.slice(0, 2).toUpperCase();

    const sidebarContent = (isMobile: boolean) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 pt-6 pb-4">
                <Link
                    href="/dashboard"
                    onClick={closeMobile}
                    className="inline-flex items-center gap-2.5 group"
                >
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Sparkles
                            className="w-4 h-4 text-white"
                            aria-hidden="true"
                        />
                    </div>
                    <span className="font-bold text-slate-900 text-2xl tracking-tight ">
                        Listing<span className="text-slate-400">Bull</span>
                    </span>
                </Link>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-slate-100 mb-4" />

            {/* Nav */}
            <nav
                aria-label="Main navigation"
                className="flex-1 px-3 space-y-0.5"
            >
                {NAV_ITEMS.map(({ href, label, icon: Icon, highlight }) => {
                    const isActive =
                        pathname === href || pathname.startsWith(href + "/");

                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={closeMobile}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
                                isActive
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : highlight
                                      ? "text-slate-700 hover:bg-slate-900 hover:text-white"
                                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            )}
                        >
                            <Icon
                                className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110"
                                aria-hidden="true"
                            />
                            <span className="flex-1 text-base sm:text-lg">
                                {label}
                            </span>

                            {isActive && (
                                <ChevronRight
                                    className="w-3.5 h-3.5 opacity-60"
                                    aria-hidden="true"
                                />
                            )}

                            {highlight && !isActive && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded-md group-hover:bg-white group-hover:text-slate-900 transition-colors">
                                    NEW
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Usage widget */}
            {limit !== Infinity && (
                <div className="mx-3 mb-3">
                    <div
                        className={cn(
                            "rounded-xl p-3.5 border transition-colors",
                            isAtLimit
                                ? "bg-red-50   border-red-200"
                                : isNearLimit
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-slate-50 border-slate-200",
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Zap
                                    className={cn(
                                        "w-3.5 h-3.5",
                                        isAtLimit
                                            ? "text-red-500"
                                            : isNearLimit
                                              ? "text-amber-500"
                                              : "text-slate-400",
                                    )}
                                    aria-hidden="true"
                                />
                                <span className="text-xs font-semibold text-slate-700">
                                    Usage
                                </span>
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-bold",
                                    isAtLimit
                                        ? "text-red-600"
                                        : isNearLimit
                                          ? "text-amber-600"
                                          : "text-slate-500",
                                )}
                            >
                                {used}/{limit as number}
                            </span>
                        </div>

                        <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-200">
                            <div
                                role="progressbar"
                                aria-valuenow={used}
                                aria-valuemin={0}
                                aria-valuemax={limit as number}
                                aria-label="Monthly generation usage"
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isAtLimit
                                        ? "bg-red-500"
                                        : isNearLimit
                                          ? "bg-amber-500"
                                          : "bg-emerald-500",
                                )}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>

                        {isAtLimit && (
                            <Link
                                href="/upgrade"
                                onClick={closeMobile}
                                className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                            >
                                <Zap className="w-3 h-3" aria-hidden="true" />
                                Upgrade plan
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="mx-4 h-px bg-slate-100" />

            {/* User + sign out */}
            <div className="p-3">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                            {displayName || userEmail}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {planLabel} plan
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        aria-label="Sign out"
                        className={cn(
                            "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:opacity-40",
                            // Always visible on mobile, hover-reveal on desktop
                            isMobile
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                        )}
                    >
                        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop */}
            <aside
                className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0"
                aria-label="Sidebar"
            >
                {sidebarContent(false)}
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2"
                >
                    <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                        <Sparkles
                            className="w-3.5 h-3.5 text-white"
                            aria-hidden="true"
                        />
                    </div>
                    <span className="font-bold text-slate-900 text-2xl tracking-tight">
                        Listing<span className="text-slate-400">Bull</span>
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-sidebar"
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                    <Menu className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            {/* Mobile backdrop */}
            <div
                className={cn(
                    "lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
                    mobileOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none",
                )}
                aria-hidden="true"
                onClick={closeMobile}
            />

            {/* Mobile drawer */}
            <aside
                id="mobile-sidebar"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                className={cn(
                    "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl",
                    "transition-transform duration-300 ease-in-out",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <button
                    type="button"
                    onClick={closeMobile}
                    aria-label="Close navigation menu"
                    className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>

                {sidebarContent(true)}
            </aside>
        </>
    );
}

Sidebar.displayName = "Sidebar";
