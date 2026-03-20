import { cn } from "@/lib/utils/cn";

type Props = {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
    /** true = border shifts/animates. false = static gradient border. */
    animated?: boolean;
};

// Not a client component — animation is pure CSS referencing keyframe in globals.css
export function GradientBorderCard({
    children,
    className,
    innerClassName,
    animated = true,
}: Props) {
    return (
        <div
            className={cn("p-px rounded-2xl", className)}
            style={{
                background:
                    "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)",
                backgroundSize: "300% 300%",
                animation: animated
                    ? "gradient-border-shift 4s ease infinite"
                    : undefined,
            }}
        >
            {/* Inner div carries the card background — 1px smaller radius than outer */}
            <div
                className={cn("h-full", innerClassName)}
                style={{
                    borderRadius: "calc(1rem - 1px)",
                    background: "rgba(11,17,32,0.97)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                }}
            >
                {children}
            </div>
        </div>
    );
}
