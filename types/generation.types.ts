export type Platform = "amazon" | "shopify" | "etsy" | "general";

export type Tone =
    | "professional"
    | "casual"
    | "luxury"
    | "playful"
    | "technical";

export type GenerationStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed";

export type GenerationInput = {
    productName: string;
    productCategory: string;
    description?: string;
    features?: string[];
    platform: Platform;
    tone: Tone;
    keywords?: string[];
    primaryKeyword?: string;
};

// ── Keyword Intelligence ─────────────────────────────────────────────
// Mirrors KeywordResult in lib/ai/orchestrator.ts.
// Single source of truth lives here — orchestrator imports from @/types.

export type KeywordBuyerIntent =
    | "transactional"
    | "gift"
    | "replacement"
    | "upgrade"
    | "discovery";

export type KeywordResult = {
    /** The single highest-value keyword for this product + platform */
    primaryKeyword: string;
    /** 5 secondary keywords with distinct buyer intent angles */
    secondaryKeywords: string[];
    /** 3 platform-specific terms (backend terms, LSI keywords, Etsy tags) */
    platformTerms: string[];
    /** The primary search motivation for this product */
    buyerIntent: KeywordBuyerIntent;
    /** One sentence: who is searching and why */
    buyerPersona: string;
    /** The highest-value overlooked keyword angle competitors miss */
    competitorGap: string;
    /** 2 terms to avoid in the listing */
    avoidTerms: string[];
};

// ── Listing Score ────────────────────────────────────────────────────

export type ListingScoreImprovement = {
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
    overall: number;
    grade: string;
    breakdown: {
        seo: number;
        keywords: number;
        conversion: number;
        compliance: number;
    };
    strengths: string[];
    improvements: ListingScoreImprovement[];
    verdict: string;
};

// ── Listing Output ───────────────────────────────────────────────────

export type ListingOutput = {
    seoTitle: string;
    bulletPoints: string[];
    description: string;
    metaDescription: string;
    tags: string[];
    listingScore?: ListingScore;
};

// ── Generation (DB row) ──────────────────────────────────────────────

export type Generation = {
    id: string;
    userId: string;
    status: GenerationStatus;
    platform: Platform;
    tone: Tone;
    input: GenerationInput;
    output: ListingOutput | null;
    /** Keyword intelligence results — stored separately from listing output */
    keywords: KeywordResult | null;
    tokensUsed: number | null;
    errorMessage: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type GenerationSummary = Pick<
    Generation,
    "id" | "status" | "platform" | "tone" | "createdAt"
> & {
    productName: string;
};

export type GenerationFilters = {
    platform?: Platform;
    search?: string;
};

export type PaginationParams = {
    page: number;
    limit: number;
};

export type PaginatedResult<T> = {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
};
