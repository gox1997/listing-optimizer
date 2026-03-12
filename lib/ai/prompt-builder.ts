// lib/ai/prompt-builder.ts

import { SYSTEM_PROMPT } from "./prompts/system-prompt";
import { AMAZON_PROMPT } from "./prompts/amazon";
import { SHOPIFY_PROMPT } from "./prompts/shopify";
import { ETSY_PROMPT } from "./prompts/etsy";
import { GENERAL_PROMPT } from "./prompts/general";
import { TONE_PROMPTS, TONE_GLOBAL_RULES } from "./prompts/tones";
import type { GenerationInput } from "@/types";

/* ------------------------------------------------------------------ */
/*  Platform map                                                        */
/* ------------------------------------------------------------------ */

const PLATFORM_PROMPTS: Record<string, string> = {
    amazon: AMAZON_PROMPT,
    shopify: SHOPIFY_PROMPT,
    etsy: ETSY_PROMPT,
    general: GENERAL_PROMPT,
};

/* ------------------------------------------------------------------ */
/*  Return type                                                         */
/* ------------------------------------------------------------------ */

export type BuiltPrompt = {
    systemPrompt: string;
    userPrompt: string;
};

/* ------------------------------------------------------------------ */
/*  Public builder                                                      */
/* ------------------------------------------------------------------ */

export function buildPrompt(input: GenerationInput): BuiltPrompt {
    const platformPrompt =
        PLATFORM_PROMPTS[input.platform?.toLowerCase()] ?? GENERAL_PROMPT;

    const tonePrompt =
        TONE_PROMPTS[input.tone?.toLowerCase()] ?? TONE_PROMPTS.professional;

    // Layers applied in priority order:
    // 1. Universal rules
    // 2. Platform rules (overrides universal where stated)
    // 3. Tone global rules
    // 4. Tone-specific rules (lowest priority — stylistic only)
    const systemPrompt = [
        SYSTEM_PROMPT,
        platformPrompt,
        TONE_GLOBAL_RULES,
        tonePrompt,
    ]
        .filter(Boolean)
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
        `Product Name: ${safe(input.productName)}`,
        `Category:     ${safe(input.productCategory)}`,
        `Platform:     ${safe(input.platform)}`,
        `Tone:         ${safe(input.tone)}`,
    ];

    if (input.description?.trim()) {
        lines.push("");
        lines.push("Seller Description:");
        lines.push(safe(input.description));
    }

    if (input.features?.length) {
        lines.push("");
        lines.push("Key Features:");
        input.features.forEach((f) => {
            if (f?.trim()) lines.push(`• ${safe(f)}`);
        });
    }

    if (input.primaryKeyword?.trim()) {
        lines.push("");
        lines.push(`Primary Keyword: ${safe(input.primaryKeyword)}`);
        lines.push(
            "This keyword MUST appear in the seoTitle and in the" +
                " first sentence of the description.",
        );
    }

    if (input.keywords?.length) {
        lines.push("");
        lines.push("Secondary Keywords (weave in naturally, never force):");
        lines.push(input.keywords.map(safe).join(", "));
    }

    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("TASK");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push(
        "Generate a complete optimized ecommerce product listing" +
            " using the product information above.",
    );
    lines.push("");
    lines.push(`Platform: ${safe(input.platform).toUpperCase()}`);
    lines.push(`Tone:     ${safe(input.tone).toUpperCase()}`);
    lines.push("");
    lines.push("Follow ALL rules from the system prompt.");
    lines.push("Return ONLY the JSON object defined in the schema.");
    lines.push("Do not include explanations, markdown, or extra text.");

    return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function safe(value?: string): string {
    return value?.trim() ?? "";
}
