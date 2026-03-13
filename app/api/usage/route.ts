// app/api/usage/route.ts

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/services/usage.service";

// Force dynamic — usage data must never be cached
export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { success: false, error: "Unauthorized." },
            { status: 401 },
        );
    }

    try {
        const stats = await getUsageStats(user.id);
        return NextResponse.json({ success: true, data: stats });
    } catch (err) {
        console.error("[GET /api/usage] Unexpected error:", {
            userId: user.id,
            err,
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch usage stats." },
            { status: 500 },
        );
    }
}
