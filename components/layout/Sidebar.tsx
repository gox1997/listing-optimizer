"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SIDEBAR_LINKS, APP_NAME } from "@/config";
import { cn } from "@/lib/utils/cn";
import {
    LayoutDashboard,
    Sparkles,
    History,
    Layers,
    Settings,
    LogOut,
    Zap,
} from "lucide-react";
import type { Plan } from "@/types";

// Map icon name strings from config to actual Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Sparkles,
    History,
    Layers,
    Settings,
};

type Props = {
    plan: Plan | string;
    displayName: string;
};

export function Sidebar({ plan, displayName }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClientSupabaseClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/auth");
    };

    const isPlanSufficient = (requiresPlan?: string) => {
        if (!requiresPlan) return true;
        const order = ["free", "pro", "business", "agency"];
        return order.indexOf(plan) >= order.indexOf(requiresPlan);
    };

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-slate-900">{APP_NAME}</span>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {SIDEBAR_LINKS.map((link) => {
                    const Icon = ICON_MAP[link.icon];
                    const isActive =
                        pathname === link.href ||
                        pathname.startsWith(link.href + "/");
                    const hasAccess = isPlanSufficient(link.requiresPlan);

                    return (
                        <Link
                            key={link.href}
                            href={hasAccess ? link.href : "/upgrade"}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                            )}
                        >
                            {Icon && (
                                <Icon
                                    className={cn(
                                        "w-4 h-4 shrink-0",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-400",
                                    )}
                                />
                            )}
                            <span className="flex-1">{link.label}</span>

                            {/* Plan badge */}
                            {link.badge && !hasAccess && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-medium">
                                    {link.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section - plan + user */}
            <div className="px-3 pb-4 space-y-2 border-t border-slate-100 pt-3">
                {/* Upgrade CTA for free users */}
                {plan === "free" && (
                    <Link
                        href="/upgrade"
                        className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
                    >
                        <Zap className="w-4 h-4" />
                        Upgrade Plan
                    </Link>
                )}

                {/* Current plan badge */}
                <div className="px-3 py-2 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Current plan</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                        {plan}
                    </p>
                </div>

                {/* User + sign out */}
                <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-xs text-slate-500 truncate flex-1">
                        {displayName}
                    </p>
                    <button
                        onClick={handleSignOut}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
