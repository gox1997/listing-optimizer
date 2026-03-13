// app/(app)/generate/[id]/page.tsx

import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGeneration } from "@/services/generation.service";
import { GenerationResult } from "@/components/generate/GenerationResult";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ id: string }>;
};

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { title: "Generation — ListingAI" };

    const result = await getGeneration(user.id, id);

    if (!result.success) return { title: "Generation — ListingAI" };

    return {
        title: `${result.generation.product_name} — ListingAI`,
    };
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function GenerationPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    const result = await getGeneration(user.id, id);

    if (!result.success) {
        if (result.code === "not_found") notFound();

        // Internal error — log and show fallback
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
                    className="text-center py-20 bg-white border border-red-100 rounded-2xl"
                >
                    <p className="font-semibold text-slate-900">
                        Failed to load generation
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                        Please try again or contact support.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <GenerationResult generation={result.generation} />
        </div>
    );
}
