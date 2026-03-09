import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

    // Fetch profile and usage in parallel
    const [profileResult, usageResult] = await Promise.all([
        supabase
            .from("user_profiles")
            .select(
                "display_name, email, onboarding_completed, default_platform, default_tone",
            )
            .eq("id", user.id)
            .single(),
        supabase
            .from("subscriptions")
            .select("plan")
            .eq("user_id", user.id)
            .single(),
    ]);

    const profile = profileResult.data;
    const plan = usageResult.data?.plan ?? "free";

    // Redirect to onboarding if not completed
    if (profile && !profile.onboarding_completed) {
        redirect("/onboarding");
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar
                plan={plan}
                displayName={profile?.display_name ?? profile?.email ?? ""}
            />
            <main className="flex-1 ml-64 p-8">{children}</main>
        </div>
    );
}
