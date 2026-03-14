// lib/ai/orchestrator.ts
//
// The AI pipeline orchestrator. Owns the full generation flow:
//
//   0. Input validation      — guard before any AI calls
//   1. Keyword Intelligence  — discovers optimal keywords (non-fatal)
//   2. Input Enrichment      — injects discovered keywords
//   3. Listing Generation    — core AI call (fatal; fallback model on retry exhaustion)
//   4. Response Parsing      — existing Zod validator
//   5. Listing Score         — quality audit (non-fatal)

import { z } from "zod";
import { randomUUID } from "crypto";
import { openai } from "./openai-client";
import { buildPrompt } from "./prompt-builder";
import { parseGenerationResponse } from "./response-parser";
import {
    KEYWORD_INTELLIGENCE_SYSTEM_PROMPT,
    KEYWORD_INTELLIGENCE_PROMPT_VERSION,
    buildKeywordIntelligencePrompt,
} from "./prompts/keyword-intelligence";
import {
    LISTING_SCORE_SYSTEM_PROMPT,
    LISTING_SCORE_PROMPT_VERSION,
    buildListingScorePrompt,
} from "./prompts/listing-score";
import { createRequestLogger, emitMetric, type RequestLogger } from "./logger";
import type { GenerationInput, ListingOutput } from "@/types";

/* ================================================================== */
/*  AI call config                                                      */
/* ================================================================== */

type AICallConfig = {
    model: string;
    max_tokens: number;
    temperature: number;
};

const KEYWORD_CONFIG = {
    model: "gpt-4o-mini",
    max_tokens: 600,
    temperature: 0.3,
} satisfies AICallConfig;

const SCORE_CONFIG = {
    model: "gpt-4o-mini",
    max_tokens: 900,
    temperature: 0.2,
} satisfies AICallConfig;

const GENERATION_CONFIG = {
    model: "gpt-4o-mini",
    max_tokens: 2000,
    temperature: 0.7,
} satisfies AICallConfig;

const GENERATION_FALLBACK_MODEL = "gpt-3.5-turbo" as const;

/* ================================================================== */
/*  Retry config                                                        */
/* ================================================================== */

const RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelayMs: 500,
    transientCodes: new Set([429, 500, 503]),
} as const;

/* ================================================================== */
/*  Input validation schema                                             */
/* ================================================================== */

const OrchestratorInputSchema = z.object({
    productName: z.string().min(1, "productName is required"),
    productCategory: z.string().min(1, "productCategory is required"),
    platform: z.string().min(1, "platform is required"),
    tone: z.string().min(1, "tone is required"),
});

/* ================================================================== */
/*  Public types                                                        */
/* ================================================================== */

export type KeywordResult = {
    primaryKeyword: string;
    secondaryKeywords: string[];
    platformTerms: string[];
    buyerIntent:
        | "transactional"
        | "gift"
        | "replacement"
        | "upgrade"
        | "discovery";
    buyerPersona: string;
    competitorGap: string;
    avoidTerms: string[];
};

export type ScoreBreakdown = {
    seo: number;
    keywords: number;
    conversion: number;
    compliance: number;
};

export type ScoreImprovement = {
    priority: "high" | "medium" | "low";
    field:
        | "seoTitle"
        | "bulletPoints"
        | "description"
        | "metaDescription"
        | "tags";
    issue: string;
    suggestion: string;
};

export type ListingScore = {
    overallScore: number;
    grade: "A" | "B" | "C" | "D" | "F";
    breakdown: ScoreBreakdown;
    strengths: string[];
    improvements: ScoreImprovement[];
    verdict: string;
};

export type OrchestratorResult =
    | {
          success: true;
          listing: ListingOutput;
          score: ListingScore | null;
          keywords: KeywordResult | null;
          tokensUsed: number;
          pipelineMs: number;
          requestId: string;
          usedFallback: boolean;
      }
    | {
          success: false;
          error: string;
          code: "invalid_input" | "generation_failed";
          requestId: string;
      };

/* ================================================================== */
/*  Zod schemas                                                         */
/* ================================================================== */

const KeywordResultSchema = z.object({
    primaryKeyword: z.string().min(2).max(100),
    secondaryKeywords: z.array(z.string().min(2).max(100)).min(3).max(8),
    platformTerms: z.array(z.string().min(2).max(100)).min(1).max(6),
    buyerIntent: z.enum([
        "transactional",
        "gift",
        "replacement",
        "upgrade",
        "discovery",
    ]),
    buyerPersona: z.string().min(10).max(300),
    competitorGap: z.string().min(10).max(300),
    avoidTerms: z.array(z.string().min(1)).min(1).max(5),
});

