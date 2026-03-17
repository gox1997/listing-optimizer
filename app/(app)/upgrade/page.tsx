// app/(app)/upgrade/page.tsx

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSubscription } from "@/services/subscription.service";
import { UpgradeClient } from "./UpgradeClient";
import { PLAN_METADATA, annualSavingsPercent } from "@/config/plans";
import type { Metadata } from "next";
import type { Plan } from "@/types";

export const metadata: Metadata = {
    title: "Upgrade — ListingBull",
};

export default async function UpgradePage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const subscription = await getSubscription(user.id);
    const currentPlan = (subscription?.plan ?? "free") as Plan;

    // Pre-compute savings for all paid plans — used in the UI
    const savings = {
        starter: annualSavingsPercent("starter"),
        pro: annualSavingsPercent("pro"),
        growth: annualSavingsPercent("growth"),
        business: annualSavingsPercent("business"),
        agency: annualSavingsPercent("agency"),
    };

    return (
        <UpgradeClient
            currentPlan={currentPlan}
            planMetadata={PLAN_METADATA}
            savings={savings}
            hasBillingPortal={!!subscription?.stripeCustomerId}
        />
    );
}
