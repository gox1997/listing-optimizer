// lib/ai/response-parser.ts

import { z } from "zod";
import type { ListingOutput, ListingScore } from "@/types";

// ── Listing output schema ────────────────────────────────────────────

const ListingOutputSchema = z.object({
    seoTitle: z
        .string()
        .min(10, "SEO title is too short")
        .max(500, "SEO title is too long"),

    bulletPoints: z
        .array(z.string().min(15, "Bullet point is too short"))
        .length(5, "Must have exactly 5 bullet points")
        .transform(
            (arr): [string, string, string, string, string] =>
                arr as [string, string, string, string, string],
        ),

    description: z
        .string()
        .min(80, "Description is too short")
        .max(5000, "Description is too long"),

    metaDescription: z
        .string()
        .min(30, "Meta description is too short")
        .max(200, "Meta description is too long"),

    tags: z
        .array(z.string().min(1))
        .min(5, "Need at least 5 tags")
        .max(25, "Too many tags"),
});

// ── Listing score schema ─────────────────────────────────────────────

const ListingScoreSchema = z.object({
    overallScore: z.number().int().min(0).max(100),
    grade: z.enum(["A", "B", "C", "D", "F"]),
    breakdown: z.object({
        seo: z.number().int().min(0).max(100),
        keywords: z.number().int().min(0).max(100),
        conversion: z.number().int().min(0).max(100),
        compliance: z.number().int().min(0).max(100),
    }),
    strengths: z.array(z.string()).length(3),
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
                issue: z.string().min(10),
                suggestion: z.string().min(10),
            }),
        )
        .min(1)
        .max(4),
    verdict: z.string().min(10),
});

// ── Result types ─────────────────────────────────────────────────────

export type ParseSuccess = { success: true; data: ListingOutput };
export type ParseFailure = {
    success: false;
    error: string;
    rawResponse?: string;
};
export type ParseResult = ParseSuccess | ParseFailure;

export type ScoreParseSuccess = { success: true; data: ListingScore };
export type ScoreParseFailure = { success: false; error: string };
export type ScoreParseResult = ScoreParseSuccess | ScoreParseFailure;

// ── parseGenerationResponse ──────────────────────────────────────────

export function parseGenerationResponse(rawResponse: string): ParseResult {
    let cleaned: string;
    try {
        cleaned = cleanAIResponse(rawResponse);
    } catch {
        return {
            success: false,
            error: "AI response did not contain valid JSON. Please regenerate.",
            rawResponse: rawResponse.slice(0, 500),
        };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        return {
            success: false,
            error: "AI returned malformed JSON. Please regenerate.",
            rawResponse: cleaned.slice(0, 500),
        };
    }

    const validated = ListingOutputSchema.safeParse(parsed);

    if (!validated.success) {
        const first = validated.error.errors[0];
        const fieldPath = first.path.join(".");
        return {
            success: false,
            error: `AI output validation failed (${fieldPath}: ${first.message}). Please regenerate.`,
        };
    }

    return { success: true, data: postProcess(validated.data) };
}

// ── parseListingScore ────────────────────────────────────────────────

export function parseListingScore(rawResponse: string): ScoreParseResult {
    let cleaned: string;
    try {
        cleaned = cleanAIResponse(rawResponse);
    } catch {
        return {
            success: false,
            error: "Score response contained no valid JSON.",
        };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        return { success: false, error: "Score response was malformed JSON." };
    }

    const validated = ListingScoreSchema.safeParse(parsed);

    if (!validated.success) {
        const first = validated.error.errors[0];
        return {
            success: false,
            error: `Score validation failed: ${first.path.join(".")}: ${first.message}`,
        };
    }

    const d = validated.data;
    return {
        success: true,
        data: {
            overall: d.overallScore,
            grade: d.grade,
            breakdown: d.breakdown,
            strengths: d.strengths,
            improvements: d.improvements,
            verdict: d.verdict,
        },
    };
}

// ── cleanAIResponse ──────────────────────────────────────────────────

export function cleanAIResponse(raw: string): string {
    const trimmed = raw.trim();

    const jsonFence = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonFence?.[1]) {
        const candidate = jsonFence[1].trim();
        if (candidate.startsWith("{")) return candidate;
    }

    const plainFence = trimmed.match(/```\s*([\s\S]*?)\s*```/);
    if (plainFence?.[1]) {
        const candidate = plainFence[1].trim();
        if (candidate.startsWith("{")) return candidate;
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
        return trimmed.slice(start, end + 1);
    }

    throw new Error("No JSON object found in AI response");
}

// ── postProcess ──────────────────────────────────────────────────────

export function postProcess(
    data: z.infer<typeof ListingOutputSchema>,
): ListingOutput {
    return {
        seoTitle: data.seoTitle.trim(),
        bulletPoints: data.bulletPoints.map((b) =>
            b.trim().replace(/\.\s*$/, ""),
        ) as [string, string, string, string, string],
        description: data.description.trim(),
        metaDescription: enforceMetaLength(data.metaDescription.trim()),
        tags: [
            ...new Set(
                data.tags
                    .map((t) => t.toLowerCase().trim())
                    .filter((t) => t.length > 0),
            ),
        ].slice(0, 15),
    };
}

// ── enforceMetaLength ────────────────────────────────────────────────

export function enforceMetaLength(meta: string): string {
    if (meta.length <= 160) return meta;
    const words = meta.split(" ");
    const budget = 157;
    let result = "";

    for (const word of words) {
        const candidate = result ? `${result} ${word}` : word;
        if (candidate.length > budget) break;
        result = candidate;
    }

    if (!result) return meta.slice(0, budget) + "...";
    return result + "...";
}