const ListingScoreSchema = z.object({
    overallScore: z.number().int().min(0).max(100),
    grade: z.enum(["A", "B", "C", "D", "F"]),
    breakdown: z.object({
        seo: z.number().int().min(0).max(100),
        keywords: z.number().int().min(0).max(100),
        conversion: z.number().int().min(0).max(100),
        compliance: z.number().int().min(0).max(100),
    }),
    strengths: z.array(z.string().min(5)).min(1).max(5),
    improvements: z
        .array(
            z.object({
                priority: z.enum(["high", "medium", "low"]),
                field: z.enum([
                    "seoTitle",
                    "bulletPoints",
                    "description",
                    "metaDescription",
                    "tags",
                ]),
                issue: z.string().min(10).max(400),
                suggestion: z.string().min(10).max(400),
            }),
        )
        .min(0)
        .max(6),
    verdict: z.string().min(10).max(300),
});

/* ================================================================== */
/*  Public entry point                                                  */
/* ================================================================== */

export async function runOrchestrator(
    input: GenerationInput,
): Promise<OrchestratorResult> {
    const requestId = randomUUID();
    const log = createRequestLogger(requestId);
    const pipelineStart = Date.now();

    log.info(
        {
            step: "pipeline.start",
            platform: input.platform,
            tone: input.tone,
            promptVersions: {
                keywords: KEYWORD_INTELLIGENCE_PROMPT_VERSION,
                score: LISTING_SCORE_PROMPT_VERSION,
            },
        },
        "Orchestrator pipeline started",
    );

    // ── Step 0: Input validation ─────────────────────────────────────
    const inputCheck = OrchestratorInputSchema.safeParse(input);
    if (!inputCheck.success) {
        const issues = inputCheck.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(" | ");
        log.error(
            { step: "input.validation", issues },
            "Input validation failed",
        );
        return {
            success: false,
            error: issues,
            code: "invalid_input",
            requestId,
        };
    }

    // ── Step 1: Keyword Intelligence (non-fatal) ─────────────────────
    let keywords: KeywordResult | null = null;
    const keywordStart = Date.now();
    try {
        keywords = await callKeywordIntelligence(input, log);
        emitMetric(log, {
            name: "keyword_intelligence.duration",
            value: Date.now() - keywordStart,
            unit: "ms",
            tags: { success: true },
        });
        log.info(
            {
                step: "keyword_intelligence.success",
                primaryKeyword: keywords?.primaryKeyword,
                count: keywords?.secondaryKeywords.length ?? 0,
                durationMs: Date.now() - keywordStart,
            },
            "Keyword intelligence succeeded",
        );
    } catch (err) {
        emitMetric(log, {
            name: "keyword_intelligence.duration",
            value: Date.now() - keywordStart,
            unit: "ms",
            tags: { success: false },
        });
        log.warn(
            { step: "keyword_intelligence.failed", err: toLogError(err) },
            "Keyword intelligence failed — continuing with user-provided keywords",
        );
    }

    // ── Step 2: Enrich input ─────────────────────────────────────────
    const enrichedInput = enrichInput(input, keywords);

    // ── Step 3: Listing Generation (fatal; fallback model on exhaustion) ──
    let listing: ListingOutput;
    let tokensUsed = 0;
    let usedFallback = false;
    const genStart = Date.now();

    try {
        const result = await callListingGeneration(enrichedInput, log, false);
        listing = result.listing;
        tokensUsed = result.tokensUsed;
    } catch (primaryErr) {
        log.warn(
            {
                step: "generation.primary_failed",
                err: toLogError(primaryErr),
                fallbackModel: GENERATION_FALLBACK_MODEL,
            },
            "Primary generation failed — attempting fallback model",
        );
        try {
            const result = await callListingGeneration(
                enrichedInput,
                log,
                true,
            );
            listing = result.listing;
            tokensUsed = result.tokensUsed;
            usedFallback = true;
        } catch (fallbackErr) {
            const message =
                fallbackErr instanceof Error
                    ? fallbackErr.message
                    : "Unknown generation error";
            log.error(
                { step: "generation.fatal", err: toLogError(fallbackErr) },
                "Listing generation failed on both primary and fallback model",
            );
            emitMetric(log, {
                name: "generation.duration",
                value: Date.now() - genStart,
                unit: "ms",
                tags: { success: false },
            });
            return {
                success: false,
                error: message,
                code: "generation_failed",
                requestId,
            };
        }
    }

    emitMetric(log, {
        name: "generation.duration",
        value: Date.now() - genStart,
        unit: "ms",
        tags: { success: true, usedFallback },
    });
    emitMetric(log, {
        name: "generation.tokens",
        value: tokensUsed,
        unit: "tokens",
    });
    log.info(
        {
            step: "generation.success",
            tokensUsed,
            usedFallback,
            durationMs: Date.now() - genStart,
        },
        "Listing generation succeeded",
    );

    // ── Step 4: Listing Score (non-fatal) ────────────────────────────
    let score: ListingScore | null = null;
    const scoreStart = Date.now();
    try {
        score = await callListingScore(enrichedInput, listing, log);
        emitMetric(log, {
            name: "listing_score.duration",
            value: Date.now() - scoreStart,
            unit: "ms",
            tags: { success: true },
        });
        log.info(
            {
                step: "listing_score.success",
                overallScore: score?.overallScore ?? null,
                grade: score?.grade ?? null,
                durationMs: Date.now() - scoreStart,
            },
            "Listing score succeeded",
        );
    } catch (err) {
        emitMetric(log, {
            name: "listing_score.duration",
            value: Date.now() - scoreStart,
            unit: "ms",
            tags: { success: false },
        });
        log.warn(
            { step: "listing_score.failed", err: toLogError(err) },
            "Listing score failed — returning listing without score",
        );
    }

    const pipelineMs = Date.now() - pipelineStart;

    emitMetric(log, {
        name: "pipeline.duration",
        value: pipelineMs,
        unit: "ms",
        tags: {
            success: true,
            hasKeywords: keywords !== null,
            hasScore: score !== null,
            usedFallback,
        },
    });

    log.info(
        {
            step: "pipeline.complete",
            pipelineMs,
            tokensUsed,
            hasKeywords: keywords !== null,
            hasScore: score !== null,
            scoreValue: score?.overallScore ?? null,
            usedFallback,
        },
        "Orchestrator pipeline complete",
    );

    return {
        success: true,
        listing,
        score,
        keywords,
        tokensUsed,
        pipelineMs,
        requestId,
        usedFallback,
    };
}

