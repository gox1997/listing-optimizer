"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface Props {
    children: [ReactNode, ReactNode];
    className?: string;
}

export function GeneratorLayout({ children, className }: Props) {
    const [left, right] = children;

    return (
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 py-8", className)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                >
                    {left}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        duration: 0.35,
                        ease: "easeOut",
                        delay: 0.08,
                    }}
                >
                    {right}
                </motion.div>
            </div>
        </div>
    );
}
