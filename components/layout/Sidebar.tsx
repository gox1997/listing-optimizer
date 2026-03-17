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
import Image from "next/image";

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
    limit: number;
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

    const usagePercent = Math.min(100, Math.round((used / limit) * 100));
    const isNearLimit = usagePercent >= 60; // matches dashboard threshold — shows at 3/5
    const isAtLimit = used >= limit;
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const initials = displayName
        ? displayName.slice(0, 2).toUpperCase()
        : userEmail.slice(0, 2).toUpperCase();

    const sidebarContent = (isMobile: boolean) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 pt-6 pb-2">
                <Link
                    href="/dashboard"
                    onClick={closeMobile}
                    className="inline-flex items-center gap-2.5 group"
                >
                    <Image
                        src="/logo-bull.svg"
                        alt="Bull"
                        width={45}
                        height={45}
                        className="rounded-lg group-hover:scale-105 transition-transform mb-1"
                    />
                    <Image
                        src="/logo-ListingBull.svg"
                        alt="ListingBull"
                        width={150}
                        height={45}
                        className="rounded-lg "
                    />
                </Link>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-muted mb-4" />

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
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : highlight
                                      ? "text-foreground hover:bg-primary hover:text-primary-foreground"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary text-primary-foreground rounded-md group-hover:bg-primary-foreground group-hover:text-primary transition-colors">
                                    NEW
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Usage widget */}
            <div className="mx-3 mb-3">
                <div
                    className={cn(
                        "rounded-xl p-3.5 border transition-colors",
                        isAtLimit
                            ? "bg-red-50   border-red-200"
                            : isNearLimit
                              ? "bg-amber-50 border-amber-200"
                              : "bg-muted border-border",
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
                                          : "text-muted-foreground",
                                )}
                                aria-hidden="true"
                            />
                            <span className="text-xs font-semibold text-foreground">
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
                                      : "text-muted-foreground",
                            )}
                        >
                            {used}/{limit}
                        </span>
                    </div>

                    <div className="h-1.5 bg-sidebar-elite rounded-full overflow-hidden border border-border">
                        <div
                            role="progressbar"
                            aria-valuenow={used}
                            aria-valuemin={0}
                            aria-valuemax={limit}
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
                            className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Zap className="w-3 h-3" aria-hidden="true" />
                            Upgrade plan
                        </Link>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-muted" />

            {/* User + sign out */}
            <div className="p-3">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 text-primary-foreground text-xs font-bold">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {displayName || userEmail}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">
                            {planLabel} plan
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        aria-label="Sign out"
                        className={cn(
                            "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
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
                className="hidden lg:block w-60 shrink-0 ml-1 my-2 h-[calc(100vh-1rem)] sticky top-2 rounded-xl border border-border bg-card shadow-lg"
                aria-label="Sidebar"
            >
                {sidebarContent(false)}
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
                <Link
                    href="/dashboard"
                    onClick={closeMobile}
                    className="inline-flex items-center gap-2.5 group"
                >
                    <Image
                        src="/logo-bull.svg"
                        alt="Bull"
                        width={60}
                        height={60}
                        className="rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <Image
                        src="/logo-ListingBull.svg"
                        alt="ListingBull"
                        width={150}
                        height={45}
                        className="rounded-lg group-hover:scale-105 mt-2 transition-transform"
                    />
                </Link>

                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-sidebar"
                    className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-card shadow-2xl",
                    "transition-transform duration-300 ease-in-out",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <button
                    type="button"
                    onClick={closeMobile}
                    aria-label="Close navigation menu"
                    className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>

                {sidebarContent(true)}
            </aside>
        </>
    );
}

Sidebar.displayName = "Sidebar";
