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

const MAX_FEATURES = 10;
const MAX_DESCRIPTION_LEN = 2000;
const INITIAL_FEATURE_COUNT = 3;

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
type Props = { defaultPlatform?: Platform; defaultTone?: Tone };

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
        features: Array(INITIAL_FEATURE_COUNT).fill(""),
        primaryKeyword: "",
        keywords: "",
    } satisfies FormState);

    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof FormState, string>>
    >({});
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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

    const handleSubmit = useCallback(async () => {
        if (isLoading) return;
        setFieldErrors({});
        setGlobalError(null);

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
            if (result.error?.code === "QUOTA_EXCEEDED") {
                router.push("/upgrade?reason=quota");
                return;
            }
            setGlobalError(
                result.error?.message ??
                    "Something went wrong. Please try again.",
            );
            setIsLoading(false);
            return;
        }

        router.push(`/generate/${result.data.generation.id}`);
    }, [form, isLoading, router]);

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
                        className="text-xs text-red-400 mt-1"
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
                    className={inputClass(!!fieldErrors.productCategory)}
                />
                {fieldErrors.productCategory && (
                    <p className="text-xs text-red-400 mt-1">
                        {fieldErrors.productCategory}
                    </p>
                )}
            </FormSection>

            {/* Tone */}
            <FormSection label="Brand Tone" required>
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
                <p className="text-xs text-muted-foreground/50 text-right mt-1">
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
                                    className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
                            className="flex items-center gap-1.5 text-sm text-indigo-400/70 hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded"
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
                hint="Optional — most important keyword to rank for"
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
                    className="p-4 rounded-xl text-sm"
                    style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#fca5a5",
                    }}
                >
                    {globalError}
                </div>
            )}

            {/* ── THE GENERATE BUTTON — elite CTA ──────────────── */}
            <GenerateButton isLoading={isLoading} onClick={handleSubmit} />
        </div>
    );
}

GenerationForm.displayName = "GenerationForm";

// ── Elite Generate Button ─────────────────────────────────────────

function GenerateButton({
    isLoading,
    onClick,
}: {
    isLoading: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading}
            aria-busy={isLoading}
            className={cn(
                "group relative w-full overflow-hidden rounded-xl py-4",
                "flex items-center justify-center gap-2.5",
                "text-base font-bold text-white tracking-wide",
                "transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed",
                isLoading ? "opacity-90" : "hover:-translate-y-0.5",
            )}
            style={{
                background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
                boxShadow: isLoading
                    ? "0 0 20px rgba(139,92,246,0.3)"
                    : "0 0 40px rgba(139,92,246,0.4), 0 0 80px rgba(99,102,241,0.2)",
            }}
        >
            {!isLoading && (
                <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer-sweep 2.4s ease-in-out infinite",
                    }}
                    aria-hidden="true"
                />
            )}
            <span
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: "rgba(255,255,255,0.35)" }}
                aria-hidden="true"
            />
            {isLoading ? (
                <>
                    <span
                        className="relative w-5 h-5 shrink-0"
                        aria-hidden="true"
                    >
                        <span className="absolute inset-0 rounded-full border-2 border-white/20" />
                        <span
                            className="absolute inset-0 rounded-full border-2 border-transparent border-t-white"
                            style={{ animation: "spin 0.8s linear infinite" }}
                        />
                        <span className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                    </span>
                    <span className="font-semibold tracking-normal">
                        Generating your listing
                        <DotPulse />
                    </span>
                </>
            ) : (
                <>
                    <Sparkles
                        className="w-5 h-5 shrink-0 text-indigo-100"
                        aria-hidden="true"
                    />
                    <span>Generate Listing</span>
                    <span
                        className="text-white/70 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                    >
                        →
                    </span>
                </>
            )}
        </button>
    );
}

// Animated "..." for loading state
function DotPulse() {
    return (
        <span className="inline-flex gap-0.5 ml-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="inline-block w-1 h-1 rounded-full bg-white/70"
                    style={{
                        animation: "dot-pulse 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                    }}
                />
            ))}
        </span>
    );
}

// ── Form helpers ──────────────────────────────────────────────────

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
            <div className="flex items-baseline gap-1.5 flex-wrap">
                {inputId ? (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-semibold text-foreground"
                    >
                        {label}
                    </label>
                ) : (
                    <span className="text-sm font-semibold text-foreground">
                        {label}
                    </span>
                )}
                {required && (
                    <span className="text-xs text-red-400" aria-hidden="true">
                        *
                    </span>
                )}
                {hint && !error && (
                    <span className="text-xs text-muted-foreground/60">
                        {hint}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

function inputClass(hasError: boolean) {
    return cn(
        "w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground",
        "placeholder:text-muted-foreground/40 transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        hasError
            ? "border border-red-500/50 bg-red-500/5 focus:ring-red-500/40"
            : "border border-border bg-muted/30 focus:ring-indigo-500/40 focus:border-indigo-500/40",
    );
}
