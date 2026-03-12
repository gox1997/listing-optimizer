// services/usage.service.ts

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/config/plans";
import type { Plan, QuotaCheckResult, UsageStats } from "@/types";

/* ------------------------------------------------------------------ */
/*  Internal full result                                                */
/* ------------------------------------------------------------------ */

type QuotaWithPlan = QuotaCheckResult & { plan: Plan };

/* ------------------------------------------------------------------ */
/*  checkQuota                                                          */
/* ------------------------------------------------------------------ */

export async function checkQuota(userId: string): Promise<QuotaWithPlan> {
    const supabase = await createServerSupabaseClient();

    const [subResult, usageResult] = await Promise.all([
        supabase
            .from("subscriptions")
            .select("plan, current_period_end")
            .eq("user_id", userId)
            .single(),
        supabase
            .from("usage_tracking")
            .select("generations_used, period_start, period_end")
            .eq("user_id", userId)
            .single(),
    ]);

    const plan = (subResult.data?.plan ?? "free") as Plan;
    const limit = PLAN_LIMITS[plan];
    const usage = usageResult.data;

    if (!usage) {
        console.warn("[usage.service] Missing usage row for user:", userId);

        const resetDate =
            plan !== "free" && subResult.data?.current_period_end
                ? subResult.data.current_period_end
                : getCalendarMonthEnd();

        return {
            allowed: true,
            used: 0,
            limit,
            remaining: limit === Infinity ? Infinity : limit,
            resetDate,
            plan,
        };
    }

    const used = usage.generations_used;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
    const allowed = limit === Infinity || used < limit;

    return {
        allowed,
        used,
        limit,
        remaining,
        resetDate: usage.period_end,
        plan,
    };
}

/* ------------------------------------------------------------------ */
/*  getUsageStats                                                       */
/* ------------------------------------------------------------------ */

export async function getUsageStats(userId: string): Promise<UsageStats> {
    const quota = await checkQuota(userId);

    const percentUsed =
        quota.limit === Infinity
            ? 0
            : Math.round((quota.used / quota.limit) * 100);

    return { ...quota, percentUsed };
}

/* ------------------------------------------------------------------ */
/*  incrementUsage                                                      */
/*  Cast to any on rpc() — we have no generated DB types yet           */
/* ------------------------------------------------------------------ */

export async function incrementUsage(userId: string): Promise<void> {
    const admin = createAdminSupabaseClient();

    for (let attempt = 1; attempt <= 2; attempt++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (admin as any).rpc("increment_usage", {
            p_user_id: userId,
        });

        if (!error) return;

        console.error("[usage.service] increment_usage failed", {
            userId,
            attempt,
            message: error.message,
            details: error.details,
            hint: error.hint,
        });

        if (attempt === 1) await sleep(500);
    }

    console.error(
        "[usage.service] CRITICAL: increment_usage failed after 2 attempts.",
        { userId },
    );
}

/* ------------------------------------------------------------------ */
/*  resetUsageForNewPeriod                                              */
/*  Cast to any on update() — no generated DB types yet                */
/* ------------------------------------------------------------------ */

export async function resetUsageForNewPeriod(
    userId: string,
    periodStart: string,
    periodEnd: string,
): Promise<void> {
    const admin = createAdminSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
        .from("usage_tracking")
        .update({
            generations_used: 0,
            period_start: periodStart,
            period_end: periodEnd,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

    if (error) {
        console.error("[usage.service] resetUsageForNewPeriod failed", {
            userId,
            periodStart,
            periodEnd,
            message: error.message,
        });
    }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getCalendarMonthEnd(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
