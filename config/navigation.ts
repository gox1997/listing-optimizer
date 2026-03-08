export type NavItem = {
    href: string;
    label: string;
    icon: string; // Lucide icon name
    badge?: string; // Optional tag shown next to the label e.g. "Business"
    requiresPlan?: string; // If set, show a lock icon for users below this plan
};

export const SIDEBAR_LINKS: NavItem[] = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
    },
    {
        href: "/generate",
        label: "New Listing",
        icon: "Sparkles",
    },
    {
        href: "/history",
        label: "History",
        icon: "History",
    },
    {
        href: "/bulk",
        label: "Bulk Generate",
        icon: "Layers",
        badge: "Business",
        requiresPlan: "business",
    },
    {
        href: "/settings",
        label: "Settings",
        icon: "Settings",
    },
];

export const APP_NAME = "ListingAI";
export const APP_DESCRIPTION = "AI-powered ecommerce listing optimizer";
