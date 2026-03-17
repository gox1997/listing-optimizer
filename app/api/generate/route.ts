// app/api/generate/route.ts
//
// POST /api/generate
//
// Responsibilities of this route — nothing more:
//   1. Authenticate the request
//   2. Validate and parse the request body
//   3. Delegate to createGeneration() in generation.service.ts
//   4. Map the result to the correct HTTP response
//
// Quota check, AI call, DB persistence, usage increment
// are all owned by generation.service.ts — not this file.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createGeneration } from "@/services/generation.service";
import type { ApiResponse } from "@/types";
import type { GenerationResult } from "@/services/generation.service";

// ─────────────────────────────────────────────────────────────────────────────
// Request schema
// Validated before any service calls — bad input never reaches the AI.
// ─────────────────────────────────────────────────────────────────────────────

const GenerateRequestSchema = z.object({
    productName: z.string().min(1, "Product name is required").max(200),
    productCategory: z.string().min(1, "Category is required").max(100),
    description: z.string().max(2000).optional(),
    features: z.array(z.string().max(200)).max(10).optional(),
    platform: z.enum(["amazon", "shopify", "etsy", "general"]),
    tone: z.enum(["professional", "casual", "luxury", "playful", "technical"]),
    keywords: z.array(z.string().max(100)).max(15).optional(),
    primaryKeyword: z.string().max(100).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Error code → HTTP status mapping
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_STATUS: Record<string, number> = {
    quota_exceeded: 402,
    ai_error: 503,
    save_error: 500,
};

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
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
                    message: "You must be logged in to generate a listing.",
                },
            },
            { status: 401 },
        );
    }

    // ── 2. Parse and validate request body ───────────────────────────────────
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: "Request body must be valid JSON.",
                },
            },
            { status: 400 },
        );
    }

    const parsed = GenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
        const details = parsed.error.errors.map(
            (e) => `${e.path.join(".")}: ${e.message}`,
        );
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request data.",
                    details,
                },
            },
            { status: 422 },
        );
    }

    // ── 3. Delegate to service ───────────────────────────────────────────────
    const result: GenerationResult = await createGeneration(
        user.id,
        parsed.data,
    );

    // ── 4. Map result to HTTP response ───────────────────────────────────────
    if (!result.success) {
        const status = ERROR_STATUS[result.code] ?? 500;
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code:
                        result.code === "quota_exceeded"
                            ? "QUOTA_EXCEEDED"
                            : "INTERNAL_ERROR",
                    message: result.error,
                },
            },
            { status },
        );
    }

    return NextResponse.json<ApiResponse<GenerationResult>>(
        { success: true, data: result },
        { status: 201 },
    );
}
