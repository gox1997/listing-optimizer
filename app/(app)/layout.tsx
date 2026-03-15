// app/(app)/layout.tsx

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/services/usage.service";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const [profileResult, stats] = await Promise.all([
        supabase
            .from("user_profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .single(),
        getUsageStats(user.id).catch(() => ({
            allowed: true,
            used: 0,
            limit: 5,
            remaining: 5,
            resetDate: "",
            plan: "free" as const,
            percentUsed: 0,
        })),
    ]);

    const fullName = profileResult.data?.full_name ?? "";
    const userEmail = profileResult.data?.email ?? user.email ?? "";

    return (
        <div className="flex min-h-screen bg-linear-to-b from-muted via-amber-500/10 to-muted">
            <Sidebar
                userEmail={userEmail}
                displayName={fullName}
                plan={stats.plan}
                used={stats.used}
                limit={stats.limit}
            />

            {/* Main content */}
            <main className="flex-1 min-w-0">
                {/* Mobile top bar spacer */}
                <div className="lg:hidden h-14" aria-hidden="true" />

                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
