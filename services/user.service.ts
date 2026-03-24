// services/user.service.ts

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UserProfile, OnboardingData, UserProfileUpdate } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminSupabaseClient() as any;

// ─────────────────────────────────────────────────────────────────────────────
// getUserProfile
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserProfile(
    userId: string,
): Promise<UserProfile | null> {
    const { data, error } = await db()
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error?.code === "PGRST116") return null;
    if (error) {
        console.error("[user.service] getUserProfile failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return mapProfile(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// completeOnboarding
//
// count after .update() is always null in Supabase JS v2 — removed.
// The only reliable signal is whether error is set.
// ─────────────────────────────────────────────────────────────────────────────

export async function completeOnboarding(
    userId: string,
    data: OnboardingData,
): Promise<void> {
    const { error } = await db()
        .from("user_profiles")
        .update({
            default_platform: data.defaultPlatform,
            default_tone: data.defaultTone,
            niche: data.niche,
            onboarding_completed: true,
        })
        .eq("id", userId);

    if (error) {
        console.error("[user.service] completeOnboarding failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateUserProfile
// ─────────────────────────────────────────────────────────────────────────────

export async function updateUserProfile(
    userId: string,
    updates: UserProfileUpdate,
): Promise<UserProfile> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.displayName !== undefined)
        dbUpdates.full_name = updates.displayName;
    if (updates.avatarUrl !== undefined)
        // 👈 add this block
        dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.defaultPlatform !== undefined)
        dbUpdates.default_platform = updates.defaultPlatform;
    if (updates.defaultTone !== undefined)
        dbUpdates.default_tone = updates.defaultTone;
    if (updates.niche !== undefined) dbUpdates.niche = updates.niche;

    if (Object.keys(dbUpdates).length === 0) {
        throw new Error("updateUserProfile called with no fields to update.");
    }

    const { data, error } = await db()
        .from("user_profiles")
        .update(dbUpdates)
        .eq("id", userId)
        .select("*")
        .single();

    if (error) {
        console.error("[user.service] updateUserProfile failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to update profile: ${error.message}`);
    }

    return mapProfile(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// mapProfile — snake_case DB row → camelCase TypeScript type
// ─────────────────────────────────────────────────────────────────────────────

function mapProfile(row: Record<string, unknown>): UserProfile {
    return {
        id: row.id as string,
        email: row.email as string,
        displayName: (row.full_name as string) ?? null,
        avatarUrl: (row.avatar_url as string) ?? null,
        niche: (row.niche as UserProfile["niche"]) ?? null,
        defaultPlatform:
            (row.default_platform as UserProfile["defaultPlatform"]) ?? null,
        defaultTone: (row.default_tone as UserProfile["defaultTone"]) ?? null,
        onboardingCompleted: row.onboarding_completed as boolean,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}
