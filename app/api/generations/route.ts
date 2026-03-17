// app/api/generations/route.ts
// GET /api/generations?page=1&limit=20

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listGenerations } from "@/services/generation.service";
import type { ApiResponse } from "@/types";

// Generation history must never be served from cache
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
        50,
        Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );

    const result = await listGenerations(user.id, page, limit);

    if (!result.success) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: { code: "INTERNAL_ERROR", message: result.error },
            },
            { status: 500 },
        );
    }

    return NextResponse.json<ApiResponse<typeof result>>({
        success: true,
        data: result,
    });
}
