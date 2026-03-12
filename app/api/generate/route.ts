import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createGeneration } from "@/services/generation.service";
import { z } from "zod";
import type { GenerationInput } from "@/types";

/* ------------------------------------------------------------------ */
/*  Request validation schema                                           */
/* ------------------------------------------------------------------ */

const GenerateRequestSchema = z.object({
    productName: z
        .string()
        .min(1, "Product name is required")
        .max(200, "Product name is too long"),
    productCategory: z
        .string()
        .min(1, "Category is required")
        .max(100, "Category is too long"),
    platform: z.enum(["amazon", "shopify", "etsy", "general"]),
    tone: z.enum(["professional", "casual", "luxury", "playful", "technical"]),
    description: z.string().max(2000, "Description is too long").optional(),
    features: z.array(z.string().max(300)).max(10).optional(),
    primaryKeyword: z.string().max(100).optional(),
    keywords: z.array(z.string().max(100)).max(20).optional(),
});

/* ------------------------------------------------------------------ */
/*  POST /api/generate                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
    // Step 1: Verify auth
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

    // Step 2: Parse and validate request body
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON in request body." },
            { status: 400 },
        );
    }

    const parsed = GenerateRequestSchema.safeParse(body);

    if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return NextResponse.json(
            {
                success: false,
                error: `${firstError.path.join(".")}: ${firstError.message}`,
                fields: parsed.error.flatten().fieldErrors,
            },
            { status: 422 },
        );
    }

    const input: GenerationInput = parsed.data;

    // Step 3: Orchestrate — quota check + AI + save + increment
    const result = await createGeneration(user.id, input);

    if (!result.success) {
        const status =
            result.code === "quota_exceeded"
                ? 402
                : result.code === "ai_error"
                  ? 502
                  : 500;

        return NextResponse.json(
            {
                success: false,
                error: result.error,
                code: result.code,
            },
            { status },
        );
    }

    // Step 4: Return generation
    return NextResponse.json(
        {
            success: true,
            generation: result.generation,
        },
        { status: 201 },
    );
}
