// Formats a date string into a readable date
// e.g. "2024-03-08T12:00:00Z" -> "Mar 8, 2024"
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// Formats a date as relative time
// e.g. "2 hours ago", "3 days ago", "just now"
export function formatRelativeTime(dateString: string): string {
    const now = Date.now();
    const date = new Date(dateString).getTime();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
        return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    // Fall back to absolute date for anything older than 30 days
    return formatDate(dateString);
}

// Formats a number as USD currency
// e.g. 29 -> "$29.00"
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

// Formats a large number with commas
// e.g. 1000 -> "1,000"
export function formatNumber(num: number): string {
    return new Intl.NumberFormat("en-US").format(num);
}

// Formats a percentage
// e.g. 0.75 -> "75%"
export function formatPercent(value: number, total: number): string {
    if (total === 0) return "0%";
    const pct = Math.round((value / total) * 100);
    return `${pct}%`;
}
