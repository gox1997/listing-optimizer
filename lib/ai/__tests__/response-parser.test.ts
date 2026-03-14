// lib/ai/__tests__/response-parser.test.ts
/* eslint-env jest */

import {
    parseGenerationResponse,
    cleanAIResponse,
    enforceMetaLength,
    // postProcess removed because it was unused
} from "../response-parser";

/* ------------------------------------------------------------------ */
/*  cleanAIResponse                                                     */
/* ------------------------------------------------------------------ */

describe("cleanAIResponse", () => {
    it("extracts JSON from ```json fence", () => {
        const raw = '```json\n{"key": "value"}\n```';
        expect(cleanAIResponse(raw)).toBe('{"key": "value"}');
    });

    it("extracts JSON from plain ``` fence", () => {
        const raw = '```\n{"key": "value"}\n```';
        expect(cleanAIResponse(raw)).toBe('{"key": "value"}');
    });

    it("returns clean JSON as-is", () => {
        const raw = '{"key": "value"}';
        expect(cleanAIResponse(raw)).toBe('{"key": "value"}');
    });

    it("finds outermost braces when surrounded by prose", () => {
        const raw = 'Here is the result: {"key": "value"} — done.';
        expect(cleanAIResponse(raw)).toBe('{"key": "value"}');
    });

    it("throws when no JSON object is found", () => {
        expect(() => cleanAIResponse("no json here")).toThrow(
            "No JSON object found",
        );
    });
});

/* ------------------------------------------------------------------ */
/*  enforceMetaLength                                                   */
/* ------------------------------------------------------------------ */

describe("enforceMetaLength", () => {
    it("returns string unchanged when ≤ 160 chars", () => {
        const short = "A short meta description.";
        expect(enforceMetaLength(short)).toBe(short);
    });

    it("truncates at word boundary and appends ellipsis", () => {
        const long =
            "This is a very long meta description that goes well over one hundred " +
            "and sixty characters and should be truncated at a word boundary so " +
            "that no words are cut in half during the truncation process.";
        const result = enforceMetaLength(long);
        expect(result.length).toBeLessThanOrEqual(160);
        expect(result.endsWith("...")).toBe(true);
        expect(result.slice(-4, -3)).not.toBe(" ");
    });

    it("handles string where first word exceeds 157 chars", () => {
        const oneGiantWord = "a".repeat(200);
        const result = enforceMetaLength(oneGiantWord);
        expect(result.length).toBeLessThanOrEqual(160);
        expect(result.endsWith("...")).toBe(true);
    });

    it("exactly 160 chars returns unchanged", () => {
        const exactly160 = "a".repeat(160);
        expect(enforceMetaLength(exactly160)).toBe(exactly160);
    });
});

/* ------------------------------------------------------------------ */
/*  parseGenerationResponse — success path                             */
/* ------------------------------------------------------------------ */

const VALID_LISTING = {
    seoTitle: "Premium Slim RFID Wallet for Men — Genuine Leather Front Pocket",
    bulletPoints: [
        "RFID BLOCKING PROTECTION: Advanced shielding prevents contactless card skimming",
        "ULTRA SLIM DESIGN: Fits in front pocket comfortably with up to 6 cards",
        "GENUINE LEATHER: Full-grain cowhide leather ages beautifully over time",
        "QUICK ACCESS SLOTS: Three card slots plus a bill compartment for fast retrieval",
        "IDEAL GIFT: Ships in premium gift box — perfect for birthdays and anniversaries",
    ],
    description: "A".repeat(100),
    metaDescription:
        "Slim RFID wallet crafted from genuine leather. Fits 6 cards in your front pocket.",
    tags: [
        "slim wallet",
        "rfid wallet",
        "leather wallet",
        "mens wallet",
        "front pocket wallet",
    ],
};

describe("parseGenerationResponse — success", () => {
    it("returns success for a valid listing JSON string", () => {
        const raw = JSON.stringify(VALID_LISTING);
        const result = parseGenerationResponse(raw);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.seoTitle).toBe(VALID_LISTING.seoTitle);
            expect(result.data.bulletPoints).toHaveLength(5);
        }
    });

    it("strips trailing periods from bullet points", () => {
        const withPeriods = {
            ...VALID_LISTING,
            bulletPoints: VALID_LISTING.bulletPoints.map((b) => b + "."),
        };
        const result = parseGenerationResponse(JSON.stringify(withPeriods));
        expect(result.success).toBe(true);
        if (result.success) {
            result.data.bulletPoints.forEach((b) => {
                expect(b.endsWith(".")).toBe(false);
            });
        }
    });

    it("lowercases and deduplicates tags", () => {
        const withDupes = {
            ...VALID_LISTING,
            tags: [
                "Slim Wallet",
                "slim wallet",
                "RFID",
                "rfid",
                "leather wallet",
            ],
        };
        const result = parseGenerationResponse(JSON.stringify(withDupes));
        expect(result.success).toBe(true);
        if (result.success) {
            expect(
                result.data.tags.filter((t) => t === "slim wallet"),
            ).toHaveLength(1);
            expect(result.data.tags.filter((t) => t === "rfid")).toHaveLength(
                1,
            );
        }
    });
});

/* ------------------------------------------------------------------ */
/*  parseGenerationResponse — failure paths                            */
/* ------------------------------------------------------------------ */

describe("parseGenerationResponse — failures", () => {
    it("returns failure for a plain string with no JSON", () => {
        const result = parseGenerationResponse(
            "Sorry, I cannot help with that.",
        );
        expect(result.success).toBe(false);
    });

    it("returns failure for malformed JSON", () => {
        const result = parseGenerationResponse("{not: valid json}");
        expect(result.success).toBe(false);
    });

    it("returns failure when bulletPoints has wrong length", () => {
        const bad = { ...VALID_LISTING, bulletPoints: ["only one bullet"] };
        const result = parseGenerationResponse(JSON.stringify(bad));
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toMatch(/bullet/i);
        }
    });

    it("returns failure when seoTitle is too short", () => {
        const bad = { ...VALID_LISTING, seoTitle: "short" };
        const result = parseGenerationResponse(JSON.stringify(bad));
        expect(result.success).toBe(false);
    });

    it("returns failure when description is missing", () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { description: _, ...bad } = VALID_LISTING;
        const result = parseGenerationResponse(JSON.stringify(bad));
        expect(result.success).toBe(false);
    });
});