/* ================================================================== */
/*  Step 1 — Keyword Intelligence                                       */
/* ================================================================== */

async function callKeywordIntelligence(
    input: GenerationInput,
    log: RequestLogger,
): Promise<KeywordResult | null> {
    const stepLog = log.child({ step: "keyword_intelligence" });
    const userPrompt = buildKeywordIntelligencePrompt({
        productName: input.productName,
        productCategory: input.productCategory,
        platform: input.platform,
        description: input.description,
        features: input.features,
        existingKeywords: [
            ...(input.primaryKeyword ? [input.primaryKeyword] : []),
            ...(input.keywords ?? []),
        ],
    });

    const raw = await callWithRetry<string>(
        stepLog,
        "keyword_intelligence",
        async (model) => {
            const completion = await openai.chat.completions.create({
                model,
                max_tokens: KEYWORD_CONFIG.max_tokens,
                temperature: KEYWORD_CONFIG.temperature,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: KEYWORD_INTELLIGENCE_SYSTEM_PROMPT,
                    },
                    { role: "user", content: userPrompt },
                ],
            });
            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error("Empty response from OpenAI");
            return content;
        },
        [KEYWORD_CONFIG.model],
    );

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        stepLog.warn(
            { raw: raw.slice(0, 200) },
            "Malformed JSON in keyword response",
        );
        return null;
    }

    const validated = KeywordResultSchema.safeParse(parsed);
    if (!validated.success) {
        stepLog.warn(
            {
                issues: validated.error.errors
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(" | "),
            },
            "Schema validation failed for keyword response",
        );
        return null;
    }

    return validated.data;
}

/* ================================================================== */
/*  Step 2 — Input Enrichment                                          */
/* ================================================================== */

function enrichInput(
    input: GenerationInput,
    keywords: KeywordResult | null,
): GenerationInput {
    if (!keywords) return input;

    const enriched = { ...input };

    // Primary keyword: fill gap only — never overwrite seller's choice
    if (!enriched.primaryKeyword?.trim()) {
        enriched.primaryKeyword = keywords.primaryKeyword;
    }

    // Merge, deduplicate, cap at 15 to keep prompt clean
    const discovered = [
        ...keywords.secondaryKeywords,
        ...keywords.platformTerms,
    ];
    const existing = enriched.keywords ?? [];
    enriched.keywords = deduplicateKeywords([...existing, ...discovered]).slice(
        0,
        15,
    );

    return enriched;
}

/* ================================================================== */
/*  Step 3 — Listing Generation                                        */
/* ================================================================== */

