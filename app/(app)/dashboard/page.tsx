// app/(app)/dashboard/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, email")
        .eq("id", user!.id)
        .single();

    const name = profile?.display_name ?? profile?.email ?? "there";

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {name.split("@")[0]} 👋
                </h1>
                <p className="text-slate-500 mt-1">
                    Ready to generate some listings?
                </p>
            </div>

            <Link
                href="/generate"
                className="flex items-center gap-4 p-6 bg-slate-900 text-white rounded-2xl hover:bg-slate-700 transition-colors"
            >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <p className="font-bold text-lg">Generate a new listing</p>
                    <p className="text-slate-300 text-sm">
                        AI-optimized title, bullets, description and tags
                    </p>
                </div>
            </Link>
        </div>
    );
}
