// lib/ai/prompt-builder.ts

import { SYSTEM_PROMPT } from "./prompts/system-prompt";
import { AMAZON_PROMPT } from "./prompts/amazon";
import { SHOPIFY_PROMPT } from "./prompts/shopify";
import { ETSY_PROMPT } from "./prompts/etsy";
import { GENERAL_PROMPT } from "./prompts/general";
import { TONE_PROMPTS, TONE_GLOBAL_RULES } from "./prompts/tones";
import type { GenerationInput } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

/** Valid platform keys — prevents silent fallback from typos */
type PlatformKey = "amazon" | "shopify" | "etsy" | "general";

/** Valid tone keys — prevents silent fallback from typos */
type ToneKey = "professional" | "casual" | "luxury" | "playful" | "technical";

export type BuiltPrompt = {
    systemPrompt: string;
    userPrompt: string;
};

/* ------------------------------------------------------------------ */
/*  Platform map — typed Record prevents silent misses                 */
/* ------------------------------------------------------------------ */

const PLATFORM_PROMPTS: Record<PlatformKey, string> = {
    amazon: AMAZON_PROMPT,
    shopify: SHOPIFY_PROMPT,
    etsy: ETSY_PROMPT,
    general: GENERAL_PROMPT,
};

/* ------------------------------------------------------------------ */
/*  Public builder                                                      */
/* ------------------------------------------------------------------ */

export function buildPrompt(input: GenerationInput): BuiltPrompt {
    // Normalize to lowercase before lookup — prevents "Amazon" mismatch
    const platformKey = sanitize(input.platform).toLowerCase() as PlatformKey;
    const toneKey = sanitize(input.tone).toLowerCase() as ToneKey;

    const platformPrompt = PLATFORM_PROMPTS[platformKey] ?? GENERAL_PROMPT;

    const tonePrompt = TONE_PROMPTS[toneKey] ?? TONE_PROMPTS.professional;

    // Prompt layer priority order (top = highest authority):
    // 1. SYSTEM_PROMPT     — universal rules, JSON schema contract
    // 2. platformPrompt    — platform-specific rules (override universal)
    // 3. TONE_GLOBAL_RULES — tone application rules (never override structure)
    // 4. tonePrompt        — stylistic shaping only (lowest priority)
    const systemPrompt = [
        SYSTEM_PROMPT,
        platformPrompt,
        TONE_GLOBAL_RULES,
        tonePrompt,
    ]
        .filter(Boolean) // defensive guard: never let an empty layer slip through
        .join("\n\n");

    return {
        systemPrompt,
        userPrompt: buildUserPrompt(input),
    };
}

/* ------------------------------------------------------------------ */
/*  User prompt construction                                            */
/* ------------------------------------------------------------------ */

function buildUserPrompt(input: GenerationInput): string {
    const lines: string[] = [
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "PRODUCT INFORMATION",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        `Product Name: ${sanitize(input.productName)}`,
        `Category:     ${sanitize(input.productCategory)}`,
        `Platform:     ${sanitize(input.platform)}`,
        `Tone:         ${sanitize(input.tone)}`,
    ];

    // Optional — seller's own description
    if (input.description?.trim()) {
        lines.push("");
        lines.push("Seller Description:");
        lines.push(sanitize(input.description));
    }

    // Optional — individual features, one per bullet
    if (input.features?.length) {
        lines.push("");
        lines.push("Key Features:");
        for (const f of input.features) {
            if (f?.trim()) lines.push(`• ${sanitize(f)}`);
        }
    }

    // Optional — primary keyword with explicit placement instruction
    if (input.primaryKeyword?.trim()) {
        lines.push("");
        lines.push(`Primary Keyword: ${sanitize(input.primaryKeyword)}`);
        lines.push(
            "PLACEMENT RULE: This keyword MUST appear in the seoTitle " +
                "AND in the first sentence of the description. No exceptions.",
        );
    }

    // Optional — secondary keywords with natural placement guidance
    if (input.keywords?.length) {
        lines.push("");
        lines.push("Secondary Keywords — weave in naturally, never force:");
        lines.push(input.keywords.map(sanitize).join(", "));
    }

    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("TASK");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push(
        "Generate a complete, optimized ecommerce product listing " +
            "using the product information above.",
    );
    lines.push("");
    lines.push(`Platform: ${sanitize(input.platform).toUpperCase()}`);
    lines.push(`Tone:     ${sanitize(input.tone).toUpperCase()}`);
    lines.push("");
    lines.push("Follow ALL rules from the system prompt.");
    lines.push("Return ONLY the JSON object defined in the schema.");
    lines.push("Do not include explanations, markdown, or extra text.");

    return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Sanitizes a string input before it touches the prompt.
 * - Trims whitespace
 * - Returns empty string for null/undefined (never crashes)
 * - Named `sanitize` not `safe` — intent is clear at call sites
 */
function sanitize(value?: string): string {
    return value?.trim() ?? "";
}
