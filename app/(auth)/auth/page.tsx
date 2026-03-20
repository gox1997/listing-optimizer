"use client";

import { useState, useMemo } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Gem, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = useMemo(() => createClientSupabaseClient(), []);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        setIsLoading(false);
        if (error) setError(error.message);
        else setSent(true);
    };

    const handleGoogle = async () => {
        setIsGoogleLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });

        if (error) {
            setError(error.message);
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
            >
                <div
                    className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-[0.08]"
                    style={{
                        background:
                            "radial-gradient(circle, #06b6d4, transparent 70%)",
                    }}
                />
                <div
                    className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-[0.08]"
                    style={{
                        background:
                            "radial-gradient(circle, #8b5cf6, transparent 70%)",
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
                        style={{
                            background:
                                "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                        }}
                    >
                        <Gem className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        ListingGem
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        AI-powered listing optimization
                    </p>
                </div>

                {/* Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
                    {sent ? (
                        <div className="text-center py-4">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{
                                    background: "rgba(16,185,129,0.12)",
                                    border: "1px solid rgba(16,185,129,0.2)",
                                }}
                            >
                                <Mail className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="font-semibold text-foreground mb-2">
                                Check your email
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Sign-in link sent to{" "}
                                <span className="text-foreground font-medium">
                                    {email}
                                </span>
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Use a different email
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="font-semibold text-foreground mb-6 text-center">
                                Sign in to your account
                            </h2>

                            {/* Google */}
                            <button
                                onClick={handleGoogle}
                                disabled={isGoogleLoading || isLoading}
                                className={cn(
                                    "w-full flex items-center justify-center gap-3",
                                    "px-4 py-2.5 rounded-xl border border-border",
                                    "text-sm font-medium text-foreground",
                                    "bg-muted hover:bg-accent transition-colors",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                )}
                            >
                                {isGoogleLoading ? (
                                    <span className="w-4 h-4 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
                                ) : (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                )}
                                Continue with Google
                            </button>

                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">
                                    or
                                </span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            <form
                                onSubmit={handleMagicLink}
                                className="space-y-3"
                            >
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className={cn(
                                        "w-full px-3.5 py-2.5 rounded-xl border border-border",
                                        "bg-muted text-foreground placeholder:text-muted-foreground text-sm",
                                        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50",
                                        "transition-all",
                                    )}
                                />
                                <button
                                    type="submit"
                                    disabled={
                                        isLoading ||
                                        isGoogleLoading ||
                                        !email.trim()
                                    }
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2",
                                        "px-4 py-2.5 rounded-xl text-sm font-semibold text-white",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "transition-opacity",
                                    )}
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                                    }}
                                >
                                    {isLoading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Mail className="w-4 h-4" />
                                    )}
                                    Continue with Email
                                </button>
                            </form>

                            {error && (
                                <p className="mt-3 text-sm text-red-400 text-center">
                                    {error}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    By continuing you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
}
