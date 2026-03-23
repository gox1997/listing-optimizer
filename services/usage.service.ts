// services/usage.service.ts
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/config/plans";
import type { Plan, QuotaCheckResult, UsageStats } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminSupabaseClient() as any;

type QuotaWithPlan = QuotaCheckResult & { plan: Plan };

export async function checkQuota(userId: string): Promise<QuotaWithPlan> {
    const [subResult, usageResult] = await Promise.all([
        db()
            .from("subscriptions")
            .select("plan, current_period_end")
            .eq("user_id", userId)
            .single(),
        db()
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

export async function getUsageStats(userId: string): Promise<UsageStats> {
    const quota = await checkQuota(userId);
    const percentUsed =
        quota.limit === Infinity
            ? 0
            : Math.round((quota.used / quota.limit) * 100);
    return { ...quota, percentUsed };
}

export async function incrementUsage(userId: string): Promise<boolean> {
    for (let attempt = 1; attempt <= 2; attempt++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (db() as any).rpc("increment_usage", {
            p_user_id: userId,
        });

        if (!error) return true;

        console.error("[usage.service] increment_usage failed", {
            userId,
            attempt,
            message: error.message,
        });

        if (attempt === 1) await sleep(500);
    }

    console.error(
        "[usage.service] CRITICAL: increment_usage failed after 2 attempts.",
        { userId },
    );
    return false;
}

export async function resetUsageForNewPeriod(
    userId: string,
    periodStart: string,
    periodEnd: string,
): Promise<void> {
    const { error } = await db()
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
        throw new Error(`Failed to reset usage: ${error.message}`);
    }
}

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
