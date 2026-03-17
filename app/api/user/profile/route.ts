// app/api/user/profile/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completeOnboarding, updateUserProfile } from "@/services/user.service";
import type { ApiResponse } from "@/types";

const PatchSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    defaultPlatform: z
        .enum(["amazon", "shopify", "etsy", "general"])
        .optional(),
    defaultTone: z
        .enum(["professional", "casual", "luxury", "playful", "technical"])
        .optional(),
    niche: z
        .enum([
            "fashion",
            "electronics",
            "home_garden",
            "sports",
            "beauty",
            "toys",
            "food",
            "other",
        ])
        .nullable()
        .optional(),
    onboardingCompleted: z.boolean().optional(),
});

export async function PATCH(request: Request) {
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

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request data.",
                },
            },
            { status: 422 },
        );
    }

    const { onboardingCompleted, ...profileUpdates } = parsed.data;

    // If this is the onboarding completion call
    if (
        onboardingCompleted &&
        profileUpdates.defaultPlatform &&
        profileUpdates.defaultTone
    ) {
        await completeOnboarding(user.id, {
            defaultPlatform: profileUpdates.defaultPlatform,
            defaultTone: profileUpdates.defaultTone,
            niche: profileUpdates.niche ?? "other",
        });
        return NextResponse.json<ApiResponse<null>>({
            success: true,
            data: null,
        });
    }

    // Otherwise it's a settings update
    const updates = {
        ...(profileUpdates.displayName !== undefined && {
            displayName: profileUpdates.displayName,
        }),
        ...(profileUpdates.defaultPlatform !== undefined && {
            defaultPlatform: profileUpdates.defaultPlatform,
        }),
        ...(profileUpdates.defaultTone !== undefined && {
            defaultTone: profileUpdates.defaultTone,
        }),
        ...(profileUpdates.niche !== undefined && {
            niche: profileUpdates.niche ?? undefined,
        }),
    };

    if (Object.keys(updates).length === 0) {
        return NextResponse.json<ApiResponse<null>>({
            success: true,
            data: null,
        });
    }

    await updateUserProfile(user.id, updates);

    return NextResponse.json<ApiResponse<null>>({ success: true, data: null });
}
