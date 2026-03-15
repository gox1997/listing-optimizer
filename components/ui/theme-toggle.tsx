// components/ui/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        const themes: Theme[] = ["light", "dark", "system"];
        const currentIndex = themes.indexOf(theme as Theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        setTheme(nextTheme);
    };

    const getIcon = () => {
        // Use theme if available, otherwise default to 'system' to match server render
        const current = theme ?? "system";
        switch (current) {
            case "light":
                return <Sun className="w-4 h-4" />;
            case "dark":
                return <Moon className="w-4 h-4" />;
            default:
                return <Monitor className="w-4 h-4" />;
        }
    };

    const getThemeLabel = () => {
        const current = theme ?? "system";
        switch (current) {
            case "light":
                return "Light";
            case "dark":
                return "Dark";
            default:
                return "System";
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                {/* Use TooltipTrigger as the button itself – no nested <button> */}
                <TooltipTrigger
                    onClick={cycleTheme}
                    className={cn(
                        "relative overflow-hidden group",
                        "p-2 rounded-lg",
                        "bg-linear-to-br from-primary to-secondary",
                        "text-primary-foreground",
                        "shadow-md hover:shadow-lg",
                        "transition-all duration-200",
                        "hover:scale-105 active:scale-95",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "before:absolute before:inset-0",
                        "before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent",
                        "before:-translate-x-fullover:before:translate-x-[100%]",
                        "before:transition-transform before:duration-700",
                    )}
                    aria-label="Toggle theme"
                >
                    {getIcon()}
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                    <p>
                        Current:{" "}
                        <span className="font-semibold">{getThemeLabel()}</span>
                    </p>
                    <p className="text-muted-foreground">Click to cycle</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
