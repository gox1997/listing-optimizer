import { openai } from "@/lib/ai/openai-client";
import { buildPrompt } from "@/lib/ai/prompt-builder";
import {
    parseGenerationResponse,
    parseListingScore,
} from "@/lib/ai/response-parser";
import {
    LISTING_SCORE_SYSTEM_PROMPT,
    buildListingScorePrompt,
} from "@/lib/ai/prompts/listing-score";
import type { GenerationInput, ListingOutput, ListingScore } from "@/types";

const AI_CONFIG = {
    model: "gpt-4o-mini" as const,
    max_tokens: 2000,
    temperature: 0.7,
    maxRetries: 2,
    retryDelay: 1000,
};

export type AIServiceResult =
    | { success: true; data: ListingOutput; tokensUsed: number }
    | { success: false; error: string };

// ── generateListing ──────────────────────────────────────────────────

export async function generateListing(
    input: GenerationInput,
): Promise<AIServiceResult> {
    // Dev mock — remove before production
    if (process.env.NODE_ENV === "development") {
        return {
            success: true,
            tokensUsed: 0,
            data: {
                seoTitle:
                    "Premium Stainless Steel Insulated Water Bottle 32oz — BPA Free, Leak Proof",
                bulletPoints: [
                    "STAYS COLD 24 HOURS: Double-wall vacuum insulation keeps drinks ice cold all day",
                    "LEAK-PROOF DESIGN: Secure lid with safety lock prevents spills in your bag",
                    "PREMIUM STAINLESS STEEL: BPA-free 18/8 food-grade steel, no plastic taste",
                    "WIDE MOUTH OPENING: Fits ice cubes easily, simple to clean by hand or dishwasher",
                    "FITS MOST CUP HOLDERS: Slim 32oz design slides into car cup holders and bike cages",
                ],
                description:
                    "Stay hydrated in style with our premium insulated water bottle. Engineered with double-wall vacuum technology, your drinks stay cold for 24 hours and hot for 12. The 32oz capacity is perfect for the gym, office, hiking, or daily commutes. Made from food-grade 18/8 stainless steel — no plastic taste, no rust, no sweat on the outside. The wide-mouth opening makes it easy to add ice and clean thoroughly. The secure leak-proof lid with safety lock means you can toss it in your bag without worry.",
                metaDescription:
                    "Premium 32oz insulated water bottle. BPA-free stainless steel keeps drinks cold 24hr. Leak-proof, wide mouth, fits cup holders.",
                tags: [
                    "water bottle",
                    "insulated bottle",
                    "stainless steel",
                    "BPA free",
                    "32oz",
                    "leak proof",
                    "gym bottle",
                    "hiking",
                    "vacuum insulated",
                    "reusable bottle",
                ],
                listingScore: {
                    overall: 84,
                    grade: "B",
                    breakdown: {
                        seo: 88,
                        keywords: 82,
                        conversion: 85,
                        compliance: 90,
                    },
                    strengths: [
                        "Primary keyword 'insulated water bottle' appears in the first 3 words of the title, maximising A9 ranking weight",
                        "All 5 bullet points lead with an ALL CAPS benefit header — correct Amazon format",
                        "Meta description is 128 characters — within the 160-char limit with room to spare",
                    ],
                    improvements: [
                        {
                            priority: "high",
                            field: "tags",
                            issue: "3 of 10 tags are single words ('hiking', '32oz', 'BPA free') — Amazon's A9 treats multi-word phrases as higher-intent search queries",
                            suggestion:
                                "Replace single-word tags with long-tail phrases: 'hiking water bottle', '32oz insulated flask', 'BPA free water bottle'",
                        },
                        {
                            priority: "medium",
                            field: "description",
                            issue: "Description opens with a weak generic phrase 'Stay hydrated in style' — the first sentence carries the most keyword weight",
                            suggestion:
                                "Lead with the primary keyword: 'This 32oz insulated water bottle keeps drinks cold for 24 hours...'",
                        },
                    ],
                    verdict:
                        "Strong listing held back by low-value single-word tags — fixing the tag strategy alone could meaningfully improve search visibility.",
                },
            },
        };
    }

    // ── Step 1: Generate listing ─────────────────────────────────────
    const listingResult = await callOpenAI(input);
    if (!listingResult.success) return listingResult;

    // ── Step 2: Score the listing (non-blocking — never fails the generation)
    const score = await scoreListingQuietly(input, listingResult.data);

    return {
        success: true,
        data: { ...listingResult.data, listingScore: score ?? undefined },
        tokensUsed: listingResult.tokensUsed,
    };
}

