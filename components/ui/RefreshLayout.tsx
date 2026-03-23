// components/ui/RefreshLayout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Calls router.refresh() once on mount.
 * Forces Next.js to re-execute all server components for the current route,
 * including the layout — so the sidebar usage count reflects the latest DB state.
 * Renders nothing.
 */
export function RefreshLayout() {
    const router = useRouter();

    useEffect(() => {
        router.refresh();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}
