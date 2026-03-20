"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface OutputData {
    title: string;
    bulletPoints: string[];
    description: string;
}

interface Props {
    data: OutputData;
    onChange: (data: OutputData) => void;
}

export function OutputPanel({ data, onChange }: Props) {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const updateTitle = (title: string) => onChange({ ...data, title });
    const updateDescription = (description: string) =>
        onChange({ ...data, description });
    const updateBullet = (index: number, value: string) => {
        const next = [...data.bulletPoints];
        next[index] = value;
        onChange({ ...data, bulletPoints: next });
    };
    const addBullet = () =>
        onChange({ ...data, bulletPoints: [...data.bulletPoints, ""] });
    const removeBullet = (i: number) =>
        onChange({
            ...data,
            bulletPoints: data.bulletPoints.filter((_, idx) => idx !== i),
        });

    const copyAll = () =>
        handleCopy(
            `Title:\n${data.title}\n\nBullets:\n${data.bulletPoints.join("\n")}\n\nDescription:\n${data.description}`,
            "all",
        );

    return (
        <div
            className="rounded-2xl p-6 space-y-6"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
            }}
        >
            {/* Copy All */}
            <div className="flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={copyAll}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                        copied === "all"
                            ? "text-emerald-400"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                    style={{
                        background:
                            copied === "all"
                                ? "rgba(16,185,129,0.1)"
                                : "rgba(255,255,255,0.05)",
                        border:
                            copied === "all"
                                ? "1px solid rgba(16,185,129,0.2)"
                                : "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    {copied === "all" ? (
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    Copy All
                </motion.button>
            </div>

            {/* Title */}
            <OutputSection
                label="SEO Title"
                onCopy={() => handleCopy(data.title, "title")}
                copied={copied === "title"}
                accentColor="#6366f1"
            >
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => updateTitle(e.target.value)}
                    className={inputCls}
                    placeholder="Generated SEO title..."
                />
                <p className="text-xs text-muted-foreground/40 text-right mt-1">
                    {data.title.length} chars
                </p>
            </OutputSection>

            {/* Bullet Points */}
            <OutputSection
                label="Bullet Points"
                onCopy={() =>
                    handleCopy(data.bulletPoints.join("\n"), "bullets")
                }
                copied={copied === "bullets"}
                accentColor="#8b5cf6"
                action={
                    <button
                        onClick={addBullet}
                        className="flex items-center gap-1 text-xs text-indigo-400/70 hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded"
                    >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        Add
                    </button>
                }
            >
                <div className="space-y-2">
                    {data.bulletPoints.map((bullet, i) => (
                        <div key={i} className="flex items-center gap-2 group">
                            <span
                                className="shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                                style={{
                                    background: "rgba(139,92,246,0.15)",
                                    color: "#a78bfa",
                                    border: "1px solid rgba(139,92,246,0.2)",
                                }}
                                aria-hidden="true"
                            >
                                {i + 1}
                            </span>
                            <input
                                type="text"
                                value={bullet}
                                onChange={(e) =>
                                    updateBullet(i, e.target.value)
                                }
                                className={cn(inputCls, "flex-1 text-sm")}
                                placeholder={`Bullet point ${i + 1}`}
                                aria-label={`Bullet point ${i + 1}`}
                            />
                            <button
                                onClick={() => handleCopy(bullet, `b${i}`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                                aria-label={`Copy bullet ${i + 1}`}
                            >
                                {copied === `b${i}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                )}
                            </button>
                            {data.bulletPoints.length > 1 && (
                                <button
                                    onClick={() => removeBullet(i)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                                    aria-label={`Remove bullet ${i + 1}`}
                                >
                                    <X
                                        className="w-3.5 h-3.5"
                                        aria-hidden="true"
                                    />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </OutputSection>

            {/* Description */}
            <OutputSection
                label="Description"
                onCopy={() => handleCopy(data.description, "description")}
                copied={copied === "description"}
                accentColor="#a78bfa"
            >
                <textarea
                    value={data.description}
                    onChange={(e) => updateDescription(e.target.value)}
                    rows={5}
                    className={cn(inputCls, "resize-none")}
                    placeholder="Generated product description..."
                />
                <p className="text-xs text-muted-foreground/40 text-right mt-1">
                    {
                        data.description.trim().split(/\s+/).filter(Boolean)
                            .length
                    }{" "}
                    words
                </p>
            </OutputSection>
        </div>
    );
}

// ── Shared section wrapper ────────────────────────────────────────

function OutputSection({
    label,
    onCopy,
    copied,
    accentColor,
    action,
    children,
}: {
    label: string;
    onCopy: () => void;
    copied: boolean;
    accentColor: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-xl p-4 space-y-3"
            style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
            }}
        >
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: accentColor }}
                        aria-hidden="true"
                    />
                    <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: accentColor, opacity: 0.85 }}
                    >
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {action}
                    <button
                        onClick={onCopy}
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                            copied
                                ? "text-emerald-400"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                        )}
                        aria-label={`Copy ${label}`}
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {children}
        </div>
    );
}

// ── Shared input style ────────────────────────────────────────────

const inputCls =
    "w-full bg-transparent border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-150";
