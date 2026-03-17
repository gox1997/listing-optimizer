// app/api/usage/route.ts

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/services/usage.service";
import type { ApiResponse, UsageStats } from "@/types";

// Force dynamic — usage data must never be cached.
// Stale quota numbers would let users generate past their limit.
export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "You must be logged in.",
                },
            },
            { status: 401 },
        );
    }

    try {
        const stats = await getUsageStats(user.id);
        return NextResponse.json<ApiResponse<UsageStats>>({
            success: true,
            data: stats,
        });
    } catch (err) {
        console.error("[GET /api/usage] Unexpected error:", {
            userId: user.id,
            err,
        });
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to fetch usage stats.",
                },
            },
            { status: 500 },
        );
    }
}
