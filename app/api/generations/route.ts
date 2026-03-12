// app/api/generations/route.ts
// GET /api/generations?page=1&limit=20

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listGenerations } from "@/services/generation.service";

export async function GET(req: NextRequest) {
    // Auth
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

    // Pagination params
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
        50,
        Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );

    const result = await listGenerations(user.id, page, limit);

    if (!result.success) {
        return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
        );
    }

    return NextResponse.json({
        success: true,
        generations: result.generations,
        pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            hasMore: page * limit < result.total,
        },
    });
}
