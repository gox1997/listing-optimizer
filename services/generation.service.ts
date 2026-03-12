// services/generation.service.ts

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateListing } from "@/services/ai.service";
import { checkQuota, incrementUsage } from "@/services/usage.service";
import type { GenerationInput, ListingOutput } from "@/types";

/* ------------------------------------------------------------------ */
/*  Error codes — frontend uses these to show the right UI             */
/* ------------------------------------------------------------------ */

export type GenerationErrorCode =
    | "quota_exceeded" // show upgrade modal
    | "ai_error" // show retry button
    | "save_error"; // show retry button + contact support

/* ------------------------------------------------------------------ */
/*  Return type                                                         */
/* ------------------------------------------------------------------ */

export type GenerationResult =
    | {
          success: true;
          generation: {
              id: string;
              output: ListingOutput;
              tokensUsed: number;
              createdAt: string;
          };
      }
    | {
          success: false;
          error: string;
          code: GenerationErrorCode;
      };

/* ------------------------------------------------------------------ */
/*  createGeneration                                                    */
/*  Orchestrates: quota check → AI call → DB save → usage increment   */
/* ------------------------------------------------------------------ */

export async function createGeneration(
    userId: string,
    input: GenerationInput,
): Promise<GenerationResult> {
    // Step 1: Check quota — never call OpenAI if user is over limit
    const quota = await checkQuota(userId);

    if (!quota.allowed) {
        return {
            success: false,
            code: "quota_exceeded",
            error: `You've used all ${quota.limit} generations for this month. Upgrade your plan to continue.`,
        };
    }

    // Step 2: Call OpenAI
    const aiResult = await generateListing(input);

    if (!aiResult.success) {
        return {
            success: false,
            code: "ai_error",
            error: aiResult.error,
        };
    }

    // Step 3: Save to DB
    const saveResult = await saveGeneration({
        userId,
        input,
        output: aiResult.data,
        tokensUsed: aiResult.tokensUsed,
    });

    if (!saveResult.success) {
        // AI call succeeded but save failed — log, don't increment
        console.error(
            "[generation.service] Save failed after successful AI call:",
            {
                userId,
                error: saveResult.error,
            },
        );
        return {
            success: false,
            code: "save_error",
            error: "Your listing was generated but could not be saved. Please try again.",
        };
    }

    // Step 4: Increment usage — after successful save
    // Fire and don't await — never block the response on a counter increment
    void incrementUsage(userId);

    return {
        success: true,
        generation: {
            id: saveResult.id,
            output: aiResult.data,
            tokensUsed: aiResult.tokensUsed,
            createdAt: saveResult.createdAt,
        },
    };
}

/* ------------------------------------------------------------------ */
/*  getGeneration                                                       */
/*  Fetches a single generation — enforces ownership via user_id       */
/* ------------------------------------------------------------------ */

export async function getGeneration(
    userId: string,
    generationId: string,
): Promise<
    | { success: true; generation: GenerationRow }
    | { success: false; error: string }
> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", generationId)
        .eq("user_id", userId) // ownership enforced at query level
        .single();

    if (error || !data) {
        return { success: false, error: "Generation not found." };
    }

    return { success: true, generation: data as GenerationRow };
}

/* ------------------------------------------------------------------ */
/*  listGenerations                                                     */
/*  Paginated history for the current user                             */
/* ------------------------------------------------------------------ */

export async function listGenerations(
    userId: string,
    page = 1,
    limit = 20,
): Promise<
    | { success: true; generations: GenerationRow[]; total: number }
    | { success: false; error: string }
> {
    const supabase = await createServerSupabaseClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
        .from("generations")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("[generation.service] listGenerations failed:", {
            userId,
            error: error.message,
        });
        return { success: false, error: "Failed to fetch generation history." };
    }

    return {
        success: true,
        generations: (data ?? []) as GenerationRow[],
        total: count ?? 0,
    };
}

/* ------------------------------------------------------------------ */
/*  deleteGeneration                                                    */
/*  Soft pattern: enforces ownership, returns not-found if wrong user  */
/* ------------------------------------------------------------------ */

export async function deleteGeneration(
    userId: string,
    generationId: string,
): Promise<{ success: true } | { success: false; error: string }> {
    const supabase = await createServerSupabaseClient();

    const { error, count } = await supabase
        .from("generations")
        .delete({ count: "exact" })
        .eq("id", generationId)
        .eq("user_id", userId);

    if (error) {
        console.error("[generation.service] deleteGeneration failed:", {
            userId,
            generationId,
            error: error.message,
        });
        return { success: false, error: "Failed to delete generation." };
    }

    if (count === 0) {
        return { success: false, error: "Generation not found." };
    }

    return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Internal: saveGeneration                                            */
/* ------------------------------------------------------------------ */

type SaveInput = {
    userId: string;
    input: GenerationInput;
    output: ListingOutput;
    tokensUsed: number;
};

type SaveResult =
    | { success: true; id: string; createdAt: string }
    | { success: false; error: string };

async function saveGeneration(params: SaveInput): Promise<SaveResult> {
    const admin = createAdminSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
        .from("generations")
        .insert({
            user_id: params.userId,
            platform: params.input.platform,
            tone: params.input.tone,
            product_name: params.input.productName,
            primary_keyword: params.input.primaryKeyword ?? null,
            input_data: params.input,
            output_data: params.output,
            tokens_used: params.tokensUsed,
        })
        .select("id, created_at")
        .single();

    if (error || !data) {
        return {
            success: false,
            error: error?.message ?? "Insert returned no data.",
        };
    }

    return {
        success: true,
        id: data.id,
        createdAt: data.created_at,
    };
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type GenerationRow = {
    id: string;
    user_id: string;
    platform: string;
    tone: string;
    product_name: string;
    primary_keyword: string | null;
    input_data: GenerationInput;
    output_data: ListingOutput;
    tokens_used: number;
    created_at: string;
};
