import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/services/usage.service";
import { getUserProfile } from "@/services/user.service";
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

    const [profile, stats] = await Promise.all([
        getUserProfile(user.id).catch(() => null),
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

    return (
        <div className="flex min-h-screen bg-background">
            {/* Single ambient glow — top left only */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                aria-hidden="true"
            >
                <div
                    className="absolute -top-40 -left-40 h-150 w-150nded-full opacity-[0.07]"
                    style={{
                        background:
                            "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
                    }}
                />
                <div
                    className="absolute top-1/2 -right-40 h-100 w-100 rounded-full opacity-[0.05]"
                    style={{
                        background:
                            "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
                    }}
                />
            </div>

            <Sidebar
                userEmail={profile?.email ?? user.email ?? ""}
                displayName={profile?.displayName ?? ""}
                plan={stats.plan}
                used={stats.used}
                limit={stats.limit}
            />

            <main className="relative z-10 flex-1 min-w-0">
                <div className="lg:hidden h-14" aria-hidden="true" />
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
