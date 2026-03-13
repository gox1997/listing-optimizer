// lib/ai/response-parser.ts

import { z } from "zod";
import type { ListingOutput } from "@/types";

/* ------------------------------------------------------------------ */
/*  Zod schema — with .transform() for typed tuple (no `as` cast)     */
/* ------------------------------------------------------------------ */

const ListingOutputSchema = z.object({
    seoTitle: z
        .string()
        .min(10, "SEO title is too short (minimum 10 characters)")
        .max(500, "SEO title is too long (maximum 500 characters)"),

    bulletPoints: z
        .array(z.string().min(15, "Bullet point is too short"))
        .length(5, "Must have exactly 5 bullet points")
        // .transform() eliminates the need for `as [string,string,string,string,string]`
        // Zod has already validated length === 5 before this runs — safe to assert
        .transform(
            (arr): [string, string, string, string, string] =>
                arr as [string, string, string, string, string],
        ),

    description: z
        .string()
        .min(80, "Description is too short (minimum 80 characters)")
        .max(5000, "Description is too long"),

    metaDescription: z
        .string()
        .min(30, "Meta description is too short")
        .max(200, "Meta description is too long"),

    tags: z
        .array(z.string().min(1))
        .min(5, "Need at least 5 tags")
        .max(25, "Too many tags (maximum 25)"),
});

/* ------------------------------------------------------------------ */
/*  Result types                                                        */
/* ------------------------------------------------------------------ */

export type ParseSuccess = {
    success: true;
    data: ListingOutput;
};

export type ParseFailure = {
    success: false;
    error: string;
    rawResponse?: string;
};

export type ParseResult = ParseSuccess | ParseFailure;

/* ------------------------------------------------------------------ */
/*  Main export                                                         */
/* ------------------------------------------------------------------ */

export function parseGenerationResponse(rawResponse: string): ParseResult {
    // Step 1: clean the response
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

    // Step 2: parse JSON
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

    // Step 3: validate schema + transform
    const validated = ListingOutputSchema.safeParse(parsed);

    if (!validated.success) {
        const first = validated.error.errors[0];
        const fieldPath = first.path.join(".");
        return {
            success: false,
            error: `AI output validation failed (${fieldPath}: ${first.message}). Please regenerate.`,
        };
    }

    // Step 4: post-process (validated.data already has transformed bulletPoints tuple)
    return { success: true, data: postProcess(validated.data) };
}

/* ------------------------------------------------------------------ */
/*  cleanAIResponse                                                     */
/* ------------------------------------------------------------------ */

export function cleanAIResponse(raw: string): string {
    const trimmed = raw.trim();

    // Strategy 1: ```json ... ```
    const jsonFence = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonFence?.[1]) {
        const candidate = jsonFence[1].trim();
        if (candidate.startsWith("{")) return candidate;
    }

    // Strategy 2: ``` ... ```
    const plainFence = trimmed.match(/```\s*([\s\S]*?)\s*```/);
    if (plainFence?.[1]) {
        const candidate = plainFence[1].trim();
        if (candidate.startsWith("{")) return candidate;
    }

    // Strategy 3: already clean JSON
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed;
    }

    // Strategy 4: find outermost { }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
        return trimmed.slice(start, end + 1);
    }

    throw new Error("No JSON object found in AI response");
}

/* ------------------------------------------------------------------ */
/*  postProcess                                                         */
/* ------------------------------------------------------------------ */

export function postProcess(
    data: z.infer<typeof ListingOutputSchema>,
): ListingOutput {
    return {
        seoTitle: data.seoTitle.trim(),

        // bulletPoints is already a [string,string,string,string,string] tuple
        // from the Zod .transform() above — trim and strip trailing periods
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

/* ------------------------------------------------------------------ */
/*  enforceMetaLength — improved word-boundary truncation              */
/* ------------------------------------------------------------------ */

export function enforceMetaLength(meta: string): string {
    if (meta.length <= 160) return meta;

    // Split on words and rebuild until we fit, then add ellipsis
    // This is safer than slicing at an arbitrary character index because:
    // - It never cuts in the middle of a word
    // - The ellipsis budget (3 chars) is always accounted for up front
    const words = meta.split(" ");
    const budget = 160 - 3; // reserve 3 chars for "..."
    let result = "";

    for (const word of words) {
        const candidate = result ? `${result} ${word}` : word;
        if (candidate.length > budget) break;
        result = candidate;
    }

    // Fallback: if even the first word exceeds budget, hard-slice
    if (!result) return meta.slice(0, budget) + "...";

    return result + "...";
}
