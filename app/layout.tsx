// app/layout.tsx
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
        default: "ListingBull — AI Listing Optimizer",
        template: "%s — ListingBull",
    },
    description:
        "Generate high-converting product listings optimized for Amazon, Shopify, Etsy and more. AI-powered SEO titles, bullet points, descriptions and tags in seconds.",
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // suppressHydrationWarning prevents hydration mismatch from
        // browser extensions or theme libraries injecting attributes
        <html
            lang="en"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable}`}
        >
            <body className="antialiased">{children}</body>
        </html>
    );
}
