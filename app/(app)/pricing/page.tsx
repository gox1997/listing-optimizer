// app/(app)/pricing/page.tsx
import { redirect } from "next/navigation";

// Redirects to upgrade page until Stripe is wired up
export default function PricingPage() {
    redirect("/upgrade");
}