// ── callOpenAI — main listing generation ────────────────────────────

async function callOpenAI(
    input: GenerationInput,
): Promise<
    | { success: true; data: ListingOutput; tokensUsed: number }
    | { success: false; error: string }
> {
    const { systemPrompt, userPrompt } = buildPrompt(input);
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

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                return {
                    success: false,
                    error: "OpenAI returned an empty response. Please try again.",
                };
            }

            const parsed = parseGenerationResponse(content);
            if (!parsed.success) {
                console.error("[ai.service] Parse failed:", parsed.error);
                return {
                    success: false,
                    error: "The AI didn't generate a complete listing. Please try again.",
                };
            }

            return {
                success: true,
                data: parsed.data,
                tokensUsed: completion.usage?.total_tokens ?? 0,
            };
        } catch (err) {
            lastError = err;
            const { status, code } = extractErrorInfo(err);
            console.error(
                `[ai.service] OpenAI error (attempt ${attempt}/${AI_CONFIG.maxRetries}):`,
                { status, code, err },
            );

            const isTransient =
                status === 429 ||
                status === 500 ||
                status === 503 ||
                code === "rate_limit_exceeded";
            if (!isTransient || attempt === AI_CONFIG.maxRetries) {
                return { success: false, error: formatOpenAIError(err) };
            }

            const delay = AI_CONFIG.retryDelay * Math.pow(2, attempt - 1);
            console.warn(`[ai.service] Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    return { success: false, error: formatOpenAIError(lastError) };
}

// ── scoreListingQuietly — second AI call, never blocks generation ────
// Returns null on any failure — score is additive, not required

async function scoreListingQuietly(
    input: GenerationInput,
    listing: ListingOutput,
): Promise<ListingScore | null> {
    try {
        const userPrompt = buildListingScorePrompt({
            platform: input.platform,
            tone: input.tone,
            productName: input.productName,
            primaryKeyword: input.primaryKeyword,
            listing: {
                seoTitle: listing.seoTitle,
                bulletPoints: listing.bulletPoints,
                description: listing.description,
                metaDescription: listing.metaDescription,
                tags: listing.tags,
            },
        });

        const completion = await openai.chat.completions.create({
            model: AI_CONFIG.model,
            max_tokens: 800,
            temperature: 0.2, // low temperature — we want consistent scoring
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: LISTING_SCORE_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;

        const parsed = parseListingScore(content);
        if (!parsed.success) {
            console.warn("[ai.service] Score parse failed:", parsed.error);
            return null;
        }

        return parsed.data;
    } catch (err) {
        // Score failure is non-fatal — log and continue
        console.warn("[ai.service] Scoring call failed (non-fatal):", err);
        return null;
    }
}

// ── Helpers ──────────────────────────────────────────────────────────

function extractErrorInfo(err: unknown): { status?: number; code?: string } {
    if (!err || typeof err !== "object") return {};
    const e = err as Record<string, unknown>;
    const apiError = e.error as Record<string, unknown> | undefined;
    const status = (e.status ?? apiError?.status) as number | undefined;
    const code = (apiError?.code ?? e.code) as string | undefined;
    return { status, code };
}

function formatOpenAIError(err: unknown): string {
    const { status, code } = extractErrorInfo(err);
    if (status === 401)
        return "Invalid OpenAI API key. Please check your configuration.";
    if (status === 429 || code === "rate_limit_exceeded")
        return "Too many requests. Please wait a moment and try again.";
    if (status === 500 || status === 503)
        return "OpenAI is temporarily unavailable. Please try again shortly.";
    if (code === "context_length_exceeded")
        return "Your product description is too long. Please shorten it and try again.";
    if (code === "insufficient_quota")
        return "OpenAI quota exceeded. Please check your billing at platform.openai.com.";
    return "Failed to generate listing. Please try again.";
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
