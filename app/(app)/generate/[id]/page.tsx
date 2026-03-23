// app/(app)/generate/[id]/page.tsx

import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGeneration } from "@/services/generation.service";
import { getPlan } from "@/services/subscription.service";
import { GenerationResult } from "@/components/generate/GenerationResult";
import { RefreshLayout } from "@/components/ui/RefreshLayout"; // ← new
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { title: "Generation — ListingGem" };
    const result = await getGeneration(user.id, id);
    if (!result.success) return { title: "Generation — ListingGem" };
    return { title: `${result.generation.product_name} — ListingGem` };
}

export default async function GenerationPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const [result, plan] = await Promise.all([
        getGeneration(user.id, id),
        getPlan(user.id),
    ]);

    if (!result.success) {
        if (result.code === "not_found") notFound();
        console.error("[GenerationPage] getGeneration failed:", {
            userId: user.id,
            id,
            code: result.code,
            error: result.error,
        });
        return (
            <div className="max-w-2xl mx-auto">
                <div
                    role="alert"
                    className="text-center py-20 rounded-2xl"
                    style={{
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.15)",
                    }}
                >
                    <p className="font-semibold text-foreground">
                        Failed to load generation
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                        Please try again or contact support.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/*
                Calls router.refresh() on mount — forces the layout to
                re-fetch getUsageStats so the sidebar count updates.
                Must happen AFTER the server has saved + incremented usage.
            */}
            <RefreshLayout />
            <GenerationResult generation={result.generation} plan={plan} />
        </div>
    );
}
