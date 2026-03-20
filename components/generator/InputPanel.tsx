"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface InputData {
    productName: string;
    platform: string;
    tone: string;
    keywords: string;
    description: string;
}

interface Props {
    onGenerate: (data: InputData) => void;
    isGenerating: boolean;
}

const PLATFORMS = ["Amazon", "Shopify", "Etsy", "General"];
const TONES = ["Professional", "Casual", "Luxury", "Playful", "Technical"];

export function InputPanel({ onGenerate, isGenerating }: Props) {
    const [productName, setProductName] = useState("");
    const [platform, setPlatform] = useState("Amazon");
    const [tone, setTone] = useState("Professional");
    const [keywords, setKeywords] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate({ productName, platform, tone, keywords, description });
    };

    return (
        <div
            className="rounded-2xl p-6"
            style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
            }}
        >
            <h2 className="text-lg font-bold text-foreground mb-6">
                Generate Listing
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Product Name */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                        Product Name{" "}
                        <span className="text-red-400" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        required
                        placeholder="e.g. Wireless Bluetooth Earbuds"
                        className={inputCls}
                    />
                </div>

                {/* Platform + Tone row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">
                            Platform
                        </label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className={inputCls}
                        >
                            {PLATFORMS.map((p) => (
                                <option
                                    key={p}
                                    value={p}
                                    style={{
                                        background: "#0f172a",
                                        color: "#f8fafc",
                                    }}
                                >
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">
                            Tone
                        </label>
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className={inputCls}
                        >
                            {TONES.map((t) => (
                                <option
                                    key={t}
                                    value={t}
                                    style={{
                                        background: "#0f172a",
                                        color: "#f8fafc",
                                    }}
                                >
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Keywords */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                        Keywords{" "}
                        <span className="text-muted-foreground/60 text-xs font-normal">
                            — comma separated, optional
                        </span>
                    </label>
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="wireless, bluetooth, noise cancelling"
                        className={inputCls}
                    />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                        Product Description{" "}
                        <span className="text-muted-foreground/60 text-xs font-normal">
                            — optional
                        </span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe your product in your own words..."
                        className={cn(inputCls, "resize-none")}
                    />
                </div>

                {/* Generate button */}
                <motion.button
                    whileHover={{
                        scale: isGenerating ? 1 : 1.01,
                        y: isGenerating ? 0 : -1,
                    }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isGenerating || !productName.trim()}
                    aria-busy={isGenerating}
                    className="relative w-full overflow-hidden py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    style={{
                        background:
                            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
                        boxShadow: isGenerating
                            ? "none"
                            : "0 0 40px rgba(139,92,246,0.4), 0 0 80px rgba(99,102,241,0.12)",
                    }}
                >
                    {/* Shimmer sweep */}
                    {!isGenerating && (
                        <span
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                                backgroundSize: "200% 100%",
                                animation:
                                    "shimmer-sweep 2.4s ease-in-out infinite",
                            }}
                            aria-hidden="true"
                        />
                    )}
                    {/* Top specular line */}
                    <span
                        className="pointer-events-none absolute inset-x-0 top-0 h-px"
                        style={{ background: "rgba(255,255,255,0.3)" }}
                        aria-hidden="true"
                    />

                    <span className="relative flex items-center justify-center gap-2">
                        {isGenerating ? (
                            <>
                                <span
                                    className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white"
                                    style={{
                                        animation: "spin 0.8s linear infinite",
                                    }}
                                    aria-hidden="true"
                                />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                />
                                Generate Listing
                            </>
                        )}
                    </span>
                </motion.button>
            </form>
        </div>
    );
}

const inputCls =
    "w-full bg-transparent border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-150 disabled:opacity-50";
