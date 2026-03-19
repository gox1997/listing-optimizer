// components/generator/OutputPanel.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const updateTitle = (title: string) => onChange({ ...data, title });
    const updateBullet = (index: number, value: string) => {
        const newBullets = [...data.bulletPoints];
        newBullets[index] = value;
        onChange({ ...data, bulletPoints: newBullets });
    };
    const addBullet = () => {
        onChange({ ...data, bulletPoints: [...data.bulletPoints, ""] });
    };
    const removeBullet = (index: number) => {
        const newBullets = data.bulletPoints.filter((_, i) => i !== index);
        onChange({ ...data, bulletPoints: newBullets });
    };
    const updateDescription = (description: string) =>
        onChange({ ...data, description });

    return (
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] shadow-lg p-6 space-y-6">
            {/* Copy All button */}
            <div className="flex justify-end">
                <button
                    onClick={() =>
                        handleCopy(JSON.stringify(data, null, 2), "all")
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#334155] text-[#F8FAFC] rounded-xl hover:bg-[#475569] transition-colors"
                >
                    {copied === "all" ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                    Copy All
                </button>
            </div>

            {/* Title */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#F8FAFC]">
                        Title
                    </label>
                    <button
                        onClick={() => handleCopy(data.title, "title")}
                        className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                    >
                        {copied === "title" ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => updateTitle(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2.5 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
            </div>

            {/* Bullet points */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#F8FAFC]">
                        Bullet Points
                    </label>
                    <button
                        onClick={addBullet}
                        className="text-xs bg-[#334155] text-[#F8FAFC] px-2 py-1 rounded-lg hover:bg-[#475569]"
                    >
                        + Add
                    </button>
                </div>
                <div className="space-y-2">
                    {data.bulletPoints.map((bullet, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={bullet}
                                onChange={(e) =>
                                    updateBullet(i, e.target.value)
                                }
                                className="flex-1 bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2 text-[#F8FAFC] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            />
                            <button
                                onClick={() =>
                                    handleCopy(bullet, `bullet-${i}`)
                                }
                                className="text-[#94A3B8] hover:text-[#F8FAFC]"
                            >
                                {copied === `bullet-${i}` ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                            {data.bulletPoints.length > 1 && (
                                <button
                                    onClick={() => removeBullet(i)}
                                    className="text-[#94A3B8] hover:text-red-400"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#F8FAFC]">
                        Description
                    </label>
                    <button
                        onClick={() =>
                            handleCopy(data.description, "description")
                        }
                        className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                    >
                        {copied === "description" ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <textarea
                    value={data.description}
                    onChange={(e) => updateDescription(e.target.value)}
                    rows={5}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2.5 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
            </div>
        </div>
    );
}
