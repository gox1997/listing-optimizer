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

export type ListingOutput = {
    seoTitle: string;
    bulletPoints: string[];
    description: string;
    metaDescription: string;
    tags: string[];
    listingScore?: ListingScore;
};

export type Generation = {
    id: string;
    userId: string;
    status: GenerationStatus;
    platform: Platform;
    tone: Tone;
    input: GenerationInput;
    output: ListingOutput | null;
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
