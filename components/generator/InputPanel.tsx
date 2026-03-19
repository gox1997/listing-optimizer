// components/generator/InputPanel.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
    onGenerate: (data: any) => void;
    isGenerating: boolean;
}

const platforms = ["Amazon", "Shopify", "Etsy"];
const tones = ["Professional", "Casual", "Luxury", "Playful", "Technical"];

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
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#F8FAFC] mb-6">
                Generate Listing
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Product Name */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#F8FAFC]">
                        Product Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        required
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2.5 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        placeholder="e.g. Wireless Bluetooth Earbuds"
                    />
                </div>

                {/* Platform & Tone */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#F8FAFC]">
                            Platform
                        </label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2.5 text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        >
                            {platforms.map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#F8FAFC]">
                            Tone
                        </label>
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2.5 text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        >
                            {tones.map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Keywords (optional) */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#F8FAFC]">
                        Keywords (comma separated)
                    </label>
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2.5 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        placeholder="wireless, bluetooth, noise cancelling"
                    />
                </div>

                {/* Description (optional) */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#F8FAFC]">
                        Product Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-2.5 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                        placeholder="Optional: describe your product in your own words..."
                    />
                </div>

                {/* Generate button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isGenerating}
                    className={cn(
                        "w-full py-3 rounded-2xl font-semibold text-white transition-all",
                        "bg-linear-to-r from-cyan-500 to-purple-600",
                        "hover:shadow-lg hover:shadow-cyan-500/20",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                >
                    {isGenerating ? "Generating..." : "Generate Listing"}
                </motion.button>
            </form>
        </div>
    );
}
