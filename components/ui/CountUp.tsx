"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
    target: number;
    duration?: number;
    className?: string;
};

export function CountUp({ target, duration = 900, className }: Props) {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic — fast start, smooth finish
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return <span className={className}>{value}</span>;
}
