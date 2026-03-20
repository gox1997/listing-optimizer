import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "ListingGem — AI Listing Optimizer",
        template: "%s — ListingGem",
    },
    description:
        "Generate high-converting product listings for Amazon, Shopify, and Etsy in seconds. AI-powered SEO titles, bullet points, descriptions and tags that rank higher and convert better.",
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    openGraph: {
        title: "ListingGem — AI Listing Optimizer",
        description: "AI-powered listings that rank and convert.",
        siteName: "ListingGem",
    },
    twitter: { card: "summary_large_image" },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            // dark class activates the design system — always dark
            className={`dark ${geistSans.variable} ${geistMono.variable}`}
            suppressHydrationWarning
        >
            <body className="antialiased bg-background text-foreground">
                {children}
            </body>
        </html>
    );
}