async function callListingGeneration(
    input: GenerationInput,
    log: RequestLogger,
    useFallback: boolean,
): Promise<{ listing: ListingOutput; tokensUsed: number }> {
    const model = useFallback
        ? GENERATION_FALLBACK_MODEL
        : GENERATION_CONFIG.model;
    const stepLog = log.child({ step: "generation", model });

    const { systemPrompt, userPrompt } = buildPrompt(input);

    // ── KEY FIX ──────────────────────────────────────────────────────
    // callWithRetry<T> is generic. We return { content, tokensUsed }
    // directly from the fn — no JSON wrapping/unwrapping needed.
    // The test mocks return completion.choices[0].message.content as the
    // listing JSON string, which we pass straight to parseGenerationResponse.
    // ─────────────────────────────────────────────────────────────────
    const { content, tokensUsed } = await callWithRetry<{
        content: string;
        tokensUsed: number;
    }>(
        stepLog,
        "generation",
        async (m) => {
            const completion = await openai.chat.completions.create({
                model: m,
                max_tokens: GENERATION_CONFIG.max_tokens,
                temperature: GENERATION_CONFIG.temperature,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            });
            const c = completion.choices[0]?.message?.content;
            if (!c)
                throw new Error(
                    "OpenAI returned an empty response. Please try again.",
                );
            return {
                content: c,
                tokensUsed: completion.usage?.total_tokens ?? 0,
            };
        },
        [model],
    );

    const parsed = parseGenerationResponse(content);
    if (!parsed.success) {
        stepLog.error(
            { error: parsed.error, raw: content.slice(0, 300) },
            "Listing parse failed",
        );
        throw new Error(
            "The AI didn't generate a complete listing. Please try again.",
        );
    }

    return { listing: parsed.data, tokensUsed };
}

/* ================================================================== */
/*  Step 4 — Listing Score                                             */
/* ================================================================== */

async function callListingScore(
    input: GenerationInput,
    listing: ListingOutput,
    log: RequestLogger,
): Promise<ListingScore | null> {
    const stepLog = log.child({ step: "listing_score" });
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

    const raw = await callWithRetry<string>(
        stepLog,
        "listing_score",
        async (model) => {
            const completion = await openai.chat.completions.create({
                model,
                max_tokens: SCORE_CONFIG.max_tokens,
                temperature: SCORE_CONFIG.temperature,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: LISTING_SCORE_SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
            });
            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error("Empty response from OpenAI");
            return content;
        },
        [SCORE_CONFIG.model],
    );

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        stepLog.warn(
            { raw: raw.slice(0, 200) },
            "Malformed JSON in score response",
        );
        return null;
    }

    const validated = ListingScoreSchema.safeParse(parsed);
    if (!validated.success) {
        stepLog.warn(
            {
                issues: validated.error.errors
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(" | "),
            },
            "Schema validation failed for score response",
        );
        return null;
    }

    return validated.data;
}

/* ================================================================== */
/*  Retry helper                                                        */
/* ================================================================== */

async function callWithRetry<T>(
    log: RequestLogger,
    label: string,
    fn: (model: string) => Promise<T>,
    models: [string, ...string[]],
): Promise<T> {
    const model = models[0];
    let lastError: unknown;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
        try {
            return await fn(model);
        } catch (err) {
            lastError = err;

            const { status, code } = extractErrorInfo(err);
            const isTransient =
                status !== undefined && RETRY_CONFIG.transientCodes.has(status);

            log.warn(
                {
                    label,
                    attempt,
                    maxAttempts: RETRY_CONFIG.maxAttempts,
                    status,
                    code,
                    isTransient,
                },
                `[${label}] Attempt ${attempt}/${RETRY_CONFIG.maxAttempts} failed`,
            );

            // Non-transient (401, 400, context_length, unknown) — fail immediately
            if (!isTransient) {
                log.error(
                    { label, status, code, err: toLogError(err) },
                    `[${label}] Non-transient error — aborting retry`,
                );
                throw err;
            }

            if (attempt === RETRY_CONFIG.maxAttempts) {
                log.error(
                    {
                        label,
                        attempts: RETRY_CONFIG.maxAttempts,
                        err: toLogError(err),
                    },
                    `[${label}] All retries exhausted`,
                );
                throw err;
            }

            const delayMs = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1);
            log.info(
                { label, delayMs, nextAttempt: attempt + 1 },
                `[${label}] Retrying in ${delayMs}ms`,
            );
            await sleep(delayMs);
        }
    }

    throw lastError;
}

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */

function deduplicateKeywords(keywords: string[]): string[] {
    const seen = new Set<string>();
    return keywords.filter((kw) => {
        const normalized = kw.toLowerCase().trim();
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
    });
}

function extractErrorInfo(err: unknown): { status?: number; code?: string } {
    if (!err || typeof err !== "object") return {};
    const e = err as Record<string, unknown>;
    const apiError = e.error as Record<string, unknown> | undefined;
    return {
        status: (e.status ?? apiError?.status) as number | undefined,
        code: (apiError?.code ?? e.code) as string | undefined,
    };
}

function toLogError(err: unknown): Record<string, unknown> {
    if (err instanceof Error) return { message: err.message, name: err.name };
    if (typeof err === "object" && err !== null)
        return err as Record<string, unknown>;
    return { message: String(err) };
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
