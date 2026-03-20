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
            {/* Animated floating orbs */}
            <div
                className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
                aria-hidden="true"
            >
                {/* Orb 1 — indigo, top left */}
                <div
                    className="absolute rounded-full"
                    style={{
                        top: "-160px",
                        left: "-160px",
                        width: "600px",
                        height: "600px",
                        background:
                            "radial-gradient(circle, #6366f1 0%, transparent 70%)",
                        opacity: 0.07,
                        animation: "orb-drift-1 12s ease-in-out infinite",
                    }}
                />
                {/* Orb 2 — purple, bottom right */}
                <div
                    className="absolute rounded-full"
                    style={{
                        bottom: "-240px",
                        right: "-240px",
                        width: "500px",
                        height: "500px",
                        background:
                            "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
                        opacity: 0.06,
                        animation: "orb-drift-2 15s ease-in-out infinite",
                    }}
                />
                {/* Orb 3 — violet, mid right */}
                <div
                    className="absolute rounded-full"
                    style={{
                        top: "33%",
                        right: "-80px",
                        width: "300px",
                        height: "300px",
                        background:
                            "radial-gradient(circle, #c084fc 0%, transparent 70%)",
                        opacity: 0.04,
                        animation:
                            "orb-drift-1 20s ease-in-out infinite reverse",
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
