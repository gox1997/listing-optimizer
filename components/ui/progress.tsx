import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
}
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "h-2.5 w-full overflow-hidden rounded-full bg-slate-700",
                    className,
                )}
                {...props}
            >
                <div
                    className="h-full rounded-full bg-linear-to-r from-cyan-400 to-purple-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
            </div>
        );
    },
);
Progress.displayName = "Progress";

export { Progress };
