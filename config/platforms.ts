import type { Platform } from "@/types";

export type PlatformConfig = {
    value: Platform;
    label: string;
    description: string;
    icon: string; // Lucide icon name
};

export const PLATFORMS: PlatformConfig[] = [
    {
        value: "amazon",
        label: "Amazon",
        description:
            "Optimized for A9 algorithm, ASIN titles, backend keywords",
        icon: "ShoppingCart",
    },
    {
        value: "shopify",
        label: "Shopify",
        description:
            "SEO-focused for Google, clean HTML descriptions, meta tags",
        icon: "Store",
    },
    {
        value: "etsy",
        label: "Etsy",
        description: "Tag-driven discovery, artisan voice, exactly 13 tags",
        icon: "Scissors",
    },
    {
        value: "general",
        label: "General",
        description: "Universal best practices, works on any platform",
        icon: "Globe",
    },
];
