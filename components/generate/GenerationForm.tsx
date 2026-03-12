// components/generate/GenerationForm.tsx
"use client";

import { useState, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { PlatformSelector } from "./PlatformSelector";
import { ToneSelector } from "./ToneSelector";
import { apiPost } from "@/lib/utils/api";
import { cn } from "@/lib/utils/cn";
import { Sparkles, Plus, X } from "lucide-react";
import type { Platform, Tone } from "@/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const MAX_FEATURES = 10;
const MAX_DESCRIPTION_LEN = 2000;
const INITIAL_FEATURE_COUNT = 3;

/* ------------------------------------------------------------------ */
/*  Validation schema — mirrors server schema                          */
/* ------------------------------------------------------------------ */

const FormSchema = z.object({
    productName: z
        .string()
        .min(1, "Product name is required")
        .max(200, "Too long"),
    productCategory: z
        .string()
        .min(1, "Category is required")
        .max(100, "Too long"),
    platform: z.enum(["amazon", "shopify", "etsy", "general"]),
    tone: z.enum(["professional", "casual", "luxury", "playful", "technical"]),
    description: z.string().max(MAX_DESCRIPTION_LEN).optional(),
    features: z.array(z.string().max(300)).max(MAX_FEATURES).optional(),
    primaryKeyword: z.string().max(100).optional(),
    keywords: z.string().optional(),
});

type FormState = z.infer<typeof FormSchema>;

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

type Props = {
    defaultPlatform?: Platform;
    defaultTone?: Tone;
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function GenerationForm({
    defaultPlatform = "amazon",
    defaultTone = "professional",
}: Props) {
    const router = useRouter();
    const formId = useId();

    const [form, setForm] = useState<FormState>({
        productName: "",
        productCategory: "",
        platform: defaultPlatform,
        tone: defaultTone,
        description: "",
        features: Array(INITIAL_FEATURE_COUNT).fill("") as string[],
        primaryKeyword: "",
        keywords: "",
    } satisfies FormState);

    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof FormState, string>>
    >({});
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    /* ── Updaters ───────────────────────────────────────────────────── */

    const update = useCallback(
        <K extends keyof FormState>(key: K, value: FormState[K]) =>
            setForm((prev) => ({ ...prev, [key]: value })),
        [],
    );

    const updateFeature = useCallback((index: number, value: string) => {
        setForm((prev) => {
            const next = [...(prev.features ?? [])];
            next[index] = value;
            return { ...prev, features: next };
        });
    }, []);

    const addFeature = useCallback(() => {
        setForm((prev) => {
            const features = prev.features ?? [];
            if (features.length >= MAX_FEATURES) return prev;
            return { ...prev, features: [...features, ""] };
        });
    }, []);

    const removeFeature = useCallback((index: number) => {
        setForm((prev) => ({
            ...prev,
            features: (prev.features ?? []).filter((_, i) => i !== index),
        }));
    }, []);

    /* ── Submit ─────────────────────────────────────────────────────── */

    const handleSubmit = useCallback(async () => {
        if (isLoading) return;

        setFieldErrors({});
        setGlobalError(null);

        // Client-side validation via Zod
        const parsed = FormSchema.safeParse(form);

        if (!parsed.success) {
            const errors: Partial<Record<keyof FormState, string>> = {};
            for (const err of parsed.error.errors) {
                const field = err.path[0] as keyof FormState;
                if (!errors[field]) errors[field] = err.message;
            }
            setFieldErrors(errors);
            return;
        }

        setIsLoading(true);

        const payload = {
            productName: parsed.data.productName.trim(),
            productCategory: parsed.data.productCategory.trim(),
            platform: parsed.data.platform,
            tone: parsed.data.tone,
            description: parsed.data.description?.trim() || undefined,
            features: (parsed.data.features ?? []).filter((f) => f.trim()),
            primaryKeyword: parsed.data.primaryKeyword?.trim() || undefined,
            keywords: parsed.data.keywords
                ? parsed.data.keywords
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean)
                : undefined,
        };

        const result = await apiPost<{ generation: { id: string } }>(
            "/api/generate",
            payload,
        );

        if (!result.success) {
            // @ts-expect-error — code is present on generation errors
            if (result.error?.code === "quota_exceeded") {
                router.push("/upgrade?reason=quota");
                return;
            }
            console.error("[GenerationForm] Generation failed:", result.error);
            setGlobalError(
                typeof result.error === "string"
                    ? result.error
                    : "Something went wrong. Please try again.",
            );
            setIsLoading(false);
            return;
        }

        router.push(`/generate/${result.data.generation.id}`);
    }, [form, isLoading, router]);

    /* ── Render ─────────────────────────────────────────────────────── */

    return (
        <div className="space-y-8">
            {/* Platform */}
            <FormSection label="Platform" required>
                <PlatformSelector
                    value={form.platform as Platform}
                    onChange={(v) => update("platform", v)}
                    disabled={isLoading}
                />
            </FormSection>

            {/* Product Name */}
            <FormSection
                label="Product Name"
                inputId={`${formId}-name`}
                error={fieldErrors.productName}
                required
            >
                <input
                    id={`${formId}-name`}
                    type="text"
                    value={form.productName}
                    onChange={(e) => update("productName", e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g. Stainless Steel Insulated Water Bottle 32oz"
                    maxLength={200}
                    aria-invalid={!!fieldErrors.productName}
                    aria-describedby={
                        fieldErrors.productName
                            ? `${formId}-name-error`
                            : undefined
                    }
                    className={inputClass(!!fieldErrors.productName)}
                />
                {fieldErrors.productName && (
                    <p
                        id={`${formId}-name-error`}
                        className="text-xs text-red-600 mt-1"
                    >
                        {fieldErrors.productName}
                    </p>
                )}
            </FormSection>

            {/* Category */}
            <FormSection
                label="Category"
                inputId={`${formId}-category`}
                error={fieldErrors.productCategory}
                required
            >
                <input
                    id={`${formId}-category`}
                    type="text"
                    value={form.productCategory}
                    onChange={(e) => update("productCategory", e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g. Kitchen & Dining, Sports & Outdoors"
                    maxLength={100}
                    aria-invalid={!!fieldErrors.productCategory}
                    aria-describedby={
                        fieldErrors.productCategory
                            ? `${formId}-category-error`
                            : undefined
                    }
                    className={inputClass(!!fieldErrors.productCategory)}
                />
                {fieldErrors.productCategory && (
                    <p
                        id={`${formId}-category-error`}
                        className="text-xs text-red-600 mt-1"
                    >
                        {fieldErrors.productCategory}
                    </p>
                )}
            </FormSection>

            {/* Tone */}
            <FormSection label="Brand Tone">
                <ToneSelector
                    value={form.tone as Tone}
                    onChange={(v) => update("tone", v)}
                    disabled={isLoading}
                />
            </FormSection>

            {/* Description */}
            <FormSection
                label="Product Description"
                inputId={`${formId}-description`}
                hint="Optional — describe your product in your own words"
            >
                <textarea
                    id={`${formId}-description`}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    disabled={isLoading}
                    placeholder="Tell the AI about your product, its benefits, what makes it unique..."
                    rows={4}
                    maxLength={MAX_DESCRIPTION_LEN}
                    className={cn(inputClass(false), "resize-none")}
                />
                <p className="text-xs text-slate-400 text-right mt-1">
                    {(form.description ?? "").length}/{MAX_DESCRIPTION_LEN}
                </p>
            </FormSection>

            {/* Features */}
            <FormSection
                label="Key Features"
                hint="Optional — one feature per line"
            >
                <div className="space-y-2">
                    {(form.features ?? []).map((f, i) => (
                        <div key={i} className="flex gap-2">
                            <input
                                type="text"
                                value={f}
                                onChange={(e) =>
                                    updateFeature(i, e.target.value)
                                }
                                disabled={isLoading}
                                placeholder={`Feature ${i + 1}`}
                                maxLength={300}
                                aria-label={`Feature ${i + 1}`}
                                className={cn(inputClass(false), "flex-1")}
                            />
                            {(form.features ?? []).length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeFeature(i)}
                                    disabled={isLoading}
                                    aria-label={`Remove feature ${i + 1}`}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                                >
                                    <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    ))}

                    {(form.features ?? []).length < MAX_FEATURES && (
                        <button
                            type="button"
                            onClick={addFeature}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
                        >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                            Add feature
                        </button>
                    )}
                </div>
            </FormSection>

            {/* Primary Keyword */}
            <FormSection
                label="Primary Keyword"
                inputId={`${formId}-primary-kw`}
                hint="Optional — the single most important keyword to rank for"
            >
                <input
                    id={`${formId}-primary-kw`}
                    type="text"
                    value={form.primaryKeyword}
                    onChange={(e) => update("primaryKeyword", e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g. insulated water bottle"
                    maxLength={100}
                    className={inputClass(false)}
                />
            </FormSection>

            {/* Secondary Keywords */}
            <FormSection
                label="Secondary Keywords"
                inputId={`${formId}-keywords`}
                hint="Optional — comma separated"
            >
                <input
                    id={`${formId}-keywords`}
                    type="text"
                    value={form.keywords}
                    onChange={(e) => update("keywords", e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g. BPA free, leak proof, gym bottle, hiking"
                    className={inputClass(false)}
                />
            </FormSection>

            {/* Global error */}
            {globalError && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                >
                    {globalError}
                </div>
            )}

            {/* Submit */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                aria-busy={isLoading}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-4",
                    "bg-slate-900 text-white rounded-xl font-semibold text-sm",
                    "hover:bg-slate-700 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                )}
            >
                {isLoading ? (
                    <>
                        <span
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            aria-hidden="true"
                        />
                        Generating your listing...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                        Generate Listing
                    </>
                )}
            </button>
        </div>
    );
}

GenerationForm.displayName = "GenerationForm";

/* ------------------------------------------------------------------ */
/*  FormSection                                                         */
/* ------------------------------------------------------------------ */

function FormSection({
    label,
    inputId,
    hint,
    error,
    required,
    children,
}: {
    label: string;
    inputId?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-baseline gap-1 flex-wrap">
                {inputId ? (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-semibold text-slate-900"
                    >
                        {label}
                    </label>
                ) : (
                    <span className="text-sm font-semibold text-slate-900">
                        {label}
                    </span>
                )}
                {required && (
                    <span className="text-xs text-red-500" aria-hidden="true">
                        *
                    </span>
                )}
                {hint && !error && (
                    <span className="text-xs text-slate-400 ml-1">{hint}</span>
                )}
            </div>
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  inputClass                                                          */
/* ------------------------------------------------------------------ */

function inputClass(hasError: boolean) {
    return cn(
        "w-full px-3 py-2.5 rounded-xl border text-sm text-slate-900",
        "placeholder:text-slate-400 transition-shadow",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        hasError
            ? "border-red-300 focus:ring-red-500"
            : "border-slate-200 focus:ring-slate-900 focus:border-transparent",
    );
}
