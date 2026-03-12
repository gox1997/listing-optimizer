// lib/ai/response-parser.ts
// Parses the raw AI response string into a validated, typed ListingOutput.
// Handles common AI response quirks:
//   - Markdown code fences (```json ... ```)
//   - Leading/trailing text before/after the JSON object
//   - Minor schema mismatches (wrong bullet count, overly long meta)

import { z } from "zod";
import type { ListingOutput } from "@/types";

// ─────────────────────────────────────────────
// ZOD SCHEMA — validates AI output structure
// ─────────────────────────────────────────────

const ListingOutputSchema = z.object({
    seoTitle: z
        .string()
        .min(10, "SEO title is too short (minimum 10 characters)")
        .max(500, "SEO title is too long (maximum 500 characters)"),

    bulletPoints: z
        .array(z.string().min(15, "Bullet point is too short"))
        .length(5, "Must have exactly 5 bullet points"),

    description: z
        .string()
        .min(80, "Description is too short (minimum 80 characters)")
        .max(5000, "Description is too long"),

    metaDescription: z
        .string()
        .min(30, "Meta description is too short")
        .max(200, "Meta description is too long"), // We post-process to enforce 160

    tags: z
        .array(z.string().min(1))
        .min(5, "Need at least 5 tags")
        .max(25, "Too many tags (maximum 25)"),
});

// ─────────────────────────────────────────────
// RESULT TYPE
// ─────────────────────────────────────────────

export type ParseResult =
    | { success: true; data: ListingOutput }
    | { success: false; error: string; rawResponse?: string };

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

/**
 * Parses and validates the raw string response from OpenAI.
 *
 * Handles:
 *   1. Cleaning markdown fences and leading text
 *   2. JSON.parse
 *   3. Zod schema validation
 *   4. Post-processing (normalize, trim, enforce limits)
 *
 * @param rawResponse - The complete string from OpenAI completion
 * @returns ParseResult — success with typed data, or failure with error message
 */
export function parseGenerationResponse(rawResponse: string): ParseResult {
    // Step 1: Clean the response
    let cleaned: string;
    try {
        cleaned = cleanAIResponse(rawResponse);
    } catch (cleanError) {
        return {
            success: false,
            error: "AI response did not contain valid JSON. Please regenerate.",
            rawResponse: rawResponse.slice(0, 500), // Truncate for logging
        };
    }

    // Step 2: Parse JSON
    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch (parseError) {
        return {
            success: false,
            error: "AI returned malformed JSON. Please regenerate.",
            rawResponse: cleaned.slice(0, 500),
        };
    }

    // Step 3: Validate against schema
    const validated = ListingOutputSchema.safeParse(parsed);

    if (!validated.success) {
        const errors = validated.error.errors;
        const firstError = errors[0];
        const fieldPath = firstError.path.join(".");
        return {
            success: false,
            error: `AI output validation failed (${fieldPath}: ${firstError.message}). Please regenerate.`,
        };
    }

    // Step 4: Post-process for consistency
    const processed = postProcess(validated.data);

    return { success: true, data: processed };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Strips markdown fences and extracts just the JSON object.
 * Handles these common AI response patterns:
 *   - Pure JSON (ideal): { ... }
 *   - With fences: ```json\n{ ... }\n```
 *   - With preamble: "Here is the listing:\n{ ... }"
 *
 * @throws Error if no JSON object is found
 */
function cleanAIResponse(raw: string): string {
    let cleaned = raw.trim();

    // Remove markdown code fences if present
    if (cleaned.startsWith("```")) {
        cleaned = cleaned
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/, "")
            .trim();
    }

    // Find the outermost JSON object boundaries
    const startIndex = cleaned.indexOf("{");
    const endIndex = cleaned.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
        throw new Error("No JSON object found in AI response");
    }

    return cleaned.slice(startIndex, endIndex + 1);
}

/**
 * Post-processes the validated output for consistency and edge cases.
 * This is the final cleanup before data is saved to the database.
 */
function postProcess(data: z.infer<typeof ListingOutputSchema>): ListingOutput {
    return {
        // Trim whitespace
        seoTitle: data.seoTitle.trim(),

        // Ensure bullets don't have trailing periods (Amazon guideline)
        // Also trim each bullet
        bulletPoints: data.bulletPoints.map((bullet) =>
            bullet.trim().replace(/\.\s*$/, ""),
        ),

        description: data.description.trim(),

        // Hard-enforce 160 character limit on meta description
        // Truncate at word boundary and add ellipsis if needed
        metaDescription: enforceMetaLength(data.metaDescription.trim()),

        // Normalize tags: lowercase, trim, deduplicate
        tags: [
            ...new Set(data.tags.map((tag) => tag.toLowerCase().trim())),
        ].filter((tag) => tag.length > 0),
    };
}

/**
 * Enforces 160 character limit on meta description.
 * Truncates at the nearest word boundary to avoid cutting mid-word.
 */
function enforceMetaLength(meta: string): string {
    if (meta.length <= 160) return meta;

    // Truncate to 157 chars to leave room for "..."
    const truncated = meta.slice(0, 157);

    // Find the last space to avoid cutting mid-word
    const lastSpace = truncated.lastIndexOf(" ");
    const cleanTruncated =
        lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated;

    return cleanTruncated + "...";
}
