import { openai } from "@/lib/ai/openai-client";
import { buildPrompt } from "@/lib/ai/prompt-builder";
import { parseGenerationResponse } from "@/lib/ai/response-parser";
import type { GenerationInput, ListingOutput } from "@/types";

/* ------------------------------------------------------------------ */
/*  Config — centralized, easy to make per-user in future              */
/* ------------------------------------------------------------------ */

const AI_CONFIG = {
    model: "gpt-4o-mini" as const,
    max_tokens: 2000,
    temperature: 0.7,
    maxRetries: 2,
    retryDelay: 1000, // ms — doubles on each retry
};

/* ------------------------------------------------------------------ */
/*  Return type                                                         */
/* ------------------------------------------------------------------ */

export type AIServiceResult =
    | { success: true; data: ListingOutput; tokensUsed: number }
    | { success: false; error: string };

/* ------------------------------------------------------------------ */
/*  generateListing                                                     */
/* ------------------------------------------------------------------ */

export async function generateListing(
    input: GenerationInput,
): Promise<AIServiceResult> {
    const { systemPrompt, userPrompt } = buildPrompt(input);

    // Retry loop — handles transient 429s and 5xx errors
    let lastError: unknown;
    for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt++) {
        try {
            const completion = await openai.chat.completions.create({
                model: AI_CONFIG.model,
                max_tokens: AI_CONFIG.max_tokens,
                temperature: AI_CONFIG.temperature,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            });

            const choice = completion.choices[0];

            if (!choice?.message?.content) {
                return {
                    success: false,
                    error: "OpenAI returned an empty response. Please try again.",
                };
            }

            const rawResponse = choice.message.content;
            const tokensUsed = completion.usage?.total_tokens ?? 0;

            // Parse and validate
            const parsed = parseGenerationResponse(rawResponse);

            if (!parsed.success) {
                // AI returned valid JSON but wrong shape — no point retrying
                console.error("[ai.service] Parse failed:", {
                    error: parsed.error,
                    raw: rawResponse.slice(0, 300),
                });
                return {
                    success: false,
                    error: "The AI didn't generate a complete listing. Please try again.",
                };
            }

            return { success: true, data: parsed.data, tokensUsed };
        } catch (err) {
            lastError = err;

            const { status, code } = extractErrorInfo(err);

            // Log full error for debugging — always
            console.error(
                `[ai.service] OpenAI error (attempt ${attempt}/${AI_CONFIG.maxRetries}):`,
                {
                    status,
                    code,
                    err,
                },
            );

            // Only retry on transient errors
            const isTransient =
                status === 429 ||
                status === 500 ||
                status === 503 ||
                code === "rate_limit_exceeded";

            if (!isTransient || attempt === AI_CONFIG.maxRetries) {
                return { success: false, error: formatOpenAIError(err) };
            }

            // Exponential backoff before retry
            const delay = AI_CONFIG.retryDelay * Math.pow(2, attempt - 1);
            console.warn(`[ai.service] Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    // Should never reach here but TypeScript needs it
    console.error("[ai.service] All retries exhausted:", lastError);
    return { success: false, error: formatOpenAIError(lastError) };
}

/* ------------------------------------------------------------------ */
/*  extractErrorInfo                                                    */
/*  Safely extracts status + code from any error shape                 */
/* ------------------------------------------------------------------ */

function extractErrorInfo(err: unknown): { status?: number; code?: string } {
    if (!err || typeof err !== "object") return {};

    const e = err as Record<string, unknown>;
    // OpenAI SDK wraps API errors in err.error for some versions
    const apiError = e.error as Record<string, unknown> | undefined;

    const status = (e.status ?? apiError?.status) as number | undefined;
    const code = (apiError?.code ?? e.code) as string | undefined;

    return { status, code };
}

/* ------------------------------------------------------------------ */
/*  formatOpenAIError                                                   */
/*  Returns clean user-facing message — never exposes internals        */
/* ------------------------------------------------------------------ */

function formatOpenAIError(err: unknown): string {
    const { status, code } = extractErrorInfo(err);

    if (status === 401) {
        return "Invalid OpenAI API key. Please check your configuration.";
    }
    if (status === 429 || code === "rate_limit_exceeded") {
        return "Too many requests. Please wait a moment and try again.";
    }
    if (status === 500 || status === 503) {
        return "OpenAI is temporarily unavailable. Please try again shortly.";
    }
    if (code === "context_length_exceeded") {
        return "Your product description is too long. Please shorten it and try again.";
    }
    if (code === "insufficient_quota") {
        return "OpenAI quota exceeded. Please check your billing at platform.openai.com.";
    }

    // Fallback — safe generic message, never expose raw error to user
    return "Failed to generate listing. Please try again.";
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
