// app/api/generations/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGeneration, deleteGeneration } from "@/services/generation.service";
import type { ApiResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
    return UUID_REGEX.test(value);
}

function errorToStatus(code: string): number {
    if (code === "not_found") return 404;
    return 500;
}

type RouteParams = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/generations/:id
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    if (!isValidUUID(id)) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: "Invalid ID format.",
                },
            },
            { status: 400 },
        );
    }

    const result = await getGeneration(user.id, id);

    if (!result.success) {
        console.error(`[API] GET /api/generations/${id} failed:`, {
            userId: user.id,
            code: result.code,
            error: result.error,
        });
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: { code: "NOT_FOUND", message: result.error },
            },
            { status: errorToStatus(result.code) },
        );
    }

    return NextResponse.json<ApiResponse<typeof result>>({
        success: true,
        data: result,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/generations/:id
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    if (!isValidUUID(id)) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: "Invalid ID format.",
                },
            },
            { status: 400 },
        );
    }

    const result = await deleteGeneration(user.id, id);

    if (!result.success) {
        console.error(`[API] DELETE /api/generations/${id} failed:`, {
            userId: user.id,
            code: result.code,
            error: result.error,
        });
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: { code: "INTERNAL_ERROR", message: result.error },
            },
            { status: errorToStatus(result.code) },
        );
    }

    // 204 No Content — correct HTTP semantics for a successful DELETE
    return new NextResponse(null, { status: 204 });
}

// ─────────────────────────────────────────────────────────────────────────────
// HEAD /api/generations/:id
// Lightweight existence check — no body returned, used for prefetching.
// ─────────────────────────────────────────────────────────────────────────────

export async function HEAD(_req: NextRequest, { params }: RouteParams) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return new NextResponse(null, { status: 401 });

    const { id } = await params;
    if (!isValidUUID(id)) return new NextResponse(null, { status: 400 });

    const result = await getGeneration(user.id, id);
    return new NextResponse(null, { status: result.success ? 200 : 404 });
}
